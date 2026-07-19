"""
User Domain Model
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any


@dataclass
class User:
    """User domain model"""
    uid: str
    email: str
    name: str
    photo: Optional[str]
    created_at: datetime
    last_login: datetime
    provider: str
    role: str
    plan: str
    email_verified: bool
    preferences: Optional[Dict[str, Any]]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary"""
        return {
            'uid': self.uid,
            'email': self.email,
            'name': self.name,
            'photo': self.photo,
            'createdAt': self.created_at.isoformat(),
            'lastLogin': self.last_login.isoformat(),
            'provider': self.provider,
            'role': self.role,
            'plan': self.plan,
            'emailVerified': self.email_verified,
            'preferences': self.preferences,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """Create user from dictionary"""
        return cls(
            uid=data.get('uid'),
            email=data.get('email'),
            name=data.get('name'),
            photo=data.get('photo'),
            created_at=datetime.fromisoformat(data.get('createdAt')) if isinstance(data.get('createdAt'), str) else data.get('createdAt'),
            last_login=datetime.fromisoformat(data.get('lastLogin')) if isinstance(data.get('lastLogin'), str) else data.get('lastLogin'),
            provider=data.get('provider'),
            role=data.get('role', 'user'),
            plan=data.get('plan', 'free'),
            email_verified=data.get('emailVerified', False),
            preferences=data.get('preferences'),
        )
