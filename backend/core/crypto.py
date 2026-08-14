"""
Token encryption helpers for integration credentials.
"""
import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken

from core.config import settings


def _fernet() -> Fernet:
    raw = settings.INTEGRATION_TOKEN_ENCRYPTION_KEY.strip()
    if raw:
        # Fernet requires a 32-byte base64-encoded key
        # Hash the raw key to get exactly 32 bytes
        key_bytes = hashlib.sha256(raw.encode()).digest()
        key = base64.urlsafe_b64encode(key_bytes)
    else:
        # Fallback to JWT secret
        digest = hashlib.sha256(settings.JWT_SECRET_KEY.encode()).digest()
        key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_value(value: str) -> str:
    if not value:
        return ""
    return _fernet().encrypt(value.encode()).decode()


def decrypt_value(value: str) -> str:
    if not value:
        return ""
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("Failed to decrypt integration token") from exc
