"""
Helper Utility Functions
"""
from datetime import datetime, timezone
from typing import Any, Dict
import hashlib
import secrets


def generate_random_token(length: int = 32) -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)


def hash_string(text: str) -> str:
    """Hash a string using SHA256"""
    return hashlib.sha256(text.encode()).hexdigest()


def get_utc_now() -> datetime:
    """Get current UTC datetime"""
    return datetime.now(timezone.utc)


def format_datetime(dt: datetime) -> str:
    """Format datetime to ISO string"""
    return dt.isoformat()


def parse_datetime(dt_string: str) -> datetime:
    """Parse ISO datetime string"""
    return datetime.fromisoformat(dt_string)


def mask_email(email: str) -> str:
    """Mask email for privacy"""
    parts = email.split('@')
    if len(parts) != 2:
        return email
    
    username = parts[0]
    domain = parts[1]
    
    if len(username) <= 2:
        masked_username = username[0] + '*'
    else:
        masked_username = username[0] + '*' * (len(username) - 2) + username[-1]
    
    return f"{masked_username}@{domain}"


def create_response(
    success: bool = True,
    data: Any = None,
    message: str = None,
    error: Dict[str, Any] = None
) -> Dict[str, Any]:
    """Create standardized API response"""
    response = {"success": success}
    
    if data is not None:
        response["data"] = data
    
    if message:
        response["message"] = message
    
    if error:
        response["error"] = error
    
    return response
