"""
Audit Log Domain Model
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any


@dataclass
class AuditLog:
    """Audit log domain model for tracking user actions"""
    id: str
    user_id: str
    action: str
    resource: str
    resource_id: Optional[str]
    ip_address: str
    user_agent: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert audit log to dictionary"""
        return {
            'id': self.id,
            'userId': self.user_id,
            'action': self.action,
            'resource': self.resource,
            'resourceId': self.resource_id,
            'ipAddress': self.ip_address,
            'userAgent': self.user_agent,
            'timestamp': self.timestamp.isoformat(),
            'metadata': self.metadata,
        }
