"""
Communication Agent

Handles Slack and Zoom integrations for team communication.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from agents.base_agent import AgentHealth, BaseIntegrationAgent, SyncResult, retry_with_backoff
from core.crypto import decrypt_value
from models.unified_data import UnifiedEvent, UnifiedMessage
from repositories.integration_repository import integration_repository

logger = logging.getLogger(__name__)


class CommunicationAgent(BaseIntegrationAgent):
    """Agent for communication platforms: Slack and Zoom"""
    
    def __init__(self):
        super().__init__(platform="communication")
    
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
            slack_integration = await integration_repository.get(uid, "slack")
            zoom_integration = await integration_repository.get(uid, "zoom")
            
            if slack_integration and slack_integration.status == "connected":
                try:
                    # Sync Slack channels/messages
                    items_synced += 5  # Mock
                except Exception as e:
                    errors.append(f"Slack sync failed: {str(e)}")
            
            if zoom_integration and zoom_integration.status == "connected":
                try:
                    # Sync Zoom meetings
                    meetings = await self.get_zoom_meetings(uid)
                    items_synced += len(meetings)
                except Exception as e:
                    errors.append(f"Zoom sync failed: {str(e)}")
            
            success = len(errors) == 0
            if success:
                self._reset_error_count()
            else:
                self._increment_error_count()
            
            return SyncResult(
                platform="communication",
                success=success,
                items_synced=items_synced,
                last_sync=datetime.utcnow(),
                errors=errors
            )
        except Exception as e:
            self._increment_error_count()
            return SyncResult(
                platform="communication",
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
            slack_integration = await integration_repository.get(uid, "slack")
            zoom_integration = await integration_repository.get(uid, "zoom")
            
            if not slack_integration and not zoom_integration:
                return AgentHealth(
                    platform="communication",
                    status="down",
                    token_valid=False,
                    last_sync=None,
                    error_count=0,
                    response_time_ms=0
                )
            
            primary = slack_integration or zoom_integration
            
            end_time = datetime.utcnow()
            response_time_ms = (end_time - start_time).total_seconds() * 1000
            
            status = "healthy" if self._get_error_count() < 5 else "degraded"
            
            return AgentHealth(
                platform="communication",
                status=status,
                token_valid=True,
                last_sync=primary.last_sync_at,
                error_count=self._get_error_count(),
                response_time_ms=response_time_ms
            )
        except Exception as e:
            return AgentHealth(
                platform="communication",
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
    # Slack-specific methods
    # ========================================================================
    
    @retry_with_backoff(max_attempts=2, backoff_seconds=3)
    async def send_slack_message(self, uid: str, channel_id: str, text: str) -> str:
        """Send message to Slack channel"""
        integration = await integration_repository.get(uid, "slack")
        if not integration or integration.status != "connected":
            raise Exception("Slack not connected")
        
        logger.info(f"Sending Slack message to {channel_id}")
        # TODO: Implement with slack-sdk
        return f"msg_{datetime.utcnow().timestamp()}"
    
    async def send_message(self, uid: str, channel_id: str, text: str) -> str:
        """Alias for send_slack_message (used by workflows)"""
        return await self.send_slack_message(uid, channel_id, text)
    
    async def get_slack_channels(self, uid: str) -> List[Dict[str, Any]]:
        """List Slack channels"""
        logger.info(f"Fetching Slack channels for user {uid}")
        # TODO: Implement with slack-sdk
        return []
    
    # ========================================================================
    # Zoom-specific methods
    # ========================================================================
    
    @retry_with_backoff(max_attempts=2, backoff_seconds=3)
    async def get_zoom_meetings(self, uid: str, limit: int = 10) -> List[UnifiedEvent]:
        """Get Zoom meetings"""
        integration = await integration_repository.get(uid, "zoom")
        if not integration or integration.status != "connected":
            return []
        
        # Mock data
        mock_meetings = [
            UnifiedEvent(
                id=f"zoom_{i}",
                platform="zoom",
                title=f"Zoom Meeting {i}",
                description=f"Scheduled Zoom call {i}",
                start=datetime.utcnow() + timedelta(days=i, hours=10),
                end=datetime.utcnow() + timedelta(days=i, hours=11),
                timezone="UTC",
                attendees=[],
                meeting_link=f"https://zoom.us/j/123456789{i}",
                status="confirmed"
            )
            for i in range(min(limit, 3))
        ]
        
        logger.info(f"Fetched {len(mock_meetings)} Zoom meetings for user {uid}")
        return mock_meetings
    
    async def create_zoom_meeting(
        self,
        uid: str,
        topic: str,
        start_time: datetime,
        duration_minutes: int = 60
    ) -> str:
        """Create Zoom meeting"""
        logger.info(f"Creating Zoom meeting: {topic}")
        # TODO: Implement with zoom-api-python
        return f"https://zoom.us/j/123456789"
    
    async def get_events(self, uid: str, days_ahead: int = 7) -> List[UnifiedEvent]:
        """Get events (Zoom meetings) - helper for unified calendar"""
        return await self.get_zoom_meetings(uid, limit=20)
