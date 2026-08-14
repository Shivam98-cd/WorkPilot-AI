"""
Unit tests for BaseIntegrationAgent
"""
import asyncio
import pytest
from agents.base_agent import AgentHealth, BaseIntegrationAgent, SyncResult, retry_with_backoff
from datetime import datetime, timedelta


class ConcreteAgent(BaseIntegrationAgent):
    """Concrete implementation for testing abstract base class"""
    def __init__(self):
        super().__init__(platform="test")
        self.connect_called = False
        self.sync_called = False

    async def connect(self, uid, tokens): self.connect_called = True; return True
    async def sync(self, uid): self.sync_called = True; return SyncResult("test", True, 5, datetime.utcnow(), [])
    async def disconnect(self, uid): return True
    async def health_check(self, uid): return AgentHealth("test", "healthy", True, datetime.utcnow(), 0, 12.5)
    async def refresh_token(self, uid): return True


def test_base_agent_init():
    agent = ConcreteAgent()
    assert agent.platform == "test"
    assert agent._error_count == 0


def test_error_count_management():
    agent = ConcreteAgent()
    agent._increment_error_count()
    agent._increment_error_count()
    assert agent._get_error_count() == 2
    agent._reset_error_count()
    assert agent._get_error_count() == 0


@pytest.mark.asyncio
async def test_connect_called():
    agent = ConcreteAgent()
    result = await agent.connect("user_1", {"access_token": "token"})
    assert result is True
    assert agent.connect_called is True


@pytest.mark.asyncio
async def test_sync_called():
    agent = ConcreteAgent()
    result = await agent.sync("user_1")
    assert isinstance(result, SyncResult)
    assert result.success is True
    assert result.items_synced == 5
    assert agent.sync_called is True


@pytest.mark.asyncio
async def test_token_expiry_check_no_expiry():
    agent = ConcreteAgent()
    needs_refresh = await agent._check_token_expiry(None)
    assert needs_refresh is False


@pytest.mark.asyncio
async def test_token_expiry_check_expired():
    agent = ConcreteAgent()
    # Expired token (past time)
    expired = datetime.utcnow() - timedelta(minutes=10)
    needs_refresh = await agent._check_token_expiry(expired)
    assert needs_refresh is True


@pytest.mark.asyncio
async def test_token_expiry_check_expiring_soon():
    agent = ConcreteAgent()
    # Expires in 2 minutes (threshold is 5)
    expiring_soon = datetime.utcnow() + timedelta(minutes=2)
    needs_refresh = await agent._check_token_expiry(expiring_soon, refresh_threshold_minutes=5)
    assert needs_refresh is True


@pytest.mark.asyncio
async def test_token_expiry_check_valid():
    agent = ConcreteAgent()
    # Expires in 30 minutes
    valid = datetime.utcnow() + timedelta(minutes=30)
    needs_refresh = await agent._check_token_expiry(valid)
    assert needs_refresh is False


@pytest.mark.asyncio
async def test_retry_decorator_success_on_first_attempt():
    call_count = 0

    @retry_with_backoff(max_attempts=3, backoff_seconds=0)
    async def operation():
        nonlocal call_count
        call_count += 1
        return "success"

    result = await operation()
    assert result == "success"
    assert call_count == 1


@pytest.mark.asyncio
async def test_retry_decorator_success_on_retry():
    call_count = 0

    @retry_with_backoff(max_attempts=3, backoff_seconds=0)
    async def operation():
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise ValueError("Transient error")
        return "success"

    result = await operation()
    assert result == "success"
    assert call_count == 3


@pytest.mark.asyncio
async def test_retry_decorator_all_attempts_fail():
    call_count = 0

    @retry_with_backoff(max_attempts=3, backoff_seconds=0)
    async def operation():
        nonlocal call_count
        call_count += 1
        raise ValueError("Persistent error")

    with pytest.raises(ValueError, match="Persistent error"):
        await operation()

    assert call_count == 3


def test_sync_result_model():
    result = SyncResult(
        platform="gmail",
        success=True,
        items_synced=10,
        last_sync=datetime.utcnow(),
        errors=[],
    )
    assert result.platform == "gmail"
    assert result.success is True
    assert result.items_synced == 10


def test_agent_health_model():
    health = AgentHealth(
        platform="github",
        status="healthy",
        token_valid=True,
        last_sync=datetime.utcnow(),
        error_count=0,
        response_time_ms=45.5,
    )
    assert health.platform == "github"
    assert health.status == "healthy"
    assert health.token_valid is True
