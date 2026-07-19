"""
Session Domain Model
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any


@dataclass
class Session:
    """Session domain model"""
    id: str
    user_id: str
    device: str
    browser: str
    ip: str
    location: Optional[str]
    created_at: datetime
    last_active: datetime
    is_active: bool
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary"""
        return {
            'id': self.id,
            'userId': self.user_id,
            'device': self.device,
            'browser': self.browser,
            'ip': self.ip,
            'location': self.location,
            'createdAt': self.created_at.isoformat(),
            'lastActive': self.last_active.isoformat(),
            'isActive': self.is_active,
        }
