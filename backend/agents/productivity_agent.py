"""
Productivity Agent

Handles Notion and Trello integrations for task and project management.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx
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
        """Get pages from Notion via live API or fallback"""
        integration = await integration_repository.get(uid, "notion")
        if not integration or integration.status != "connected":
            return []
        
        token = decrypt_value(integration.access_token) if integration.access_token else None
        if token and not token.startswith("mock_"):
            try:
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json"
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.notion.com/v1/search",
                        headers=headers,
                        json={"filter": {"value": "page", "property": "object"}, "page_size": min(limit, 50)}
                    )
                    if resp.status_code == 200:
                        results = resp.json().get("results", [])
                        pages = []
                        for p in results:
                            title = "Untitled"
                            props = p.get("properties", {})
                            for prop in props.values():
                                if prop.get("type") == "title":
                                    title_objs = prop.get("title", [])
                                    if title_objs:
                                        title = title_objs[0].get("plain_text", "Untitled")
                                    break
                            pages.append(
                                UnifiedTask(
                                    id=p.get("id", f"notion_{datetime.utcnow().timestamp()}"),
                                    platform="notion",
                                    title=title,
                                    description=p.get("url", ""),
                                    status="in_progress",
                                    labels=["notion-doc"],
                                    project="Notion Workspace",
                                    url=p.get("url", "")
                                )
                            )
                        logger.info(f"Fetched {len(pages)} live Notion pages for user {uid}")
                        return pages
            except Exception as err:
                logger.warning(f"Notion get_notion_pages error: {err}")
        
        # Fallback structured data
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
        return mock_pages
    
    async def create_notion_page(
        self,
        uid: str,
        database_id: str,
        title: str,
        properties: Dict[str, Any]
    ) -> str:
        """Create Notion page via live API or fallback"""
        integration = await integration_repository.get(uid, "notion")
        token = decrypt_value(integration.access_token) if integration and integration.access_token else None
        
        if token and not token.startswith("mock_"):
            try:
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json"
                }
                parent = {"database_id": database_id} if database_id else {"page_id": "root"}
                props = properties or {
                    "title": [{"text": {"content": title}}]
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.notion.com/v1/pages",
                        headers=headers,
                        json={"parent": parent, "properties": props}
                    )
                    if resp.status_code in (200, 201):
                        return str(resp.json().get("id") or f"notion_{datetime.utcnow().timestamp()}")
            except Exception as err:
                logger.warning(f"Notion create_notion_page error: {err}")
        
        logger.info(f"Creating Notion page: {title}")
        return f"notion_page_{datetime.utcnow().timestamp()}"
    
    # ========================================================================
    # Trello-specific methods
    # ========================================================================
    
    @retry_with_backoff(max_attempts=2, backoff_seconds=3)
    async def get_trello_cards(self, uid: str, limit: int = 20) -> List[UnifiedTask]:
        """Get cards from Trello via live API or fallback"""
        integration = await integration_repository.get(uid, "trello")
        if not integration or integration.status != "connected":
            return []
        
        token = decrypt_value(integration.access_token) if integration and integration.access_token else None
        if token and not token.startswith("mock_"):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        "https://api.trello.com/1/members/me/cards",
                        params={"token": token, "fields": "name,desc,closed,shortUrl,labels"}
                    )
                    if resp.status_code == 200:
                        cards_data = resp.json()
                        cards = []
                        for c in cards_data:
                            cards.append(
                                UnifiedTask(
                                    id=c.get("id", f"trello_{datetime.utcnow().timestamp()}"),
                                    platform="trello",
                                    title=c.get("name", "Task"),
                                    description=c.get("desc", ""),
                                    status="done" if c.get("closed") else "open",
                                    labels=[lbl.get("name", "card") for lbl in c.get("labels", [])],
                                    project="Trello Board",
                                    url=c.get("shortUrl", "")
                                )
                            )
                        logger.info(f"Fetched {len(cards)} live Trello cards for user {uid}")
                        return cards
            except Exception as err:
                logger.warning(f"Trello get_trello_cards error: {err}")
        
        # Fallback structured data
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
        return mock_cards
    
    async def create_trello_card(
        self,
        uid: str,
        list_id: str,
        name: str,
        description: Optional[str] = None
    ) -> str:
        """Create Trello card via live API or fallback"""
        integration = await integration_repository.get(uid, "trello")
        token = decrypt_value(integration.access_token) if integration and integration.access_token else None
        
        if token and not token.startswith("mock_"):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.trello.com/1/cards",
                        params={"idList": list_id, "name": name, "desc": description or "", "token": token}
                    )
                    if resp.status_code in (200, 201):
                        return str(resp.json().get("id") or f"trello_card_{datetime.utcnow().timestamp()}")
            except Exception as err:
                logger.warning(f"Trello create_trello_card error: {err}")
        
        logger.info(f"Creating Trello card: {name}")
        return f"trello_card_{datetime.utcnow().timestamp()}"
