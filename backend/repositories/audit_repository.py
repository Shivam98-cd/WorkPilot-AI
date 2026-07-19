"""
Audit Log Repository - Data Access Layer
"""
from typing import List
from firebase.firestore import firestore_service
from models.audit import AuditLog


class AuditRepository:
    """Audit log data access repository"""
    
    COLLECTION = "audit_logs"
    
    async def create(self, audit_log: AuditLog) -> AuditLog:
        """Create a new audit log"""
        audit_dict = audit_log.to_dict()
        await firestore_service.create_document(
            self.COLLECTION,
            audit_log.id,
            audit_dict
        )
        return audit_log
    
    async def get_user_logs(self, user_id: str, limit: int = 100) -> List[AuditLog]:
        """Get audit logs for a user"""
        logs_dict = await firestore_service.query_documents(
            self.COLLECTION,
            filters=[('userId', '==', user_id)],
            order_by='timestamp',
            limit=limit
        )
        return [AuditLog(
            id=log['id'],
            user_id=log['userId'],
            action=log['action'],
            resource=log['resource'],
            resource_id=log.get('resourceId'),
            ip_address=log['ipAddress'],
            user_agent=log['userAgent'],
            timestamp=log['timestamp'],
            metadata=log.get('metadata'),
        ) for log in logs_dict]


audit_repository = AuditRepository()
