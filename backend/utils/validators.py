"""
Input Validation Utilities
"""
import re
from typing import Optional
from core.exceptions import ValidationException


def validate_email(email: str) -> bool:
    """Validate email format"""
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        raise ValidationException("Invalid email format")
    return True


def validate_password_strength(password: str) -> bool:
    """Validate password strength"""
    if len(password) < 8:
        raise ValidationException("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        raise ValidationException("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        raise ValidationException("Password must contain at least one lowercase letter")
    
    if not re.search(r'[0-9]', password):
        raise ValidationException("Password must contain at least one number")
    
    if not re.search(r'[^A-Za-z0-9]', password):
        raise ValidationException("Password must contain at least one special character")
    
    return True


def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS"""
    dangerous_chars = ['<', '>', '"', "'", '&']
    sanitized = text
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    return sanitized.strip()


def validate_uid(uid: str) -> bool:
    """Validate Firebase UID format"""
    if not uid or len(uid) < 10 or len(uid) > 128:
        raise ValidationException("Invalid UID format")
    return True
