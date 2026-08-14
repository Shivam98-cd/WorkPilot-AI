"""Persistence for user-owned workspace records.

Firestore is used in a configured environment.  The memory implementation is
deliberately limited to development and tests, so endpoint code never needs to
fall back to module-level mutable demo data.
"""
from collections import defaultdict
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from firebase.firestore import firestore_service


_memory_store: Dict[str, Dict[str, Dict[str, Dict[str, Any]]]] = defaultdict(
    lambda: defaultdict(dict)
)


class WorkspaceRepository:
    """Generic repository for small user-scoped workspace records."""

    def _use_memory(self) -> bool:
        return firestore_service.db is None

    @staticmethod
    def _document_id(uid: str, record_id: str) -> str:
        # UUID record IDs are globally unique; storing the user ID in the
        # document payload keeps queries scoped without changing the public ID.
        return record_id

    async def list(self, collection: str, uid: str) -> List[Dict[str, Any]]:
        if self._use_memory():
            return [deepcopy(item) for item in _memory_store[collection][uid].values()]
        return await firestore_service.query_documents(collection, filters=[("uid", "==", uid)])

    async def get(self, collection: str, uid: str, record_id: str) -> Optional[Dict[str, Any]]:
        if self._use_memory():
            item = _memory_store[collection][uid].get(record_id)
            return deepcopy(item) if item else None
        return await firestore_service.get_document(collection, self._document_id(uid, record_id))

    async def upsert(
        self, collection: str, uid: str, record_id: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        payload = deepcopy(data)
        payload.update({"id": record_id, "uid": uid, "updatedAt": datetime.now(timezone.utc).isoformat()})
        if self._use_memory():
            existing = _memory_store[collection][uid].get(record_id)
            payload.setdefault("createdAt", existing.get("createdAt") if existing else datetime.now(timezone.utc).isoformat())
            _memory_store[collection][uid][record_id] = payload
            return deepcopy(payload)

        document_id = self._document_id(uid, record_id)
        if await firestore_service.get_document(collection, document_id):
            await firestore_service.update_document(collection, document_id, payload)
        else:
            await firestore_service.create_document(collection, document_id, payload)
        return await firestore_service.get_document(collection, document_id)

    async def delete(self, collection: str, uid: str, record_id: str) -> bool:
        if self._use_memory():
            return _memory_store[collection][uid].pop(record_id, None) is not None
        return await firestore_service.delete_document(collection, self._document_id(uid, record_id))


workspace_repository = WorkspaceRepository()
