"""
Security Utilities and Helpers
"""
import secrets
import string
from typing import Optional
import hashlib


def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_verification_token() -> str:
    """Generate email verification token"""
    return secrets.token_urlsafe(32)


def generate_password_reset_token() -> str:
    """Generate password reset token"""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a token for storage"""
    return hashlib.sha256(token.encode()).hexdigest()


def verify_token_hash(token: str, token_hash: str) -> bool:
    """Verify a token against its hash"""
    return hash_token(token) == token_hash


def generate_session_id() -> str:
    """Generate a unique session ID"""
    return secrets.token_urlsafe(24)


def generate_api_key() -> str:
    """Generate API key"""
    return f"wp_{secrets.token_urlsafe(32)}"
