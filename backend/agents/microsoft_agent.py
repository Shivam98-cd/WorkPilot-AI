"""
Microsoft Agent

Handles Microsoft 365, Outlook, Teams, and OneDrive integrations.
Uses Microsoft Graph API.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from agents.base_agent import AgentHealth, BaseIntegrationAgent, SyncResult, retry_with_backoff
from core.crypto import decrypt_value
from models.unified_data import UnifiedEvent, UnifiedMessage, UnifiedFile
from repositories.integration_repository import integration_repository

logger = logging.getLogger(__name__)


class MicrosoftAgent(BaseIntegrationAgent):
    """Agent for Microsoft platforms: Outlook, Teams, OneDrive, Microsoft 365"""
    
    def __init__(self):
        super().__init__(platform="microsoft")
    
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
        """Get email messages from Outlook"""
        integration = await integration_repository.get(uid, "outlook")
        if not integration or integration.status != "connected":
            return []
        
        # Mock data
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
        
        logger.info(f"Fetched {len(mock_messages)} Outlook messages for user {uid}")
        return mock_messages
    
    async def get_message(self, uid: str, message_id: str) -> UnifiedMessage:
        """Get single message details"""
        messages = await self.get_messages(uid, limit=1)
        return messages[0] if messages else None
    
    async def send_email(self, uid: str, to: str, subject: str, body: str) -> str:
        """Send email via Outlook"""
        logger.info(f"Sending Outlook email from {uid} to {to}")
        return f"msg_sent_{datetime.utcnow().timestamp()}"
    
    # ========================================================================
    # Calendar-specific methods
    # ========================================================================
    
    @retry_with_backoff(max_attempts=2, backoff_seconds=3)
    async def get_events(self, uid: str, days_ahead: int = 7, limit: int = 50) -> List[UnifiedEvent]:
        """Get calendar events from Outlook Calendar"""
        integration = await integration_repository.get(uid, "outlook")
        if not integration or integration.status != "connected":
            return []
        
        # Mock data
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
        
        logger.info(f"Fetched {len(mock_events)} Outlook events for user {uid}")
        return mock_events
    
    # ========================================================================
    # Teams-specific methods
    # ========================================================================
    
    async def send_teams_message(self, uid: str, channel_id: str, message: str) -> str:
        """Send message to Teams channel"""
        logger.info(f"Sending Teams message to channel {channel_id}")
        # TODO: Implement with Microsoft Graph API
        return f"msg_{datetime.utcnow().timestamp()}"
    
    # ========================================================================
    # OneDrive-specific methods
    # ========================================================================
    
    async def get_files(self, uid: str, limit: int = 20) -> List[UnifiedFile]:
        """Get files from OneDrive"""
        # TODO: Implement with Microsoft Graph API
        return []
