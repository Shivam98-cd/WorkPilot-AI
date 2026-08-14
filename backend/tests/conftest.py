"""
Pytest Configuration and Fixtures
"""
import pytest
import sys
import os
from fastapi.testclient import TestClient

# Ensure the project root is in the Python path so imports work correctly
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Import the FastAPI app after adjusting sys.path
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
