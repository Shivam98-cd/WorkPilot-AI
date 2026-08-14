"""
Integration Repository - Firestore data access with in-memory fallback
"""
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional

from firebase.firestore import firestore_service
from models.integration import UserIntegration

_memory_store: Dict[str, Dict[str, UserIntegration]] = defaultdict(dict)


class IntegrationRepository:
    COLLECTION = "user_integrations"

    def _use_memory(self) -> bool:
        return firestore_service.db is None

    async def upsert(self, integration: UserIntegration) -> UserIntegration:
        if self._use_memory():
            _memory_store[integration.uid][integration.platform] = integration
            return integration

        doc_id = UserIntegration.doc_id(integration.uid, integration.platform)
        existing = await self.get(integration.uid, integration.platform)
        payload = integration.to_dict()
        if existing:
            await firestore_service.update_document(self.COLLECTION, doc_id, payload)
        else:
            await firestore_service.create_document(self.COLLECTION, doc_id, payload)
        return await self.get(integration.uid, integration.platform)

    async def get(self, uid: str, platform: str) -> Optional[UserIntegration]:
        if self._use_memory():
            return _memory_store.get(uid, {}).get(platform)

        doc_id = UserIntegration.doc_id(uid, platform)
        data = await firestore_service.get_document(self.COLLECTION, doc_id)
        if not data:
            return None
        return UserIntegration.from_dict(data)

    async def list_for_user(self, uid: str) -> List[UserIntegration]:
        if self._use_memory():
            return list(_memory_store.get(uid, {}).values())

        rows = await firestore_service.query_documents(
            self.COLLECTION,
            filters=[("uid", "==", uid)],
        )
        return [UserIntegration.from_dict(row) for row in rows]

    async def delete(self, uid: str, platform: str) -> bool:
        if self._use_memory():
            return _memory_store.get(uid, {}).pop(platform, None) is not None

        doc_id = UserIntegration.doc_id(uid, platform)
        return await firestore_service.delete_document(self.COLLECTION, doc_id)

    async def mark_disconnected(self, uid: str, platform: str) -> None:
        doc_id = UserIntegration.doc_id(uid, platform)
        await firestore_service.update_document(
            self.COLLECTION,
            doc_id,
            {
                "status": "revoked",
                "accessTokenEnc": None,
                "refreshTokenEnc": None,
                "tokenExpiresAt": None,
                "updatedAt": datetime.utcnow(),
            },
        )


integration_repository = IntegrationRepository()
