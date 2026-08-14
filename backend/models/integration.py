"""
User Integration Domain Model
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class UserIntegration:
    """Third-party workspace integration for a user."""

    uid: str
    platform: str
    status: str = "pending"
    connected_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None
    last_sync_status: Optional[str] = None
    last_sync_error: Optional[str] = None
    scopes: List[str] = field(default_factory=list)
    account_label: Optional[str] = None
    account_avatar: Optional[str] = None
    access_token_enc: Optional[str] = None
    refresh_token_enc: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    @staticmethod
    def doc_id(uid: str, platform: str) -> str:
        return f"{uid}_{platform}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "uid": self.uid,
            "platform": self.platform,
            "status": self.status,
            "connectedAt": self.connected_at.isoformat() if self.connected_at else None,
            "lastSyncAt": self.last_sync_at.isoformat() if self.last_sync_at else None,
            "lastSyncStatus": self.last_sync_status,
            "lastSyncError": self.last_sync_error,
            "scopes": self.scopes,
            "accountLabel": self.account_label,
            "accountAvatar": self.account_avatar,
            "accessTokenEnc": self.access_token_enc,
            "refreshTokenEnc": self.refresh_token_enc,
            "tokenExpiresAt": self.token_expires_at.isoformat() if self.token_expires_at else None,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserIntegration":
        def _parse_dt(value):
            if not value:
                return None
            if isinstance(value, datetime):
                return value
            return datetime.fromisoformat(value.replace("Z", "+00:00").replace("+00:00", ""))

        return cls(
            uid=data.get("uid", ""),
            platform=data.get("platform", ""),
            status=data.get("status", "pending"),
            connected_at=_parse_dt(data.get("connectedAt")),
            last_sync_at=_parse_dt(data.get("lastSyncAt")),
            last_sync_status=data.get("lastSyncStatus"),
            last_sync_error=data.get("lastSyncError"),
            scopes=data.get("scopes") or [],
            account_label=data.get("accountLabel"),
            account_avatar=data.get("accountAvatar"),
            access_token_enc=data.get("accessTokenEnc"),
            refresh_token_enc=data.get("refreshTokenEnc"),
            token_expires_at=_parse_dt(data.get("tokenExpiresAt")),
            metadata=data.get("metadata") or {},
        )
