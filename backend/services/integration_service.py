"""
Integration business logic — OAuth, connect/disconnect, listing.
"""
import json
import os
import secrets
import time
from base64 import urlsafe_b64encode
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode

import httpx

# Fail fast on slow external APIs (Gmail, GitHub, etc.) instead of hanging page loads.
HTTP_TIMEOUT = httpx.Timeout(8.0, connect=3.0)

# ── Shared persistent HTTP client ──────────────────────────────────────────────
# A single AsyncClient is created at startup and reused across all requests.
# This allows httpx to pool TCP/TLS connections so repeated calls to the same
# host (Gmail, GitHub, Google Calendar) skip the handshake.
# The client is closed gracefully during FastAPI lifespan shutdown.
_SHARED_CLIENT: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    """Return the shared AsyncClient, creating it lazily if necessary."""
    global _SHARED_CLIENT
    if _SHARED_CLIENT is None or _SHARED_CLIENT.is_closed:
        _SHARED_CLIENT = httpx.AsyncClient(
            timeout=HTTP_TIMEOUT,
            limits=httpx.Limits(
                max_keepalive_connections=20,
                max_connections=40,
                keepalive_expiry=30,
            ),
        )
    return _SHARED_CLIENT


async def startup_http_client() -> None:
    """Call from FastAPI lifespan startup to pre-warm the shared client."""
    _get_client()


async def shutdown_http_client() -> None:
    """Call from FastAPI lifespan shutdown to close the shared client cleanly."""
    global _SHARED_CLIENT
    if _SHARED_CLIENT and not _SHARED_CLIENT.is_closed:
        await _SHARED_CLIENT.aclose()
    _SHARED_CLIENT = None


# Legacy context-manager shim — kept so that any code still using
#   async with _http_client() as client: ...
# continues to work unchanged.  It returns the shared client without closing it
# when the context exits.
class _SharedClientContext:
    async def __aenter__(self) -> httpx.AsyncClient:
        return _get_client()

    async def __aexit__(self, *_) -> None:
        pass  # do NOT close — the shared client must stay open


def _http_client() -> "_SharedClientContext":
    return _SharedClientContext()

from core.config import settings
from core.crypto import decrypt_value, encrypt_value
from core.exceptions import ExternalServiceException, NotFoundException, ValidationException
from core.integrations_registry import PLATFORMS, get_platform, list_platforms
from models.integration import UserIntegration
from repositories.integration_repository import integration_repository

# File-backed OAuth state store — survives server restarts.
# In production, replace with Redis.
_STATE_TTL_SECONDS = 600
_OAUTH_STATE_FILE = os.path.join(os.path.dirname(__file__), "..", "oauth_states.json")


def _load_oauth_states() -> Dict[str, Dict[str, Any]]:
    """Load OAuth states from file, returning empty dict on any error."""
    try:
        if os.path.exists(_OAUTH_STATE_FILE):
            with open(_OAUTH_STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save_oauth_states(states: Dict[str, Dict[str, Any]]) -> None:
    """Persist OAuth states to file."""
    try:
        with open(_OAUTH_STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(states, f)
    except Exception:
        pass


def _cleanup_oauth_states() -> None:
    now = time.time()
    states = _load_oauth_states()
    expired = [k for k, v in states.items() if now - v.get("createdAt", 0) > _STATE_TTL_SECONDS]
    for key in expired:
        states.pop(key, None)
    if expired:
        _save_oauth_states(states)


def _format_relative_sync(last_sync: Optional[datetime]) -> Optional[str]:
    if not last_sync:
        return None
    if last_sync.tzinfo is None:
        last_sync = last_sync.replace(tzinfo=timezone.utc)
    delta = datetime.now(timezone.utc) - last_sync.astimezone(timezone.utc)
    minutes = int(delta.total_seconds() // 60)
    if minutes < 1:
        return "Just now"
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}h ago"
    return last_sync.strftime("%b %d")


class IntegrationService:
    def list_catalog(self) -> List[Dict[str, Any]]:
        return [
            {
                "platform": slug,
                "displayName": meta["displayName"],
                "description": meta["description"],
                "category": meta["category"],
                "available": meta["available"],
                "scopes": meta.get("scopes", []),
            }
            for slug, meta in PLATFORMS.items()
        ]

    async def list_for_user(self, uid: str) -> List[Dict[str, Any]]:
        rows: List[UserIntegration] = []
        try:
            rows = await integration_repository.list_for_user(uid)
        except Exception:
            rows = []
        return await self.build_integrations_list_from_records(rows)

    async def build_integrations_list_from_records(
        self, records: List[UserIntegration]
    ) -> List[Dict[str, Any]]:
        """
        Build the integrations panel list from an already-fetched list of
        UserIntegration records.  This avoids querying Firestore again when the
        dashboard has already called integration_repository.list_for_user().
        The output is identical to list_for_user().
        """
        connected = {
            row.platform: row
            for row in records
            if row.status == "connected"
        }
        items = []
        for slug in list_platforms():
            meta = PLATFORMS[slug]
            record = connected.get(slug)
            is_connected = record is not None and record.status == "connected"
            items.append(
                {
                    "platform": slug,
                    "displayName": meta["displayName"],
                    "description": meta["description"],
                    "category": meta["category"],
                    "available": meta["available"],
                    "connected": is_connected,
                    "status": record.status if record else "disconnected",
                    "accountLabel": record.account_label if record else None,
                    "lastSyncAt": record.last_sync_at.isoformat() if record and record.last_sync_at else None,
                    "lastSyncLabel": _format_relative_sync(record.last_sync_at) if record else None,
                    "lastSyncStatus": record.last_sync_status if record else None,
                    "lastSyncError": record.last_sync_error if record else None,
                    "healthScore": 100 if is_connected and record.last_sync_status == "success" else 60 if is_connected else 0,
                    "healthStatus": "healthy" if is_connected and record.last_sync_status == "success" else "warning" if is_connected else "disconnected",
                    "scopes": record.scopes if record else meta.get("scopes", []),
                }
            )
        return items

    async def disconnect(self, uid: str, platform: str) -> None:
        get_platform(platform)
        record = await integration_repository.get(uid, platform)
        if not record or record.status != "connected":
            raise NotFoundException(f"Integration '{platform}' is not connected")
        if record.refresh_token_enc:
            await self._revoke_provider_token(platform, decrypt_value(record.refresh_token_enc))
        await integration_repository.delete(uid, platform)

    async def request_integration(self, uid: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "uid": uid,
            "name": body.get("name"),
            "useCase": body.get("useCase"),
            "email": body.get("email"),
            "status": "submitted",
            "submittedAt": datetime.now(timezone.utc).isoformat(),
        }

    async def _get_valid_google_token(self, uid: str, platform: str, record) -> str:
        """Return a valid access token, refreshing it if it has expired or is near expiry."""
        now = datetime.now(timezone.utc)
        # Refresh if token expires within 5 minutes
        needs_refresh = (
            record.token_expires_at is not None
            and record.token_expires_at.replace(tzinfo=timezone.utc) <= now + timedelta(minutes=5)
        )
        if needs_refresh and record.refresh_token_enc:
            refresh_token = decrypt_value(record.refresh_token_enc)
            try:
                async with _http_client() as client:
                    resp = await client.post(
                        "https://oauth2.googleapis.com/token",
                        data={
                            "client_id": settings.GOOGLE_CLIENT_ID,
                            "client_secret": settings.GOOGLE_CLIENT_SECRET,
                            "refresh_token": refresh_token,
                            "grant_type": "refresh_token",
                        },
                    )
                    resp.raise_for_status()
                    new_tokens = resp.json()
                    new_access = new_tokens.get("access_token", "")
                    expires_in = int(new_tokens.get("expires_in", 3600))
                    record.access_token_enc = encrypt_value(new_access)
                    record.token_expires_at = now + timedelta(seconds=expires_in)
                    record.last_sync_at = now
                    record.last_sync_status = "success"
                    await integration_repository.upsert(record)
                    return new_access
            except Exception as e:
                logger.warning(f"Token refresh failed for {platform}: {e}")
                # If refresh fails with 400, the refresh token is invalid - user must reconnect
                if "400" in str(e) or "Bad Request" in str(e):
                    raise HTTPException(
                        status_code=401,
                        detail=f"Your {platform.replace('_', ' ').title()} connection has expired. Please reconnect it in the Integrations page."
                    )
        return decrypt_value(record.access_token_enc) if record.access_token_enc else ""

    async def list_user_emails(self, uid: str) -> List[Dict[str, Any]]:
        try:
            record = await integration_repository.get(uid, "gmail")
            if not record or record.status != "connected":
                return []
            token = await self._get_valid_google_token(uid, "gmail", record)
            if not token:
                return []
            messages = await self._fetch_gmail_messages(token)
            return [self._normalize_gmail_message(message) for message in messages]
        except Exception:
            return []

    async def list_user_events(self, uid: str) -> List[Dict[str, Any]]:
        try:
            record = await integration_repository.get(uid, "google_calendar")
            if not record or record.status != "connected":
                return []
            token = await self._get_valid_google_token(uid, "google_calendar", record)
            if not token:
                return []
            events = await self._fetch_google_calendar_events(token)
            return [self._normalize_google_calendar_event(event) for event in events]
        except Exception:
            return []

    async def create_user_event(self, uid: str, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create an event in a connected Google Calendar, if present."""
        record = await integration_repository.get(uid, "google_calendar")
        if not record or record.status != "connected":
            return None
        title, start, end = (event.get("title") or "").strip(), event.get("start"), event.get("end")
        if not title or not start or not end:
            raise ValidationException("Connected calendar events require title, start, and end ISO timestamps")
        token = await self._get_valid_google_token(uid, "google_calendar", record)
        if not token:
            raise ValidationException("Google Calendar integration is missing an access token")
        payload = {
            "summary": title, "description": event.get("description"),
            "start": {"dateTime": start, "timeZone": event.get("timezone", "UTC")},
            "end": {"dateTime": end, "timeZone": event.get("timezone", "UTC")},
            "attendees": [{"email": email} for email in event.get("attendees", [])],
        }
        async with _http_client() as client:
            response = await client.post(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                json=payload, headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
        return self._normalize_google_calendar_event(response.json())

    async def send_gmail_message(self, uid: str, to: str, subject: str, body: str) -> Dict[str, Any]:
        """Send an RFC 2822 email through the user's connected Gmail account."""
        record = await integration_repository.get(uid, "gmail")
        if not record or record.status != "connected":
            raise NotFoundException("Gmail is not connected")
        if not to or not subject or not body:
            raise ValidationException("Email recipients, subject, and body are required")
        token = await self._get_valid_google_token(uid, "gmail", record)
        if not token:
            raise ValidationException("Gmail integration is missing an access token")
        
        # Get sender email from account label
        sender_email = record.account_label or "me"
        
        # Create RFC 2822 email message
        message = EmailMessage()
        message["From"] = sender_email
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)
        
        async with _http_client() as client:
            response = await client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                json={"raw": urlsafe_b64encode(message.as_bytes()).decode("ascii")},
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            result = response.json()
            
            # Add sender email to result
            result["sender"] = sender_email
            return result

    async def mark_gmail_message_read(self, uid: str, message_id: str) -> bool:
        """Mark a Gmail message as read; false means Gmail is not connected."""
        record = await integration_repository.get(uid, "gmail")
        if not record or record.status != "connected":
            return False
        token = await self._get_valid_google_token(uid, "gmail", record)
        if not token:
            raise ValidationException("Gmail integration is missing an access token")
        async with _http_client() as client:
            response = await client.post(
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
                json={"removeLabelIds": ["UNREAD"]}, headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
        return True

    async def list_user_deployments(self, uid: str) -> List[Dict[str, Any]]:
        try:
            record = await integration_repository.get(uid, "github")
            if not record or record.status != "connected":
                return []
            token = decrypt_value(record.access_token_enc) if record.access_token_enc else None
            if not token:
                return []
            projects = await self._fetch_github_projects(token)
            return [self._normalize_github_project(project) for project in projects]
        except Exception:
            return []

    async def sync_integration(self, uid: str, platform: str) -> Dict[str, Any]:
        get_platform(platform)
        record = await integration_repository.get(uid, platform)
        if not record or record.status != "connected":
            raise NotFoundException(f"Integration '{platform}' is not connected")

        record.last_sync_at = datetime.now(timezone.utc)
        record.last_sync_status = "success"
        record.last_sync_error = None
        updated = await integration_repository.upsert(record)
        return {
            "platform": platform,
            "uid": uid,
            "status": "success",
            "lastSyncAt": updated.last_sync_at.isoformat() if updated.last_sync_at else None,
            "lastSyncStatus": updated.last_sync_status,
            "lastSyncError": updated.last_sync_error,
        }

    def build_authorize_url(self, uid: str, platform: str) -> str:
        meta = get_platform(platform)
        if not meta.get("available"):
            raise ValidationException(f"Integration '{platform}' is not available yet")

        provider = meta.get("oauthProvider")
        if provider == "google":
            return self._google_authorize_url(uid, platform, meta)
        if provider == "github":
            return self._github_authorize_url(uid, platform, meta)
        if provider == "microsoft":
            return self._microsoft_authorize_url(uid, platform, meta)
        if provider == "slack":
            return self._slack_authorize_url(uid, platform, meta)
        if provider == "zoom":
            return self._zoom_authorize_url(uid, platform, meta)
        if provider == "notion":
            return self._notion_authorize_url(uid, platform, meta)
        if provider == "jira":
            return self._jira_authorize_url(uid, platform, meta)
        if provider == "trello":
            return self._trello_authorize_url(uid, platform, meta)
        raise ValidationException(f"OAuth for '{platform}' is not configured yet")

    async def handle_oauth_callback(self, platform: str, code: str, state: str) -> UserIntegration:
        _cleanup_oauth_states()
        states = _load_oauth_states()
        pending = states.pop(state, None)
        if pending:
            _save_oauth_states(states)
        if not pending:
            raise ValidationException("Invalid or expired OAuth state. Please try connecting again.")
        if pending["platform"] != platform:
            raise ValidationException("OAuth state platform mismatch")

        uid = pending["uid"]
        meta = get_platform(platform)
        provider = meta.get("oauthProvider")

        if provider == "google":
            tokens, profile = await self._exchange_google_code(code, platform, meta)
        elif provider == "github":
            tokens, profile = await self._exchange_github_code(code, meta)
        elif provider == "jira":
            tokens, profile = await self._exchange_jira_code(code, platform, meta)
        elif provider == "slack":
            tokens, profile = await self._exchange_slack_code(code, platform, meta)
        elif provider == "microsoft":
            tokens, profile = await self._exchange_microsoft_code(code, platform, meta)
        elif provider == "notion":
            tokens, profile = await self._exchange_notion_code(code, platform, meta)
        elif provider == "zoom":
            tokens, profile = await self._exchange_zoom_code(code, platform, meta)
        else:
            raise ValidationException(f"OAuth callback not supported for '{platform}'")

        expires_at = None
        if tokens.get("expires_in"):
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(tokens["expires_in"]))

        integration = UserIntegration(
            uid=uid,
            platform=platform,
            status="connected",
            connected_at=datetime.now(timezone.utc),
            last_sync_at=datetime.now(timezone.utc),
            last_sync_status="success",
            scopes=meta.get("scopes", []),
            account_label=profile.get("email") or profile.get("login"),
            account_avatar=profile.get("avatar") or profile.get("picture"),
            access_token_enc=encrypt_value(tokens.get("access_token", "")),
            refresh_token_enc=encrypt_value(tokens.get("refresh_token", "")) if tokens.get("refresh_token") else None,
            token_expires_at=expires_at,
            metadata=profile.get("metadata") or {},
        )
        try:
            print(f"[OAuth] Saving integration: uid={uid}, platform={platform}, status=connected, account={profile.get('email')}")
            result = await integration_repository.upsert(integration)
            print(f"[OAuth] Integration saved successfully: {result.platform} for user {result.uid}")
            return result
        except Exception as exc:
            print(f"[OAuth ERROR] Failed to save integration: {exc}")
            raise ExternalServiceException("Unable to save integration") from exc

    def _store_oauth_state(self, uid: str, platform: str) -> str:
        _cleanup_oauth_states()
        state = secrets.token_urlsafe(32)
        states = _load_oauth_states()
        states[state] = {
            "uid": uid,
            "platform": platform,
            "createdAt": time.time(),
        }
        _save_oauth_states(states)
        return state

    def _callback_url(self, platform: str) -> str:
        # Zoom rejects 'localhost' — requires http://127.0.0.1 instead.
        # Set ZOOM_REDIRECT_URI in .env to override just for Zoom.
        if platform == "zoom" and getattr(settings, "ZOOM_REDIRECT_URI", None):
            return settings.ZOOM_REDIRECT_URI
        base = settings.BACKEND_PUBLIC_URL.rstrip("/")
        return f"{base}{settings.API_PREFIX}/integrations/{platform}/callback"

    def _google_authorize_url(self, uid: str, platform: str, meta: Dict[str, Any]) -> str:
        if not settings.GOOGLE_CLIENT_ID:
            raise ValidationException("Google OAuth is not configured (GOOGLE_CLIENT_ID missing)")
        if not settings.GOOGLE_CLIENT_SECRET:
            raise ValidationException("Google OAuth is not configured (GOOGLE_CLIENT_SECRET missing)")
        state = self._store_oauth_state(uid, platform)
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": self._callback_url(platform),
            "response_type": "code",
            "scope": " ".join(meta.get("scopes", [])),
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    def _github_authorize_url(self, uid: str, platform: str, meta: Dict[str, Any]) -> str:
        if not settings.GITHUB_CLIENT_ID:
            raise ValidationException("GitHub OAuth is not configured (GITHUB_CLIENT_ID missing)")
        if not settings.GITHUB_CLIENT_SECRET:
            raise ValidationException("GitHub OAuth is not configured (GITHUB_CLIENT_SECRET missing)")
        state = self._store_oauth_state(uid, platform)
        params = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "redirect_uri": self._callback_url(platform),
            "scope": " ".join(meta.get("scopes", [])),
            "state": state,
        }
        return f"https://github.com/login/oauth/authorize?{urlencode(params)}"

    def _microsoft_authorize_url(self, uid: str, platform: str, meta: Dict[str, Any]) -> str:
        if not settings.MICROSOFT_CLIENT_ID:
            raise ValidationException("Microsoft OAuth is not configured (MICROSOFT_CLIENT_ID missing)")
        if not settings.MICROSOFT_TENANT_ID:
            raise ValidationException("Microsoft OAuth is not configured (MICROSOFT_TENANT_ID missing)")
        state = self._store_oauth_state(uid, platform)
        params = {
            "client_id": settings.MICROSOFT_CLIENT_ID,
            "redirect_uri": self._callback_url(platform),
            "response_type": "code",
            "scope": " ".join(meta.get("scopes", [])),
            "state": state,
            "prompt": "consent",
        }
        return f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?{urlencode(params)}"

    def _slack_authorize_url(self, uid: str, platform: str, meta: Dict[str, Any]) -> str:
        if not settings.SLACK_CLIENT_ID:
            raise ValidationException("Slack OAuth is not configured (SLACK_CLIENT_ID missing)")
        state = self._store_oauth_state(uid, platform)
        params = {
            "client_id": settings.SLACK_CLIENT_ID,
            "scope": ",".join(meta.get("scopes", [])),
            "redirect_uri": self._callback_url(platform),
            "state": state,
            "user_scope": "",
        }
        return f"https://slack.com/oauth/v2/authorize?{urlencode(params)}"

    def _zoom_authorize_url(self, uid: str, platform: str, meta: Dict[str, Any]) -> str:
        if not settings.ZOOM_CLIENT_ID:
            raise ValidationException("Zoom OAuth is not configured (ZOOM_CLIENT_ID missing)")
        state = self._store_oauth_state(uid, platform)
        params = {
            "client_id": settings.ZOOM_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": self._callback_url(platform),
            "scope": " ".join(meta.get("scopes", [])),
            "state": state,
        }
        return f"https://zoom.us/oauth/authorize?{urlencode(params)}"

    def _notion_authorize_url(self, uid: str, platform: str, meta: Dict[str, Any]) -> str:
        if not settings.NOTION_CLIENT_ID:
            raise ValidationException("Notion OAuth is not configured (NOTION_CLIENT_ID missing)")
        state = self._store_oauth_state(uid, platform)
        params = {
            "client_id": settings.NOTION_CLIENT_ID,
            "redirect_uri": self._callback_url(platform),
            "response_type": "code",
            "state": state,
            "owner": "user",
        }
        return f"https://api.notion.com/v1/oauth/authorize?{urlencode(params)}"

    def _jira_authorize_url(self, uid: str, platform: str, meta: Dict[str, Any]) -> str:
        if not settings.JIRA_CLIENT_ID:
            raise ValidationException("Jira OAuth is not configured (JIRA_CLIENT_ID missing)")
        state = self._store_oauth_state(uid, platform)
        params = {
            "audience": "api.atlassian.com",
            "client_id": settings.JIRA_CLIENT_ID,
            "scope": " ".join(meta.get("scopes", [])),
            "redirect_uri": self._callback_url(platform),
            "state": state,
            "response_type": "code",
            "prompt": "consent",
        }
        return f"https://auth.atlassian.com/authorize?{urlencode(params)}"

    def _trello_authorize_url(self, uid: str, platform: str, meta: Dict[str, Any]) -> str:
        if not settings.TRELLO_API_KEY:
            raise ValidationException("Trello OAuth is not configured (TRELLO_API_KEY missing)")
        state = self._store_oauth_state(uid, platform)
        params = {
            "key": settings.TRELLO_API_KEY,
            "name": "WorkPilot AI",
            "expiration": "never",
            "response_type": "token",
            "scope": ",".join(meta.get("scopes", ["read", "write"])),
            "callback_method": "fragment",
            "return_url": self._callback_url(platform),
        }
        return f"https://trello.com/1/authorize?{urlencode(params)}"

    async def _exchange_google_code(self, code: str, platform: str, meta: Dict[str, Any]) -> tuple:
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise ValidationException("Google OAuth credentials are not configured")
        async with _http_client() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": self._callback_url(platform),
                    "grant_type": "authorization_code",
                },
            )
            token_resp.raise_for_status()
            tokens = token_resp.json()

            profile_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            profile_resp.raise_for_status()
            profile_data = profile_resp.json()
        return tokens, {
            "email": profile_data.get("email"),
            "picture": profile_data.get("picture"),
            "metadata": {"googleId": profile_data.get("id")},
        }

    async def _exchange_github_code(self, code: str, meta: Dict[str, Any]) -> tuple:
        if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
            raise ValidationException("GitHub OAuth credentials are not configured")
        async with _http_client() as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                json={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": code,
                },
            )
            token_resp.raise_for_status()
            tokens = token_resp.json()

            user_resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            user_resp.raise_for_status()
            user_data = user_resp.json()
        return tokens, {
            "login": user_data.get("login"),
            "email": user_data.get("email"),
            "avatar": user_data.get("avatar_url"),
            "metadata": {"githubId": user_data.get("id")},
        }

    async def _exchange_jira_code(self, code: str, platform: str, meta: Dict[str, Any]) -> tuple:
        if not settings.JIRA_CLIENT_ID or not settings.JIRA_CLIENT_SECRET:
            raise ValidationException("Jira OAuth credentials are not configured")
        async with _http_client() as client:
            token_resp = await client.post(
                "https://auth.atlassian.com/oauth/token",
                json={
                    "grant_type": "authorization_code",
                    "client_id": settings.JIRA_CLIENT_ID,
                    "client_secret": settings.JIRA_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": self._callback_url(platform),
                },
            )
            token_resp.raise_for_status()
            tokens = token_resp.json()

            # Get user profile
            profile_resp = await client.get(
                "https://api.atlassian.com/me",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            profile_resp.raise_for_status()
            user_data = profile_resp.json()
        return tokens, {
            "email": user_data.get("email"),
            "avatar": user_data.get("picture"),
            "metadata": {"atlassianId": user_data.get("account_id")},
        }

    async def _exchange_slack_code(self, code: str, platform: str, meta: Dict[str, Any]) -> tuple:
        if not settings.SLACK_CLIENT_ID or not settings.SLACK_CLIENT_SECRET:
            raise ValidationException("Slack OAuth credentials are not configured")
        async with _http_client() as client:
            token_resp = await client.post(
                "https://slack.com/api/oauth.v2.access",
                data={
                    "client_id": settings.SLACK_CLIENT_ID,
                    "client_secret": settings.SLACK_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": self._callback_url(platform),
                },
            )
            token_resp.raise_for_status()
            tokens = token_resp.json()
            if not tokens.get("ok"):
                raise ValidationException(f"Slack OAuth failed: {tokens.get('error', 'unknown')}")

            access_token = tokens.get("access_token") or tokens.get("authed_user", {}).get("access_token", "")
            team = tokens.get("team", {})
            authed_user = tokens.get("authed_user", {})
        return {"access_token": access_token}, {
            "email": authed_user.get("id", ""),
            "login": authed_user.get("id", ""),
            "metadata": {"teamId": team.get("id"), "teamName": team.get("name")},
        }

    async def _exchange_microsoft_code(self, code: str, platform: str, meta: Dict[str, Any]) -> tuple:
        if not settings.MICROSOFT_CLIENT_ID or not settings.MICROSOFT_CLIENT_SECRET:
            raise ValidationException("Microsoft OAuth credentials are not configured")
        tenant = settings.MICROSOFT_TENANT_ID or "common"
        async with _http_client() as client:
            token_resp = await client.post(
                f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
                data={
                    "client_id": settings.MICROSOFT_CLIENT_ID,
                    "client_secret": settings.MICROSOFT_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": self._callback_url(platform),
                    "grant_type": "authorization_code",
                },
            )
            token_resp.raise_for_status()
            tokens = token_resp.json()

            profile_resp = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            profile_resp.raise_for_status()
            user_data = profile_resp.json()
        return tokens, {
            "email": user_data.get("mail") or user_data.get("userPrincipalName"),
            "avatar": None,
            "metadata": {"microsoftId": user_data.get("id"), "displayName": user_data.get("displayName")},
        }

    async def _exchange_notion_code(self, code: str, platform: str, meta: Dict[str, Any]) -> tuple:
        if not settings.NOTION_CLIENT_ID or not settings.NOTION_CLIENT_SECRET:
            raise ValidationException("Notion OAuth credentials are not configured")
        import base64
        credentials = base64.b64encode(
            f"{settings.NOTION_CLIENT_ID}:{settings.NOTION_CLIENT_SECRET}".encode()
        ).decode()
        async with _http_client() as client:
            token_resp = await client.post(
                "https://api.notion.com/v1/oauth/token",
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/json",
                },
                json={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": self._callback_url(platform),
                },
            )
            token_resp.raise_for_status()
            tokens = token_resp.json()
            owner = tokens.get("owner", {}).get("user", {})
        return {"access_token": tokens.get("access_token")}, {
            "email": owner.get("person", {}).get("email", ""),
            "avatar": owner.get("avatar_url"),
            "metadata": {"workspaceName": tokens.get("workspace_name"), "workspaceId": tokens.get("workspace_id")},
        }

    async def _exchange_zoom_code(self, code: str, platform: str, meta: Dict[str, Any]) -> tuple:
        if not settings.ZOOM_CLIENT_ID or not settings.ZOOM_CLIENT_SECRET:
            raise ValidationException("Zoom OAuth credentials are not configured")
        import base64
        credentials = base64.b64encode(
            f"{settings.ZOOM_CLIENT_ID}:{settings.ZOOM_CLIENT_SECRET}".encode()
        ).decode()
        redirect_uri = getattr(settings, "ZOOM_REDIRECT_URI", None) or self._callback_url(platform)
        async with _http_client() as client:
            token_resp = await client.post(
                "https://zoom.us/oauth/token",
                headers={"Authorization": f"Basic {credentials}"},
                params={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
            )
            token_resp.raise_for_status()
            tokens = token_resp.json()

            profile_resp = await client.get(
                "https://api.zoom.us/v2/users/me",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            profile_resp.raise_for_status()
            user_data = profile_resp.json()
        return tokens, {
            "email": user_data.get("email"),
            "avatar": user_data.get("pic_url"),
            "metadata": {"zoomId": user_data.get("id"), "accountId": user_data.get("account_id")},
        }

    async def _fetch_gmail_messages(self, access_token: str) -> List[Dict[str, Any]]:
        """
        Fetch up to 5 inbox messages with subject, sender, and preview.

        Strategy
        --------
        • Request 1  : messages.list — returns IDs + snippet in one call using
                       the `fields` projection so the list already includes the
                       preview text (snippet).  This avoids a second fetch just
                       for the snippet.
        • Requests 2–N: messages.get with format=metadata — only Subject and From
                        headers are requested, keeping payloads tiny.
        • All N detail fetches run concurrently via asyncio.gather() and share
          the module-level TLS connection pool (no repeated handshakes).
        """
        auth_headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept-Encoding": "gzip",
        }
        client = _get_client()

        # Step 1: get IDs + snippet in one list call
        list_resp = await client.get(
            "https://www.googleapis.com/gmail/v1/users/me/messages",
            params={
                "labelIds": "INBOX",
                "maxResults": 5,
                "fields": "messages(id,snippet)",   # snippet = email preview
            },
            headers=auth_headers,
        )
        list_resp.raise_for_status()
        msg_stubs = list_resp.json().get("messages", [])

        if not msg_stubs:
            return []

        # Build a lookup so _normalize can still find snippet even from the stub
        snippet_map = {m["id"]: m.get("snippet", "") for m in msg_stubs}

        # Step 2: fetch Subject + From in parallel over the shared connection
        async def fetch_metadata(stub: Dict[str, Any]) -> Dict[str, Any]:
            try:
                r = await client.get(
                    f"https://www.googleapis.com/gmail/v1/users/me/messages/{stub['id']}",
                    params={
                        "format": "metadata",
                        "metadataHeaders": ["Subject", "From", "Date"],
                        "fields": "id,payload/headers",
                    },
                    headers=auth_headers,
                )
                r.raise_for_status()
                detail = r.json()
                # Inject snippet from the list call so _normalize_gmail_message works
                detail.setdefault("snippet", snippet_map.get(stub["id"], ""))
                return detail
            except Exception:
                # Fallback: return a minimal dict that _normalize can handle safely
                return {"id": stub["id"], "snippet": snippet_map.get(stub["id"], ""), "payload": {}}

        return list(await asyncio.gather(*(fetch_metadata(s) for s in msg_stubs)))

    async def _fetch_google_calendar_events(self, access_token: str) -> List[Dict[str, Any]]:
        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()
        async with _http_client() as client:
            response = await client.get(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                params={"maxResults": 5, "singleEvents": True, "orderBy": "startTime", "timeMin": now_iso},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            payload = response.json()
        return payload.get("items", [])

    async def _fetch_github_projects(self, access_token: str) -> List[Dict[str, Any]]:
        async with _http_client() as client:
            response = await client.get(
                "https://api.github.com/user/repos",
                params={"per_page": 5, "sort": "updated"},
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            )
            response.raise_for_status()
            payload = response.json()
        return payload

    def _normalize_gmail_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        payload = message.get("payload", {})
        headers = {header.get("name"): header.get("value") for header in payload.get("headers", []) if header.get("name")}
        subject = headers.get("Subject") or "No subject"
        from_value = headers.get("From") or "Unknown sender"
        sender_name = from_value.split("<")[0].strip() if "<" in from_value else from_value
        return {
            "id": message.get("id"),
            "from": sender_name,
            "role": "Inbox",
            "subject": subject,
            "preview": (message.get("snippet") or "No preview available").strip(),
            "time": "just now",
            "priority": "normal",
            "read": False,
        }

    def _normalize_google_calendar_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        start = event.get("start", {})
        end = event.get("end", {})
        start_time = start.get("dateTime") or start.get("date") or "12:00"
        end_time = end.get("dateTime") or end.get("date") or start_time
        return {
            "id": event.get("id"),
            "title": event.get("summary") or "Untitled event",
            "time": start_time,
            "end": end_time,
            "duration": 30,
            "color": "#3b82f6",
            "tag": "Google Calendar",
        }

    def _normalize_github_project(self, project: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": project.get("id"),
            "name": project.get("name") or "Untitled repository",
            "status": "success" if project.get("private") is False else "idle",
            "updatedAt": project.get("updated_at"),
            "description": project.get("description") or "No description",
        }

    async def _revoke_provider_token(self, platform: str, token: str) -> None:
        meta = get_platform(platform)
        provider = meta.get("oauthProvider")
        try:
            async with _http_client() as client:
                if provider == "google":
                    await client.post(
                        "https://oauth2.googleapis.com/revoke",
                        params={"token": token},
                        headers={"Content-Type": "application/x-www-form-urlencoded"},
                    )
        except Exception:
            pass


integration_service = IntegrationService()
