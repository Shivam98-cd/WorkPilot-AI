"""
Audit Service - Business Logic for Audit Logging
"""
from datetime import datetime
from typing import Optional, Dict, Any
import uuid

from models.audit import AuditLog
from repositories.audit_repository import audit_repository


class AuditService:
    """Audit logging business logic service"""
    
    async def log_action(
        self,
        user_id: str,
        action: str,
        resource: str,
        resource_id: Optional[str],
        ip_address: str,
        user_agent: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """Log a user action"""
        audit_log = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow(),
            metadata=metadata or {},
        )
        
        return await audit_repository.create(audit_log)
    
    async def get_user_audit_trail(self, user_id: str, limit: int = 100):
        """Get audit trail for a user"""
        logs = await audit_repository.get_user_logs(user_id, limit)
        return [log.to_dict() for log in logs]


audit_service = AuditService()
