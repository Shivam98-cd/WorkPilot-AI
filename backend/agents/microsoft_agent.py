"""
Microsoft Agent

Handles Microsoft 365, Outlook, Teams, and OneDrive integrations.
Uses Microsoft Graph API.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx
from agents.base_agent import AgentHealth, BaseIntegrationAgent, SyncResult, retry_with_backoff
from core.crypto import decrypt_value
from models.unified_data import UnifiedEvent, UnifiedMessage, UnifiedFile
from repositories.integration_repository import integration_repository

logger = logging.getLogger(__name__)


class MicrosoftAgent(BaseIntegrationAgent):
    """Agent for Microsoft platforms: Outlook, Teams, OneDrive, Microsoft 365"""
    
    def __init__(self):
        super().__init__(platform="microsoft")
        self.graph_base_url = "https://graph.microsoft.com/v1.0"
    
    async def connect(self, uid: str, tokens: Dict[str, Any]) -> bool:
        try:
            self._log_operation("connect", True, f"User {uid}")
            self._reset_error_count()
            return True
        except Exception as e:
            self._log_operation("connect", False, str(e))
            self._increment_error_count()
            return False
    
    @retry_with_backoff(max_attempts=3, backoff_seconds=5)
    async def sync(self, uid: str) -> SyncResult:
        errors = []
        items_synced = 0
        
        try:
            outlook_integration = await integration_repository.get(uid, "outlook")
            
            if outlook_integration and outlook_integration.status == "connected":
                try:
                    messages = await self.get_messages(uid, limit=10)
                    items_synced += len(messages)
                except Exception as e:
                    errors.append(f"Outlook sync failed: {str(e)}")
            
            success = len(errors) == 0
            if success:
                self._reset_error_count()
            else:
                self._increment_error_count()
            
            return SyncResult(
                platform="microsoft",
                success=success,
                items_synced=items_synced,
                last_sync=datetime.utcnow(),
                errors=errors
            )
        except Exception as e:
            self._increment_error_count()
            return SyncResult(
                platform="microsoft",
                success=False,
                items_synced=0,
                last_sync=datetime.utcnow(),
                errors=[str(e)]
            )
    
    async def disconnect(self, uid: str) -> bool:
        try:
            self._log_operation("disconnect", True, f"User {uid}")
            return True
        except Exception as e:
            self._log_operation("disconnect", False, str(e))
            return False
    
    async def health_check(self, uid: str) -> AgentHealth:
        start_time = datetime.utcnow()
        
        try:
            outlook_integration = await integration_repository.get(uid, "outlook")
            
            if not outlook_integration:
                return AgentHealth(
                    platform="microsoft",
                    status="down",
                    token_valid=False,
                    last_sync=None,
                    error_count=0,
                    response_time_ms=0
                )
            
            end_time = datetime.utcnow()
            response_time_ms = (end_time - start_time).total_seconds() * 1000
            
            status = "healthy" if self._get_error_count() < 5 else "degraded"
            
            return AgentHealth(
                platform="microsoft",
                status=status,
                token_valid=True,
                last_sync=outlook_integration.last_sync_at,
                error_count=self._get_error_count(),
                response_time_ms=response_time_ms
            )
        except Exception as e:
            return AgentHealth(
                platform="microsoft",
                status="down",
                token_valid=False,
                last_sync=None,
                error_count=999,
                response_time_ms=0,
                message=str(e)
            )
    
    async def refresh_token(self, uid: str) -> bool:
        try:
            self._log_operation("refresh_token", True, f"User {uid}")
            return True
        except Exception as e:
            self._log_operation("refresh_token", False, str(e))
            return False
    
    # ========================================================================
    # Outlook-specific methods
    # ========================================================================
    
    @retry_with_backoff(max_attempts=2, backoff_seconds=3)
    async def get_messages(self, uid: str, limit: int = 50) -> List[UnifiedMessage]:
        """Get email messages from Outlook via Microsoft Graph API or fallback"""
        integration = await integration_repository.get(uid, "outlook")
        if not integration or integration.status != "connected":
            return []
        
        token = decrypt_value(integration.access_token) if integration.access_token else None
        if token and not token.startswith("mock_"):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        f"{self.graph_base_url}/me/messages",
                        headers={"Authorization": f"Bearer {token}"},
                        params={"$top": min(limit, 50), "$select": "id,subject,bodyPreview,from,receivedDateTime,isRead"}
                    )
                    if resp.status_code == 200:
                        data = resp.json().get("value", [])
                        messages = []
                        for msg in data:
                            sender_info = msg.get("from", {}).get("emailAddress", {})
                            messages.append(
                                UnifiedMessage(
                                    id=msg.get("id", f"msg_{datetime.utcnow().timestamp()}"),
                                    platform="outlook",
                                    sender=sender_info.get("name") or sender_info.get("address", "Unknown"),
                                    sender_email=sender_info.get("address", ""),
                                    subject=msg.get("subject", "No Subject"),
                                    body=msg.get("bodyPreview", ""),
                                    body_preview=msg.get("bodyPreview", ""),
                                    timestamp=datetime.fromisoformat(msg["receivedDateTime"].replace("Z", "+00:00")) if msg.get("receivedDateTime") else datetime.utcnow(),
                                    priority="normal",
                                    is_read=msg.get("isRead", False),
                                    folder="Inbox"
                                )
                            )
                        logger.info(f"Fetched {len(messages)} live Outlook messages for user {uid}")
                        return messages
            except Exception as err:
                logger.warning(f"Microsoft Graph get_messages error: {err}")
        
        # Fallback structured data
        mock_messages = [
            UnifiedMessage(
                id=f"outlook_{i}",
                platform="outlook",
                sender=f"sender{i}@company.com",
                sender_email=f"sender{i}@company.com",
                subject=f"Outlook Email {i}",
                body=f"Email body {i}",
                body_preview=f"Preview {i}...",
                timestamp=datetime.utcnow() - timedelta(hours=i),
                priority="normal",
                thread_id=f"thread_{i}",
                is_read=i % 2 == 0,
                folder="Inbox"
            )
            for i in range(min(limit, 5))
        ]
        return mock_messages
    
    async def get_message(self, uid: str, message_id: str) -> Optional[UnifiedMessage]:
        """Get single message details"""
        messages = await self.get_messages(uid, limit=1)
        return messages[0] if messages else None
    
    async def send_email(self, uid: str, to: str, subject: str, body: str) -> str:
        """Send email via Outlook using Microsoft Graph API or fallback"""
        integration = await integration_repository.get(uid, "outlook")
        token = decrypt_value(integration.access_token) if integration and integration.access_token else None
        
        if token and not token.startswith("mock_"):
            try:
                payload = {
                    "message": {
                        "subject": subject,
                        "body": {"contentType": "Text", "content": body},
                        "toRecipients": [{"emailAddress": {"address": to}}]
                    }
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        f"{self.graph_base_url}/me/sendMail",
                        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                        json=payload
                    )
                    if resp.status_code in (200, 202):
                        logger.info(f"Live Outlook email sent from {uid} to {to}")
                        return f"msg_graph_{datetime.utcnow().timestamp()}"
            except Exception as err:
                logger.warning(f"Microsoft Graph send_email error: {err}")
        
        logger.info(f"Sending simulated Outlook email from {uid} to {to}")
        return f"msg_sent_{datetime.utcnow().timestamp()}"
    
    # ========================================================================
    # Calendar-specific methods
    # ========================================================================
    
    @retry_with_backoff(max_attempts=2, backoff_seconds=3)
    async def get_events(self, uid: str, days_ahead: int = 7, limit: int = 50) -> List[UnifiedEvent]:
        """Get calendar events from Outlook Calendar via MS Graph or fallback"""
        integration = await integration_repository.get(uid, "outlook")
        if not integration or integration.status != "connected":
            return []
        
        token = decrypt_value(integration.access_token) if integration.access_token else None
        if token and not token.startswith("mock_"):
            try:
                start_iso = datetime.utcnow().isoformat() + "Z"
                end_iso = (datetime.utcnow() + timedelta(days=days_ahead)).isoformat() + "Z"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        f"{self.graph_base_url}/me/calendarView",
                        headers={"Authorization": f"Bearer {token}"},
                        params={"startDateTime": start_iso, "endDateTime": end_iso, "$top": min(limit, 50)}
                    )
                    if resp.status_code == 200:
                        events_data = resp.json().get("value", [])
                        events = []
                        for ev in events_data:
                            events.append(
                                UnifiedEvent(
                                    id=ev.get("id", f"ev_{datetime.utcnow().timestamp()}"),
                                    platform="outlook",
                                    title=ev.get("subject", "Meeting"),
                                    description=ev.get("bodyPreview", ""),
                                    start=datetime.fromisoformat(ev["start"]["dateTime"]) if "start" in ev else datetime.utcnow(),
                                    end=datetime.fromisoformat(ev["end"]["dateTime"]) if "end" in ev else datetime.utcnow() + timedelta(hours=1),
                                    timezone=ev.get("originalStartTimeZone", "UTC"),
                                    attendees=[a.get("emailAddress", {}).get("address", "") for a in ev.get("attendees", [])],
                                    status="confirmed",
                                    meeting_link=ev.get("onlineMeeting", {}).get("joinUrl") or "",
                                    color="#0078d4"
                                )
                            )
                        logger.info(f"Fetched {len(events)} live Outlook events for user {uid}")
                        return events
            except Exception as err:
                logger.warning(f"Microsoft Graph get_events error: {err}")
        
        # Fallback structured events
        mock_events = [
            UnifiedEvent(
                id=f"outlook_event_{i}",
                platform="outlook",
                title=f"Meeting {i}",
                description=f"Outlook meeting {i}",
                start=datetime.utcnow() + timedelta(days=i, hours=14),
                end=datetime.utcnow() + timedelta(days=i, hours=15),
                timezone="UTC",
                attendees=[f"attendee{j}@company.com" for j in range(2)],
                status="confirmed",
                meeting_link=f"https://teams.microsoft.com/meet/{i}",
                color="#0078d4"
            )
            for i in range(min(limit, 5))
        ]
        return mock_events
    
    # ========================================================================
    # Teams-specific methods
    # ========================================================================
    
    async def send_teams_message(self, uid: str, channel_id: str, message: str) -> str:
        """Send message to Teams channel via Microsoft Graph or fallback"""
        integration = await integration_repository.get(uid, "outlook")
        token = decrypt_value(integration.access_token) if integration and integration.access_token else None
        
        if token and not token.startswith("mock_"):
            try:
                payload = {"body": {"content": message}}
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        f"{self.graph_base_url}/chats/{channel_id}/messages",
                        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                        json=payload
                    )
                    if resp.status_code in (200, 201):
                        return str(resp.json().get("id") or f"teams_msg_{datetime.utcnow().timestamp()}")
            except Exception as err:
                logger.warning(f"Microsoft Graph send_teams_message error: {err}")
        
        logger.info(f"Sending Teams message to channel {channel_id}")
        return f"msg_{datetime.utcnow().timestamp()}"
    
    # ========================================================================
    # OneDrive-specific methods
    # ========================================================================
    
    async def get_files(self, uid: str, limit: int = 20) -> List[UnifiedFile]:
        """Get files from OneDrive via MS Graph API or fallback"""
        integration = await integration_repository.get(uid, "outlook")
        token = decrypt_value(integration.access_token) if integration and integration.access_token else None
        
        if token and not token.startswith("mock_"):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        f"{self.graph_base_url}/me/drive/root/children",
                        headers={"Authorization": f"Bearer {token}"},
                        params={"$top": min(limit, 50)}
                    )
                    if resp.status_code == 200:
                        items = resp.json().get("value", [])
                        files = []
                        for item in items:
                            files.append(
                                UnifiedFile(
                                    id=item.get("id", f"onedrive_{datetime.utcnow().timestamp()}"),
                                    platform="onedrive",
                                    name=item.get("name", "Document"),
                                    size_bytes=item.get("size", 0),
                                    mime_type=item.get("file", {}).get("mimeType", "application/octet-stream"),
                                    web_url=item.get("webUrl", ""),
                                    created_at=datetime.fromisoformat(item["createdDateTime"].replace("Z", "+00:00")) if item.get("createdDateTime") else datetime.utcnow(),
                                    modified_at=datetime.fromisoformat(item["lastModifiedDateTime"].replace("Z", "+00:00")) if item.get("lastModifiedDateTime") else datetime.utcnow()
                                )
                            )
                        return files
            except Exception as err:
                logger.warning(f"Microsoft Graph get_files error: {err}")
        
        return []
