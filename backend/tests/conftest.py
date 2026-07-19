"""
Pytest Configuration and Fixtures
"""
import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    """FastAPI test client fixture"""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Authenticated headers fixture"""
    return {
        "Authorization": "Bearer test_token"
    }
