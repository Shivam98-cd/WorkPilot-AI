"""Durable user-scoped conversation storage."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from repositories.workspace_repository import workspace_repository


class ChatRepository:
    COLLECTION = "chat_conversations"

    async def list_conversations(self, uid: str) -> List[Dict[str, Any]]:
        rows = await workspace_repository.list(self.COLLECTION, uid)
        return sorted(rows, key=lambda row: row.get("updatedAt", ""), reverse=True)

    async def get(self, uid: str, conversation_id: str) -> Optional[Dict[str, Any]]:
        return await workspace_repository.get(self.COLLECTION, uid, conversation_id)

    async def upsert(self, uid: str, conversation_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        payload = dict(data)
        payload.setdefault("messages", [])
        payload.setdefault("title", "New workspace chat")
        payload["updatedAt"] = datetime.now(timezone.utc).isoformat()
        payload["messageCount"] = len(payload["messages"])
        return await workspace_repository.upsert(self.COLLECTION, uid, conversation_id, payload)

    async def append_message(
        self, uid: str, conversation_id: str, message: Dict[str, Any], title: str
    ) -> Dict[str, Any]:
        existing = await self.get(uid, conversation_id) or {
            "title": title or "New workspace chat",
            "messages": [],
        }
        messages = [*existing.get("messages", []), message][-50:]
        return await self.upsert(
            uid,
            conversation_id,
            {"title": existing.get("title") or title, "messages": messages},
        )

    async def delete(self, uid: str, conversation_id: str) -> bool:
        return await workspace_repository.delete(self.COLLECTION, uid, conversation_id)


chat_repository = ChatRepository()
