"""
Productivity Agent

Handles Notion and Trello integrations for task and project management.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from agents.base_agent import AgentHealth, BaseIntegrationAgent, SyncResult, retry_with_backoff
from core.crypto import decrypt_value
from models.unified_data import UnifiedTask
from repositories.integration_repository import integration_repository

logger = logging.getLogger(__name__)


class ProductivityAgent(BaseIntegrationAgent):
    """Agent for productivity platforms: Notion and Trello"""
    
    def __init__(self):
        super().__init__(platform="productivity")
    
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
            notion_integration = await integration_repository.get(uid, "notion")
            trello_integration = await integration_repository.get(uid, "trello")
            
            if notion_integration and notion_integration.status == "connected":
                try:
                    pages = await self.get_notion_pages(uid)
                    items_synced += len(pages)
                except Exception as e:
                    errors.append(f"Notion sync failed: {str(e)}")
            
            if trello_integration and trello_integration.status == "connected":
                try:
                    cards = await self.get_trello_cards(uid)
                    items_synced += len(cards)
                except Exception as e:
                    errors.append(f"Trello sync failed: {str(e)}")
            
            success = len(errors) == 0
            if success:
                self._reset_error_count()
            else:
                self._increment_error_count()
            
            return SyncResult(
                platform="productivity",
                success=success,
                items_synced=items_synced,
                last_sync=datetime.utcnow(),
                errors=errors
            )
        except Exception as e:
            self._increment_error_count()
            return SyncResult(
                platform="productivity",
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
            notion_integration = await integration_repository.get(uid, "notion")
            trello_integration = await integration_repository.get(uid, "trello")
            
            if not notion_integration and not trello_integration:
                return AgentHealth(
                    platform="productivity",
                    status="down",
                    token_valid=False,
                    last_sync=None,
                    error_count=0,
                    response_time_ms=0
                )
            
            primary = notion_integration or trello_integration
            
            end_time = datetime.utcnow()
            response_time_ms = (end_time - start_time).total_seconds() * 1000
            
            status = "healthy" if self._get_error_count() < 5 else "degraded"
            
            return AgentHealth(
                platform="productivity",
                status=status,
                token_valid=True,
                last_sync=primary.last_sync_at,
                error_count=self._get_error_count(),
                response_time_ms=response_time_ms
            )
        except Exception as e:
            return AgentHealth(
                platform="productivity",
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
    # Notion-specific methods
    # ========================================================================
    
    @retry_with_backoff(max_attempts=2, backoff_seconds=3)
    async def get_notion_pages(self, uid: str, limit: int = 20) -> List[UnifiedTask]:
        """Get pages from Notion"""
        integration = await integration_repository.get(uid, "notion")
        if not integration or integration.status != "connected":
            return []
        
        # Mock data
        mock_pages = [
            UnifiedTask(
                id=f"notion_{i}",
                platform="notion",
                title=f"Notion Page: {i}",
                description=f"Page content {i}",
                status="in_progress" if i % 2 == 0 else "done",
                labels=["documentation"],
                project="WorkPilot Docs"
            )
            for i in range(min(limit, 5))
        ]
        
        logger.info(f"Fetched {len(mock_pages)} Notion pages for user {uid}")
        return mock_pages
    
    async def create_notion_page(
        self,
        uid: str,
        database_id: str,
        title: str,
        properties: Dict[str, Any]
    ) -> str:
        """Create Notion page"""
        logger.info(f"Creating Notion page: {title}")
        # TODO: Implement with notion-client
        return f"notion_page_{datetime.utcnow().timestamp()}"
    
    # ========================================================================
    # Trello-specific methods
    # ========================================================================
    
    @retry_with_backoff(max_attempts=2, backoff_seconds=3)
    async def get_trello_cards(self, uid: str, limit: int = 20) -> List[UnifiedTask]:
        """Get cards from Trello"""
        integration = await integration_repository.get(uid, "trello")
        if not integration or integration.status != "connected":
            return []
        
        # Mock data
        mock_cards = [
            UnifiedTask(
                id=f"trello_{i}",
                platform="trello",
                title=f"Trello Card: Task {i}",
                description=f"Task description {i}",
                status="open" if i % 2 == 0 else "done",
                labels=["feature", "ui"],
                project="WorkPilot Board",
                url=f"https://trello.com/c/abc{i}"
            )
            for i in range(min(limit, 5))
        ]
        
        logger.info(f"Fetched {len(mock_cards)} Trello cards for user {uid}")
        return mock_cards
    
    async def create_trello_card(
        self,
        uid: str,
        list_id: str,
        name: str,
        description: Optional[str] = None
    ) -> str:
        """Create Trello card"""
        logger.info(f"Creating Trello card: {name}")
        # TODO: Implement with py-trello
        return f"trello_card_{datetime.utcnow().timestamp()}"
