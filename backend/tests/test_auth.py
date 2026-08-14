"""
Authentication Service Tests
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime
from services.auth_service import auth_service
from models.user import User
from models.session import Session
from security.password import hash_password


def make_fake_firebase_user(uid="firebase-uid-123", email="test@example.com", email_verified=True):
    """Create a fake Firebase user record compatible with get_user_by_email return."""
    fake = MagicMock()
    fake.uid = uid
    fake.email = email
    fake.email_verified = email_verified
    return fake


def make_db_user(uid="firebase-uid-123", email="test@example.com", name="Test User", password="Test@1234"):
    """Create a real User domain model as the repository would return."""
    return User(
        uid=uid,
        email=email,
        name=name,
        photo=None,
        created_at=datetime(2026, 1, 1),
        last_login=datetime(2026, 1, 1),
        provider="email",
        role="user",
        plan="free",
        email_verified=True,
        preferences={'theme': 'dark', 'notifications': True, 'language': 'en'},
        password_hash=hash_password(password),
    )


def make_session(user_uid="firebase-uid-123"):
    """Create a fake Session domain model."""
    return Session(
        id="session-uuid-123",
        user_id=user_uid,
        device="Test Device",
        browser="Test Browser",
        ip="127.0.0.1",
        location=None,
        created_at=datetime(2026, 1, 1),
        last_active=datetime(2026, 1, 1),
        is_active=True,
    )


@pytest.mark.asyncio
@patch("services.auth_service.user_repository")
@patch("services.auth_service.firebase_auth_service")
async def test_register_user(mock_firebase_auth, mock_user_repo):
    """Test user registration with mocked dependencies."""
    # Mock: no existing user by email
    mock_user_repo.get_by_email = AsyncMock(return_value=None)
    # Mock: Firebase returns a fake user
    fake_fb_user = make_fake_firebase_user()
    mock_firebase_auth.get_user_by_email = AsyncMock(return_value=fake_fb_user)
    # Mock: user_repository.create returns the user it was passed
    async def _create(user):
        user.password_hash = "hashed_mock_password"
        return user

    mock_user_repo.create = AsyncMock(side_effect=_create)

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
    assert result['user'].name == "Test User"
    assert 'accessToken' in result['tokens']
    assert 'refreshToken' in result['tokens']
    mock_user_repo.get_by_email.assert_awaited_once_with("test@example.com")
    mock_firebase_auth.get_user_by_email.assert_awaited_once_with("test@example.com")


@pytest.mark.asyncio
@patch("services.auth_service.session_repository")
@patch("services.auth_service.user_repository")
@patch("services.auth_service.firebase_auth_service")
async def test_login(mock_firebase_auth, mock_user_repo, mock_session_repo):
    """Test user login with mock infrastructure."""
    fake_fb_user = make_fake_firebase_user()
    db_user = make_db_user()

    mock_firebase_auth.get_user_by_email = AsyncMock(return_value=fake_fb_user)
    mock_user_repo.get_by_uid = AsyncMock(return_value=db_user)
    mock_user_repo.update = AsyncMock(return_value=db_user)

    fake_session = make_session(db_user.uid)
    mock_session_repo.create = AsyncMock(return_value=fake_session)

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
    assert result['user'].email == "test@example.com"
    assert 'accessToken' in result['tokens']
    assert 'refreshToken' in result['tokens']
    assert result['session'].user_id == db_user.uid

    mock_firebase_auth.get_user_by_email.assert_awaited_once_with("test@example.com")
    mock_user_repo.get_by_uid.assert_awaited_once_with(fake_fb_user.uid)
    mock_session_repo.create.assert_awaited_once()