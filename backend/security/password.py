"""
Password Hashing and Verification using Argon2
"""
from passlib.context import CryptContext
from passlib.hash import argon2


pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__memory_cost=65536,
    argon2__time_cost=3,
    argon2__parallelism=4,
)


def hash_password(password: str) -> str:
    """Hash a password using Argon2"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def needs_update(hashed_password: str) -> bool:
    """Check if password hash needs update"""
    return pwd_context.needs_update(hashed_password)
