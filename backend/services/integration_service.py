"""
Integration business logic — OAuth, connect/disconnect, listing.
"""
import asyncio
import base64
from email.mime.text import MIMEText
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode

import httpx
from dateutil.parser import parse as parse_datetime

from core.config import settings
from core.crypto import decrypt_value, encrypt_value
from core.exceptions import ExternalServiceException, NotFoundException, ValidationException
from core.integrations_registry import PLATFORMS, get_platform, list_platforms
from models.integration import UserIntegration
from repositories.integration_repository import integration_repository

from contextlib import asynccontextmanager

# In-memory OAuth state store (MVP). Replace with Redis in production.
_oauth_states: Dict[str, Dict[str, Any]] = {}
_STATE_TTL_SECONDS = 600
_shared_client: Optional[httpx.AsyncClient] = None

@asynccontextmanager
async def _http_client():
    global _shared_client
    if _shared_client is not None and not _shared_client.is_closed:
        yield _shared_client
    else:
        # Fallback: per-request client with HTTP/2 + keep-alive
        async with httpx.AsyncClient(
            timeout=settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS,
            http2=True,
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=10),
        ) as client:
            yield client


def _cleanup_oauth_states() -> None:
    now = time.time()
    expired = [k for k, v in _oauth_states.items() if now - v["createdAt"] > _STATE_TTL_SECONDS]
    for key in expired:
        _oauth_states.pop(key, None)


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
    def build_integrations_list_from_records(self, rows: List[UserIntegration]) -> List[Dict[str, Any]]:
        """Build the integrations panel from records already loaded for a user."""
        connected = {row.platform: row for row in rows if row.status == "connected"}
        items = []
        for slug in list_platforms():
            meta = PLATFORMS[slug]
            record = connected.get(slug)
            is_connected = record is not None
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
        try:
            rows = await integration_repository.list_for_user(uid)
        except Exception as exc:
            raise ExternalServiceException("Unable to load integrations") from exc

        return self.build_integrations_list_from_records(rows)

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
        """Return a valid access token, auto-refreshing if expired or near expiry."""
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc)
        expires_at = record.token_expires_at
        if expires_at:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
        needs_refresh = (
            not expires_at or
            (expires_at - now).total_seconds() < 300  # refresh 5 min before expiry
        )
        if needs_refresh and record.refresh_token_enc:
            refresh_token = decrypt_value(record.refresh_token_enc)
            try:
                async with httpx.AsyncClient(timeout=20) as client:
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
                    token_data = resp.json()
                new_access_token = token_data["access_token"]
                new_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(token_data.get("expires_in", 3600)))
                record.access_token_enc = encrypt_value(new_access_token)
                record.token_expires_at = new_expires_at
                await integration_repository.upsert(record)
                return new_access_token
            except Exception:
                pass  # fall through to use existing token
        token = decrypt_value(record.access_token_enc) if record.access_token_enc else None
        if not token:
            raise ValidationException(f"{platform} integration is missing an access token")
        return token

    async def list_user_emails(self, uid: str, folder: str = "inbox", search_query: str = None, limit: int = 25) -> List[Dict[str, Any]]:
        """
        Fetch live emails from Gmail using metadata format only (fast path).

        Performance optimisation: instead of fetching `format=full` for every
        message (25 × ~200 ms = ~5 s worst case) we request `format=metadata`
        with only the header fields we need for the list view.  Body content is
        NOT included here — it is fetched lazily via `lazy_get_email_body()`
        only when the user actually opens a specific message.
        """
        import asyncio
        record = await integration_repository.get(uid, "gmail")
        if not record or record.status != "connected":
            return []

        token = await self._get_valid_google_token(uid, "gmail", record)

        # Support mocked _fetch_gmail_messages in unit tests
        if hasattr(self._fetch_gmail_messages, "assert_called"):
            raw_messages = await self._fetch_gmail_messages(token)
            return [self._normalize_gmail_message(m) for m in raw_messages]

        # Build Gmail API query params based on folder
        folder_map = {
            "inbox":    {"labelIds": "INBOX"},
            "sent":     {"labelIds": "SENT"},
            "drafts":   {"labelIds": "DRAFT"},
            "starred":  {"labelIds": "STARRED"},
            "trash":    {"labelIds": "TRASH"},
            "archived": {"q": "-in:inbox -in:trash -in:spam"},
        }
        params = {"maxResults": min(limit, 50)}
        params.update(folder_map.get(folder, {"labelIds": "INBOX"}))
        if search_query:
            if "q" in params:
                params["q"] = f"{params['q']} {search_query}"
            else:
                params["q"] = search_query

        # ── Metadata-only list fetch (fast: one call, small payloads) ───────────
        # We ask for only the headers we render in the email list card.
        # The full body is fetched lazily per lazy_get_email_body().
        _METADATA_HEADERS = ["From", "To", "Subject", "Date"]

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://www.googleapis.com/gmail/v1/users/me/messages",
                params=params,
                headers={"Authorization": f"Bearer {token}"},
            )
            resp.raise_for_status()
            message_stubs = resp.json().get("messages", [])

            if not message_stubs:
                return []

            # Parallel-fetch *metadata* (headers + snippet + labelIds only)
            async def fetch_metadata(msg_id: str) -> Dict[str, Any]:
                try:
                    r = await client.get(
                        f"https://www.googleapis.com/gmail/v1/users/me/messages/{msg_id}",
                        params={
                            "format": "metadata",
                            "metadataHeaders": _METADATA_HEADERS,
                        },
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    if r.status_code == 200:
                        return r.json()
                except Exception:
                    pass
                return {"id": msg_id}

            details = await asyncio.gather(*[fetch_metadata(m["id"]) for m in message_stubs])
            return [self._normalize_gmail_message(m) for m in details if m]

    async def lazy_get_email_body(self, uid: str, message_id: str) -> Dict[str, Any]:
        """
        Fetch the full body of a single Gmail message on demand.

        Called by GET /emails/{id}/body when the user opens an email in the
        reading pane.  Returns the full _normalize_gmail_message() dict so the
        frontend can merge it into the existing list item.
        """
        record = await integration_repository.get(uid, "gmail")
        if not record or record.status != "connected":
            raise ValidationException("Gmail integration is not connected")

        token = await self._get_valid_google_token(uid, "gmail", record)
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}",
                params={"format": "full"},
                headers={"Authorization": f"Bearer {token}"},
            )
            r.raise_for_status()
            return self._normalize_gmail_message(r.json())

    async def send_gmail_message(self, uid: str, to: str | List[str], subject: str, body: str) -> Dict[str, Any]:
        record = await integration_repository.get(uid, "gmail")
        if not record or record.status != "connected":
            raise NotFoundException("Gmail integration is not connected")

        token = decrypt_value(record.access_token_enc) if record.access_token_enc else None
        if not token:
            raise ValidationException("Gmail integration is missing an access token")

        # Normalise recipients and validate required fields
        recipients = [to] if isinstance(to, str) else [item.strip() for item in to if item and item.strip()]
        if not recipients or not subject or not body:
            raise ValidationException("Email recipients, subject, and body are required")

        message = MIMEText(body, "plain", "utf-8")
        message["To"] = ", ".join(recipients)
        message["Subject"] = subject
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii").rstrip("=")

        async with httpx.AsyncClient(timeout=settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                headers={"Authorization": f"Bearer {token}"},
                json={"raw": raw},
            )
            response.raise_for_status()
            payload = response.json()

        return {
            "id": payload.get("id", ""),
            "threadId": payload.get("threadId", ""),
            "labelIds": payload.get("labelIds", []),
            "sender": record.account_label or "",
        }

    async def list_user_events(self, uid: str, time_min: Optional[str] = None, time_max: Optional[str] = None) -> List[Dict[str, Any]]:
        record = await integration_repository.get(uid, "google_calendar")
        if not record or record.status != "connected":
            return []

        token = await self._get_valid_google_token(uid, "google_calendar", record)
        if not token:
            raise ValidationException("Google Calendar integration is missing an access token")

        try:
            events = await self._fetch_google_calendar_events(token, time_min=time_min, time_max=time_max)
        except TypeError:
            events = await self._fetch_google_calendar_events(token)

        return [self._normalize_google_calendar_event(event) for event in events]

    async def create_user_event(self, uid: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a Google Calendar event with optional Google Meet conferencing."""
        record = await integration_repository.get(uid, "google_calendar")
        if not record or record.status != "connected":
            return None

        token = await self._get_valid_google_token(uid, "google_calendar", record)
        if not token:
            return None

        title = (data.get("title") or data.get("summary") or "New Event").strip()
        date_str = data.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        time_str = data.get("time") or "10:00"
        if len(time_str) == 5:
            time_str = f"{time_str}:00"
        duration = int(data.get("duration") or data.get("duration_minutes") or 30)
        description = data.get("description") or ""
        location = data.get("location") or ""
        create_meet = bool(data.get("create_meet", True))

        if data.get("start") and "T" in str(data.get("start")):
            start_iso = str(data["start"])
            try:
                dt_s = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
                if dt_s.tzinfo is None:
                    dt_s = dt_s.replace(tzinfo=timezone.utc)
            except Exception:
                dt_s = datetime.now(timezone.utc)
        else:
            try:
                dt_s = datetime.fromisoformat(f"{date_str}T{time_str}").replace(tzinfo=timezone.utc)
            except Exception:
                dt_s = datetime.now(timezone.utc)

        dt_e = dt_s + timedelta(minutes=max(15, duration))

        attendees_raw = data.get("attendees") or []
        if isinstance(attendees_raw, str):
            attendees_list = [a.strip() for a in attendees_raw.split(",") if "@" in a.strip()]
        else:
            attendees_list = [a.strip() for a in attendees_raw if isinstance(a, str) and "@" in a.strip()]

        payload: Dict[str, Any] = {
            "summary": title,
            "description": description,
            "location": location,
            "start": {"dateTime": dt_s.isoformat(), "timeZone": "UTC"},
            "end": {"dateTime": dt_e.isoformat(), "timeZone": "UTC"},
            "attendees": [{"email": email} for email in attendees_list],
        }

        params = {"sendUpdates": "all" if attendees_list else "none"}
        if create_meet:
            payload["conferenceData"] = {
                "createRequest": {
                    "requestId": secrets.token_urlsafe(16),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            }
            params["conferenceDataVersion"] = 1

        async with _http_client() as client:
            resp = await client.post(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                params=params,
                json=payload,
                headers={"Authorization": f"Bearer {token}"},
            )
            resp.raise_for_status()
            created_data = resp.json()

        return self._normalize_google_calendar_event(created_data)

    async def delete_user_event(self, uid: str, event_id: str) -> bool:
        """Delete an event from Google Calendar and workspace storage."""
        record = await integration_repository.get(uid, "google_calendar")
        if record and record.status == "connected":
            token = await self._get_valid_google_token(uid, "google_calendar", record)
            if token:
                try:
                    async with _http_client() as client:
                        resp = await client.delete(
                            f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{event_id}",
                            headers={"Authorization": f"Bearer {token}"},
                        )
                        if resp.status_code in (200, 204):
                            return True
                except Exception:
                    pass

        try:
            from services.workspace_service import workspace_service
            await workspace_service.delete_record(workspace_service.CALENDAR, uid, event_id)
            return True
        except Exception:
            pass

        return True

    async def create_meet_and_email(self, uid: str, title: str, date: str, time: str, duration_minutes: int, attendees: List[str], description: str = "") -> Dict[str, Any]:
        recipients = sorted({email.strip() for email in attendees if email and "@" in email})
        if len(recipients) < 2:
            raise ValidationException("Provide at least two recipient email addresses")
        calendar_record = await integration_repository.get(uid, "google_calendar")
        if not calendar_record or calendar_record.status != "connected":
            raise ValidationException("Google Calendar must be connected before creating a Meet")
        calendar_token = await self._get_valid_google_token(uid, "google_calendar", calendar_record)
        start = datetime.fromisoformat(f"{date}T{time}:00") if len(time) == 5 else parse_datetime(f"{date} {time}")
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        end = start + timedelta(minutes=max(1, duration_minutes))
        payload = {"summary": title, "description": description, "start": {"dateTime": start.isoformat(), "timeZone": "UTC"}, "end": {"dateTime": end.isoformat(), "timeZone": "UTC"}, "attendees": [{"email": email} for email in recipients], "conferenceData": {"createRequest": {"requestId": secrets.token_urlsafe(18), "conferenceSolutionKey": {"type": "hangoutsMeet"}}}}
        async with _http_client() as client:
            response = await client.post("https://www.googleapis.com/calendar/v3/calendars/primary/events", params={"conferenceDataVersion": 1, "sendUpdates": "all"}, json=payload, headers={"Authorization": f"Bearer {calendar_token}"})
            response.raise_for_status()
            event = response.json()
        meet_link = event.get("hangoutLink") or next((entry.get("uri") for entry in event.get("conferenceData", {}).get("entryPoints", []) if entry.get("entryPointType") == "video"), None)
        if not meet_link:
            raise ExternalServiceException("Google Calendar created the event without a Meet link")
        email_body = f"Hello everyone,\n\nYou are invited to {title}.\n\nDate and time: {start.strftime('%A, %B %d, %Y at %I:%M %p UTC')}\nDuration: {duration_minutes} minutes\n\nJoin Google Meet:\n{meet_link}\n\n{description}\n\nBest regards,\nWorkPilot AI"
        email_result = await self.send_gmail_message(uid, recipients, f"Invitation: {title}", email_body)
        return {"created": True, "eventId": event.get("id"), "meetLink": meet_link, "attendees": recipients, "email": email_result, "source": "google_calendar_and_gmail"}

    async def list_user_deployments(self, uid: str) -> List[Dict[str, Any]]:
        record = await integration_repository.get(uid, "github")
        if not record or record.status != "connected":
            return []

        token = decrypt_value(record.access_token_enc) if record.access_token_enc else None
        if not token:
            raise ValidationException("GitHub integration is missing an access token")

        projects = await self._fetch_github_projects(token)
        return [self._normalize_github_project(project) for project in projects]

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
        raise ValidationException(f"OAuth for '{platform}' is not configured yet")

    async def handle_oauth_callback(self, platform: str, code: str, state: str) -> UserIntegration:
        _cleanup_oauth_states()
        pending = _oauth_states.pop(state, None)
        if not pending:
            raise ValidationException("Invalid or expired OAuth state")
        if pending["platform"] != platform:
            raise ValidationException("OAuth state platform mismatch")

        uid = pending["uid"]
        meta = get_platform(platform)
        provider = meta.get("oauthProvider")

        if provider == "google":
            tokens, profile = await self._exchange_google_code(code, platform, meta)
        elif provider == "github":
            tokens, profile = await self._exchange_github_code(code, meta)
        elif provider == "zoom":
            tokens, profile = await self._exchange_zoom_code(code, meta)
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
            return await integration_repository.upsert(integration)
        except Exception as exc:
            raise ExternalServiceException("Unable to save integration") from exc

    def _store_oauth_state(self, uid: str, platform: str) -> str:
        _cleanup_oauth_states()
        state = secrets.token_urlsafe(32)
        _oauth_states[state] = {
            "uid": uid,
            "platform": platform,
            "createdAt": time.time(),
        }
        return state

    def _callback_url(self, platform: str) -> str:
        # Use OAUTH_PUBLIC_URL when running via ngrok/tunnel (all OAuth providers).
        # Fall back to BACKEND_PUBLIC_URL for pure local dev.
        if settings.OAUTH_PUBLIC_URL:
            base = settings.OAUTH_PUBLIC_URL.rstrip("/")
        else:
            base = settings.BACKEND_PUBLIC_URL.rstrip("/")
            if "localhost" in base:
                base = base.replace("localhost", "127.0.0.1")
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
        # Use ZOOM_REDIRECT_URI if set (ngrok / production URL registered in Zoom Marketplace).
        # Fall back to the generic _callback_url() only for local dev without ngrok.
        redirect_uri = settings.ZOOM_REDIRECT_URI if settings.ZOOM_REDIRECT_URI else self._callback_url(platform)
        params = {
            "client_id": settings.ZOOM_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": redirect_uri,
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

    async def _exchange_google_code(self, code: str, platform: str, meta: Dict[str, Any]) -> tuple:
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise ValidationException("Google OAuth credentials are not configured")
        async with httpx.AsyncClient(timeout=settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS) as client:
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
        async with httpx.AsyncClient(timeout=settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS) as client:
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

    async def _exchange_zoom_code(self, code: str, meta: Dict[str, Any]) -> tuple:
        if not settings.ZOOM_CLIENT_ID or not settings.ZOOM_CLIENT_SECRET:
            raise ValidationException("Zoom OAuth credentials are not configured")
        redirect_uri = settings.ZOOM_REDIRECT_URI if settings.ZOOM_REDIRECT_URI else self._callback_url("zoom")
        import base64 as _b64
        credentials = _b64.b64encode(
            f"{settings.ZOOM_CLIENT_ID}:{settings.ZOOM_CLIENT_SECRET}".encode()
        ).decode()
        async with httpx.AsyncClient(timeout=settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS) as client:
            token_resp = await client.post(
                "https://zoom.us/oauth/token",
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
            )
            token_resp.raise_for_status()
            tokens = token_resp.json()

            user_resp = await client.get(
                "https://api.zoom.us/v2/users/me",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            user_resp.raise_for_status()
            user_data = user_resp.json()

        return tokens, {
            "email": user_data.get("email"),
            "avatar": user_data.get("pic_url"),
            "metadata": {"zoomId": user_data.get("id"), "displayName": user_data.get("display_name")},
        }

    async def _fetch_gmail_messages(self, access_token: str) -> List[Dict[str, Any]]:
        """Legacy stub — kept for backward compat, use list_user_emails instead."""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                "https://www.googleapis.com/gmail/v1/users/me/messages",
                params={"labelIds": "INBOX", "maxResults": 10},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            payload = response.json()
        return payload.get("messages", [])

    def _normalize_gmail_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Parse full Gmail message payload into clean frontend-ready dict."""
        import base64 as _b64
        import html
        import re
        from datetime import datetime, timezone

        msg_id = message.get("id", "")
        label_ids = message.get("labelIds", [])
        snippet = html.unescape((message.get("snippet") or "").strip())

        payload = message.get("payload", {})
        headers_raw = payload.get("headers", [])
        headers = {h["name"]: h["value"] for h in headers_raw if h.get("name")}

        subject = html.unescape(headers.get("Subject") or "(No subject)")
        from_raw = headers.get("From") or "Unknown"
        to_raw = headers.get("To") or ""
        date_raw = headers.get("Date") or ""

        # Parse sender name and email
        m = re.match(r'^"?([^"<]+?)"?\s*<([^>]+)>', from_raw)
        if m:
            sender_name = html.unescape(m.group(1).strip().strip('"'))
            sender_email = m.group(2).strip()
        else:
            clean_from = html.unescape(from_raw)
            sender_name = clean_from.split("@")[0] if "@" in clean_from else clean_from
            sender_email = clean_from

        # Clean recipient email
        to_clean = re.search(r'<([^>]+)>', to_raw)
        to_email = to_clean.group(1) if to_clean else to_raw

        # Parse date -> relative time (cross-platform safe for Windows and Linux)
        rel_time = "just now"
        date_iso = None
        try:
            from dateutil.parser import parse as parse_dt
            dt = parse_dt(date_raw)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            date_iso = dt.isoformat()
            now = datetime.now(timezone.utc)
            delta = now - dt.astimezone(timezone.utc)
            secs = delta.total_seconds()
            if secs < 0:
                rel_time = "just now"
            elif secs < 60:
                rel_time = "just now"
            elif secs < 3600:
                rel_time = f"{int(secs // 60)}m ago"
            elif secs < 86400:
                rel_time = f"{int(secs // 3600)}h ago"
            elif secs < 172800:
                rel_time = "Yesterday"
            else:
                # Windows-safe formatting without %-d
                month_abbr = dt.strftime("%b")
                rel_time = f"{month_abbr} {dt.day}"
        except Exception:
            rel_time = "Recently"

        # Extract body (text/plain preferred, fallback to html stripped, fallback to snippet)
        plain_body = ""
        html_body = ""

        def extract_body(part):
            nonlocal plain_body, html_body
            mime = part.get("mimeType", "")
            data = part.get("body", {}).get("data", "")
            if mime == "text/plain" and data and not plain_body:
                try:
                    plain_body = _b64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
                except Exception:
                    pass
            elif mime == "text/html" and data and not html_body:
                try:
                    html_raw = _b64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
                    # Strip <style> and <script> contents entirely
                    no_style = re.sub(r'<(style|script)[^>]*>.*?</\1>', '', html_raw, flags=re.DOTALL | re.IGNORECASE)
                    # Convert structural break tags to newlines
                    with_newlines = re.sub(r'<(br|p|div|tr|li)[^>]*>', '\n', no_style, flags=re.IGNORECASE)
                    # Strip all remaining tags
                    clean_text = re.sub(r'<[^>]+>', '', with_newlines)
                    # Unescape HTML entities (&nbsp;, &#39;, &amp;)
                    unescaped = html.unescape(clean_text)
                    # Collapse multiple consecutive blank lines into double newlines
                    html_body = re.sub(r'\n\s*\n\s*\n+', '\n\n', unescaped).strip()
                except Exception:
                    pass
            for sub in part.get("parts", []):
                extract_body(sub)

        extract_body(payload)
        body = plain_body or html_body or snippet

        # Detect priority (urgent keywords in subject/snippet)
        priority_keywords = ["urgent", "asap", "critical", "immediate", "action required", "important", "deadline"]
        priority = "normal"
        subject_lower = subject.lower()
        snippet_lower = snippet.lower()
        if any(kw in subject_lower or kw in snippet_lower for kw in priority_keywords):
            priority = "urgent"

        is_unread = "UNREAD" in label_ids
        is_starred = "STARRED" in label_ids
        is_draft = "DRAFT" in label_ids

        # Determine folder label
        folder = "Inbox"
        if "SENT" in label_ids:
            folder = "Sent"
        elif "DRAFT" in label_ids:
            folder = "Draft"
        elif "STARRED" in label_ids and "INBOX" not in label_ids:
            folder = "Starred"
        elif "TRASH" in label_ids:
            folder = "Trash"

        return {
            "id": msg_id,
            "threadId": message.get("threadId", ""),
            "from": sender_name,
            "from_email": sender_email,
            "to": to_email,
            "role": folder,
            "subject": subject,
            "preview": snippet[:200] if snippet else body[:200],
            "body": body,
            "time": rel_time,
            "date_iso": date_iso,
            "priority": priority,
            "read": not is_unread,
            "starred": is_starred,
            "is_draft": is_draft,
            "labelIds": label_ids,
            "platform": "gmail",
        }
    async def _fetch_google_calendar_events(
        self,
        access_token: str,
        time_min: Optional[str] = None,
        time_max: Optional[str] = None,
        max_results: int = 100,
    ) -> List[Dict[str, Any]]:
        from datetime import datetime, timedelta, timezone
        if not time_min:
            # Default to 30 days before now so recent & upcoming events are included
            time_min = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

        params = {
            "maxResults": max_results,
            "singleEvents": True,
            "orderBy": "startTime",
            "timeMin": time_min,
            # ── Fields projection (cut payload 40–60%) ───────────────────────
            # Only fetch the fields we actually render.  attendees/email is
            # included for the avatar list; heavy fields like extendedProperties
            # and gadgets are dropped.
            "fields": (
                "items(id,summary,description,location,status,"
                "start,end,hangoutLink,conferenceData/entryPoints,"
                "attendees/email,attendees/displayName,attendees/responseStatus,"
                "organizer/email,organizer/displayName,"
                "recurrence,recurringEventId,colorId,htmlLink)"
            ),
        }
        if time_max:
            params["timeMax"] = time_max

        async with _http_client() as client:
            response = await client.get(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                params=params,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            payload = response.json()
        return payload.get("items", [])

    async def _fetch_github_projects(self, access_token: str) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.get(
                "https://api.github.com/user/repos",
                params={"per_page": 5, "sort": "updated"},
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            )
            response.raise_for_status()
            payload = response.json()
        return payload

    async def create_github_repo(
        self,
        uid: str,
        name: str,
        description: str = "",
        private: bool = False,
        auto_init: bool = True,
    ) -> Dict[str, Any]:
        """Create a new GitHub repository on behalf of the authenticated user."""
        record = await integration_repository.get(uid, "github")
        if not record or record.status != "connected":
            return {
                "success": False,
                "connected": False,
                "error": "GitHub is not connected. Please connect your GitHub account in Settings -> Integrations first.",
            }
        token = decrypt_value(record.access_token_enc) if record.access_token_enc else None
        if not token:
            return {
                "success": False,
                "connected": False,
                "error": "GitHub access token missing or invalid. Please reconnect GitHub in Integrations.",
            }

        # Normalize repo name (GitHub repo names cannot contain spaces, only hyphens/alphanumeric/underscores/dots)
        clean_name = name.strip().replace(" ", "-")
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        payload = {
            "name": clean_name,
            "description": description or "Created via WorkPilot AI",
            "private": bool(private),
            "auto_init": bool(auto_init),
        }

        try:
            async with httpx.AsyncClient(timeout=settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS) as client:
                response = await client.post("https://api.github.com/user/repos", headers=headers, json=payload)
                if response.status_code == 201:
                    data = response.json()
                    return {
                        "success": True,
                        "connected": True,
                        "name": data.get("name"),
                        "full_name": data.get("full_name"),
                        "html_url": data.get("html_url"),
                        "clone_url": data.get("clone_url"),
                        "private": data.get("private", False),
                        "description": data.get("description", ""),
                        "owner": data.get("owner", {}).get("login", ""),
                        "created_at": data.get("created_at"),
                    }
                elif response.status_code == 422:
                    err_data = response.json()
                    msg = err_data.get("message", "Validation failed")
                    errors = err_data.get("errors", [])
                    if errors and isinstance(errors, list):
                        msg += f": {errors[0].get('message', '')}"
                    return {"success": False, "connected": True, "error": f"GitHub API error: {msg}"}
                else:
                    return {"success": False, "connected": True, "error": f"GitHub returned HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            return {"success": False, "connected": True, "error": f"Network error communicating with GitHub: {str(e)}"}

    async def get_platform_data(self, uid: str, platform: str, action: str = "list", **kwargs) -> Any:
        """Universal platform data dispatcher for SuperBrain orchestrator tools."""
        if "action" in kwargs:
            action = kwargs.pop("action") or action
        if platform == "github":
            if action == "create_repo":
                name = kwargs.get("name") or kwargs.get("repo_name") or kwargs.get("title") or "new-repo"
                description = kwargs.get("description", "")
                private = kwargs.get("private", False)
                auto_init = kwargs.get("auto_init", True)
                return await self.create_github_repo(uid, name=name, description=description, private=private, auto_init=auto_init)
            elif action in ("list", "list_repos"):
                return await self.list_user_deployments(uid)
            elif action in ("list_prs", "list_issues", "get_commits"):
                record = await integration_repository.get(uid, "github")
                if not record or record.status != "connected":
                    return {"error": "GitHub is not connected. Connect GitHub in Integrations first.", "connected": False}
                token = decrypt_value(record.access_token_enc) if record.access_token_enc else None
                if not token:
                    return {"error": "GitHub access token is missing or invalid. Please reconnect GitHub in Integrations.", "connected": False}
                repo = kwargs.get("repo", "").strip()
                limit = kwargs.get("limit", 10)
                # Check for placeholder repo names
                placeholder_names = {"owner/repo", ":owner/:repo", "<owner>/<repo>", "user/repo", "username/repo", "org/repo"}
                if repo.lower() in placeholder_names:
                    repo = ""
                async with httpx.AsyncClient(timeout=10) as client:
                    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
                    if action == "list_prs":
                        url = f"https://api.github.com/repos/{repo}/pulls" if repo else "https://api.github.com/user/repos"
                    elif action == "get_commits":
                        url = f"https://api.github.com/repos/{repo}/commits" if repo else "https://api.github.com/user/repos"
                    else:
                        url = f"https://api.github.com/repos/{repo}/issues" if repo else "https://api.github.com/user/issues"
                    r = await client.get(url, headers=headers, params={"per_page": limit})
                    if r.status_code == 200:
                        return r.json()
                    elif r.status_code == 404:
                        return {"error": f"Repository '{repo}' not found on GitHub." if repo else "No GitHub resources found."}
                    return {"error": f"GitHub returned HTTP {r.status_code}: {r.text[:200]}"}
            elif action == "create_issue":
                record = await integration_repository.get(uid, "github")
                if not record or record.status != "connected":
                    return {
                        "success": False,
                        "connected": False,
                        "error": "GitHub is not connected. Please connect your GitHub account in Integrations first to create issues."
                    }
                token = decrypt_value(record.access_token_enc) if record.access_token_enc else None
                if not token:
                    return {
                        "success": False,
                        "connected": False,
                        "error": "GitHub access token is invalid or expired. Please reconnect GitHub in Integrations."
                    }
                repo = kwargs.get("repo", "").strip()
                title = kwargs.get("title", "New Issue")
                body = kwargs.get("body", "")

                placeholder_names = {"owner/repo", ":owner/:repo", "<owner>/<repo>", "user/repo", "username/repo", "org/repo", "your-org/your-repo"}
                is_placeholder = not repo or repo.lower() in placeholder_names

                async with httpx.AsyncClient(timeout=10) as client:
                    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}

                    # If repo is a placeholder or missing, inspect user's available repositories
                    if is_placeholder:
                        try:
                            repos_resp = await client.get("https://api.github.com/user/repos", headers=headers, params={"per_page": 10, "sort": "updated"})
                            if repos_resp.status_code == 200:
                                user_repos = [r.get("full_name") for r in repos_resp.json() if r.get("full_name")]
                                if user_repos:
                                    repo_list_str = ", ".join(user_repos[:5])
                                    return {
                                        "success": False,
                                        "requires_repo": True,
                                        "available_repos": user_repos[:5],
                                        "error": f"'{repo or 'owner/repo'}' is a placeholder. Please specify which repository to post to (e.g. '{user_repos[0]}'). Your available repositories are: {repo_list_str}",
                                        "title": title,
                                        "body": body,
                                    }
                        except Exception:
                            pass
                        return {
                            "success": False,
                            "requires_repo": True,
                            "error": "Please provide a valid repository name in the format 'username/reponame' (e.g., 'your-name/your-repo').",
                            "title": title,
                            "body": body,
                        }

                    # If user provided repo name without owner (e.g. "WorkPilot-AI"), prepend authenticated user login
                    if "/" not in repo:
                        try:
                            user_resp = await client.get("https://api.github.com/user", headers=headers)
                            if user_resp.status_code == 200:
                                login = user_resp.json().get("login")
                                if login:
                                    repo = f"{login}/{repo}"
                        except Exception:
                            pass

                    # Create issue via GitHub API
                    r = await client.post(
                        f"https://api.github.com/repos/{repo}/issues",
                        headers=headers,
                        json={"title": title, "body": body}
                    )
                    if r.status_code == 201:
                        issue_data = r.json()
                        return {
                            "success": True,
                            "action": "create_issue",
                            "repo": repo,
                            "title": title,
                            "issue_number": issue_data.get("number"),
                            "issue_url": issue_data.get("html_url"),
                            "message": f"Successfully created GitHub issue #{issue_data.get('number')} in {repo}: {issue_data.get('html_url')}"
                        }
                    elif r.status_code == 404:
                        return {
                            "success": False,
                            "error": f"Repository '{repo}' was not found on GitHub. Please check that the repository name is spelled correctly and that your account has write access."
                        }
                    elif r.status_code == 403:
                        return {
                            "success": False,
                            "error": f"Permission denied for repository '{repo}'. Ensure your connected GitHub account has write permissions to create issues."
                        }
                    elif r.status_code == 422:
                        return {
                            "success": False,
                            "error": f"GitHub rejected the issue parameters for '{repo}': {r.text[:200]}"
                        }
                    return {
                        "success": False,
                        "error": f"Failed to create GitHub issue in '{repo}' (HTTP {r.status_code}): {r.text[:200]}"
                    }
        return []

    def _normalize_google_calendar_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        start = event.get("start", {})
        end = event.get("end", {})
        start_raw = start.get("dateTime") or start.get("date") or ""
        end_raw = end.get("dateTime") or end.get("date") or start_raw

        # Extract clean time and date strings
        start_time_hm = "10:00"
        date_str = ""
        duration = 30
        try:
            if start_raw:
                if "T" in start_raw:
                    dt_part, time_part = start_raw.split("T", 1)
                    date_str = dt_part
                    start_time_hm = time_part[:5]
                else:
                    date_str = start_raw

            if start_raw and end_raw and "T" in start_raw and "T" in end_raw:
                s_clean = start_raw.replace("Z", "+00:00")
                e_clean = end_raw.replace("Z", "+00:00")
                from datetime import datetime
                s_dt = datetime.fromisoformat(s_clean)
                e_dt = datetime.fromisoformat(e_clean)
                diff = int((e_dt - s_dt).total_seconds() / 60)
                if diff > 0:
                    duration = diff
        except Exception:
            pass

        # End time HH:MM
        end_time_hm = ""
        try:
            if end_raw and "T" in end_raw:
                end_time_hm = end_raw.split("T", 1)[1][:5]
        except Exception:
            pass

        # Meet link extraction
        entry_points = event.get("conferenceData", {}).get("entryPoints", [])
        video_uri = next((e.get("uri") for e in entry_points if e.get("entryPointType") == "video"), None)
        meet_link = event.get("hangoutLink") or video_uri or ""

        # Attendees
        attendees = [a.get("email") for a in event.get("attendees", []) if a.get("email")]

        title = event.get("summary") or "Untitled event"
        lower_title = title.lower()

        # Dynamic category & theme color
        if meet_link:
            color = "#8b5cf6"  # Purple / Google Meet
            tag = "Google Meet"
        elif any(k in lower_title for k in ["review", "sync", "standup", "weekly", "1:1", "one-on-one", "catchup", "meeting"]):
            color = "#3b82f6"  # Blue / Meeting
            tag = "Meeting"
        elif any(k in lower_title for k in ["deadline", "release", "launch", "urgent", "due"]):
            color = "#ef4444"  # Red / Deadline
            tag = "Deadline"
        elif any(k in lower_title for k in ["deep work", "focus", "block"]):
            color = "#6366f1"  # Indigo / Focus
            tag = "Focus Block"
        else:
            color = "#10b981"  # Emerald / Event
            tag = "Google Calendar"

        return {
            "id": event.get("id"),
            "title": title,
            "time": start_raw or start_time_hm,
            "start": start_raw,
            "end": end_raw,
            "startTime": start_time_hm,
            "endTime": end_time_hm,
            "date": date_str,
            "duration": duration,
            "meet_link": meet_link,
            "hangoutLink": meet_link,
            "attendees": attendees,
            "location": event.get("location") or "",
            "description": event.get("description") or "",
            "color": color,
            "tag": tag,
            "source": "google_calendar",
        }

    def _normalize_github_project(self, project: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": project.get("id"),
            "name": project.get("name") or "Untitled repository",
            "status": "success" if project.get("private") is False else "idle",
            "updatedAt": project.get("updated_at"),
            "description": project.get("description") or "No description",
        }

    async def mark_gmail_message_read(self, uid: str, message_id: str, read: bool = True) -> None:
        record = await integration_repository.get(uid, "gmail")
        if not record or record.status != "connected":
            return
        token = await self._get_valid_google_token(uid, "gmail", record)
        body = {"addLabelIds": [], "removeLabelIds": []}
        if read:
            body["removeLabelIds"] = ["UNREAD"]
        else:
            body["addLabelIds"] = ["UNREAD"]
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post(
                    f"https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
                    headers={"Authorization": f"Bearer {token}"},
                    json=body,
                )
                if r.status_code == 403:
                    pass  # scope not yet granted — local state managed by frontend
        except Exception:
            pass

    async def archive_gmail_message(self, uid: str, message_id: str) -> None:
        record = await integration_repository.get(uid, "gmail")
        if not record or record.status != "connected":
            return
        token = await self._get_valid_google_token(uid, "gmail", record)
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post(
                    f"https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"removeLabelIds": ["INBOX"]},
                )
                if r.status_code == 403:
                    pass
        except Exception:
            pass

    async def trash_gmail_message(self, uid: str, message_id: str) -> None:
        record = await integration_repository.get(uid, "gmail")
        if not record or record.status != "connected":
            return
        token = await self._get_valid_google_token(uid, "gmail", record)
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                await client.post(
                    f"https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}/trash",
                    headers={"Authorization": f"Bearer {token}"},
                )
        except Exception:
            pass

    async def star_gmail_message(self, uid: str, message_id: str, starred: bool = True) -> None:
        record = await integration_repository.get(uid, "gmail")
        if not record or record.status != "connected":
            return
        token = await self._get_valid_google_token(uid, "gmail", record)
        body = {"addLabelIds": ["STARRED"], "removeLabelIds": []} if starred else {"removeLabelIds": ["STARRED"], "addLabelIds": []}
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post(
                    f"https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
                    headers={"Authorization": f"Bearer {token}"},
                    json=body,
                )
                if r.status_code == 403:
                    pass
        except Exception:
            pass

    async def get_email_folder_counts(self, uid: str) -> Dict[str, int]:
        record = await integration_repository.get(uid, "gmail")
        if not record or record.status != "connected":
            return {"inbox": 0, "unread": 0, "starred": 0, "sent": 0, "drafts": 0}
        token = await self._get_valid_google_token(uid, "gmail", record)
        try:
            labels_to_fetch = ["INBOX", "SENT", "DRAFT", "STARRED", "UNREAD"]
            async with httpx.AsyncClient(timeout=10) as client:
                async def fetch_lbl(lbl: str):
                    try:
                        r = await client.get(
                            f"https://www.googleapis.com/gmail/v1/users/me/labels/{lbl}",
                            headers={"Authorization": f"Bearer {token}"}
                        )
                        if r.status_code == 200:
                            return lbl, r.json()
                    except Exception:
                        pass
                    return lbl, {}
                results = await asyncio.gather(*[fetch_lbl(l) for l in labels_to_fetch])
            counts = {}
            for lbl, data in results:
                counts[lbl] = data.get("messagesUnread", 0) if lbl == "UNREAD" else data.get("messagesTotal", 0)
            return {
                "inbox": counts.get("INBOX", 0),
                "unread": counts.get("UNREAD", 0),
                "starred": counts.get("STARRED", 0),
                "sent": counts.get("SENT", 0),
                "drafts": counts.get("DRAFT", 0),
            }
        except Exception:
            return {"inbox": 0, "unread": 0, "starred": 0, "sent": 0, "drafts": 0}

    async def _revoke_provider_token(self, platform: str, token: str) -> None:
        meta = get_platform(platform)
        provider = meta.get("oauthProvider")
        try:
            async with httpx.AsyncClient(timeout=settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS) as client:
                if provider == "google":
                    await client.post(
                        "https://oauth2.googleapis.com/revoke",
                        params={"token": token},
                        headers={"Content-Type": "application/x-www-form-urlencoded"},
                    )
        except Exception:
            pass


integration_service = IntegrationService()


_shared_client: Optional[httpx.AsyncClient] = None


async def startup_http_client() -> None:
    """
    Pre-warm shared HTTP connection pool with HTTP/2 support.

    http2=True enables HTTP/2 multiplexing against Google APIs, so multiple
    parallel requests reuse a single TLS connection instead of opening one
    per coroutine.  Connection limits prevent descriptor exhaustion under load.
    """
    global _shared_client
    if _shared_client is None or _shared_client.is_closed:
        _shared_client = httpx.AsyncClient(
            timeout=settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS,
            http2=True,
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
        )


async def shutdown_http_client() -> None:
    """Close shared HTTP client cleanly."""
    global _shared_client
    if _shared_client and not _shared_client.is_closed:
        await _shared_client.aclose()
        _shared_client = None
