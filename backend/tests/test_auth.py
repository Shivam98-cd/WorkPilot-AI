"""
Authentication Service Tests
"""
import pytest
from datetime import datetime
from services.auth_service import auth_service
from models.user import User


@pytest.mark.asyncio
async def test_register_user():
    """Test user registration"""
    result = await auth_service.register_user(
        name="Test User",
        email="test@example.com",
        password="Test@1234",
        provider="email"
    )
    
    assert result is not None
    assert 'user' in result
    assert 'tokens' in result
    assert result['user'].email == "test@example.com"


@pytest.mark.asyncio
async def test_login():
    """Test user login"""
    device_info = {
        'device': 'Test Device',
        'browser': 'Test Browser',
        'ip': '127.0.0.1',
        'location': None
    }
    
    result = await auth_service.login(
        email="test@example.com",
        password="Test@1234",
        device_info=device_info
    )
    
    assert result is not None
    assert 'user' in result
    assert 'tokens' in result
    assert 'session' in result
