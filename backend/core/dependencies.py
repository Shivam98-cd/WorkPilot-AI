"""
FastAPI Dependencies for Dependency Injection
"""
from fastapi import Depends
from repositories.user_repository import user_repository
from repositories.session_repository import session_repository
from services.auth_service import auth_service
from services.user_service import user_service


def get_user_repository():
    """Get user repository instance"""
    return user_repository


def get_session_repository():
    """Get session repository instance"""
    return session_repository


def get_auth_service():
    """Get auth service instance"""
    return auth_service


def get_user_service():
    """Get user service instance"""
    return user_service
