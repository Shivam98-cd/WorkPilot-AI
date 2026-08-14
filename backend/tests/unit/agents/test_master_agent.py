"""
Unit tests for MasterIntegrationAgent
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from agents.base_agent import AgentHealth, SyncResult
from services.master_agent import MasterIntegrationAgent


@pytest.fixture
def master():
    """Create a fresh MasterIntegrationAgent with _initialized=True to skip auto-init"""
    m = MasterIntegrationAgent()
    m._initialized = True
    return m


@pytest.fixture
def mock_agent():
    """Create a mock worker agent"""
    agent = MagicMock()
    agent.sync = AsyncMock(return_value=SyncResult("mock", True, 5, datetime.utcnow(), []))
    agent.health_check = AsyncMock(return_value=AgentHealth("mock", "healthy", True, datetime.utcnow(), 0, 20.0))
    return agent


def test_register_and_get_agent(master, mock_agent):
    master.register_agent("gmail", mock_agent)
    retrieved = master.get_agent("gmail")
    assert retrieved is mock_agent


def test_get_nonexistent_agent_returns_none(master):
    result = master.get_agent("nonexistent_platform")
    assert result is None


@pytest.mark.asyncio
async def test_sync_all_no_integrations(master):
    with patch("services.master_agent.integration_repository") as mock_repo:
        mock_repo.list_for_user = AsyncMock(return_value=[])
        result = await master.sync_all_integrations("user_1")

    assert result["status"] == "no_integrations"
    assert result["results"] == {}


@pytest.mark.asyncio
async def test_sync_all_with_connected_integration(master, mock_agent):
    master.register_agent("gmail", mock_agent)

    mock_integration = MagicMock()
    mock_integration.platform = "gmail"
    mock_integration.status = "connected"

    with patch("services.master_agent.integration_repository") as mock_repo:
        mock_repo.list_for_user = AsyncMock(return_value=[mock_integration])
        result = await master.sync_all_integrations("user_1")

    assert result["status"] == "completed"
    assert result["total_platforms"] == 1
    assert result["success_count"] == 1
    assert result["error_count"] == 0
    mock_agent.sync.assert_awaited_once_with("user_1")


@pytest.mark.asyncio
async def test_sync_all_with_agent_failure(master):
    failing_agent = MagicMock()
    failing_agent.sync = AsyncMock(side_effect=Exception("API error"))
    master.register_agent("github", failing_agent)

    mock_integration = MagicMock()
    mock_integration.platform = "github"
    mock_integration.status = "connected"

    with patch("services.master_agent.integration_repository") as mock_repo:
        mock_repo.list_for_user = AsyncMock(return_value=[mock_integration])
        result = await master.sync_all_integrations("user_1")

    assert result["error_count"] == 1
    assert result["success_count"] == 0
    assert "github" in result["results"]
    assert result["results"]["github"]["success"] is False


@pytest.mark.asyncio
async def test_health_check_all_healthy(master, mock_agent):
    master.register_agent("slack", mock_agent)

    mock_integration = MagicMock()
    mock_integration.platform = "slack"
    mock_integration.status = "connected"

    with patch("services.master_agent.integration_repository") as mock_repo:
        mock_repo.list_for_user = AsyncMock(return_value=[mock_integration])
        result = await master.health_check("user_1")

    assert "slack" in result
    assert result["slack"].status == "healthy"


@pytest.mark.asyncio
async def test_health_check_no_connected_integrations(master):
    with patch("services.master_agent.integration_repository") as mock_repo:
        mock_repo.list_for_user = AsyncMock(return_value=[])
        result = await master.health_check("user_1")

    assert result == {}


@pytest.mark.asyncio
async def test_execute_unsupported_workflow(master):
    from core.exceptions import ValidationException
    with pytest.raises(ValidationException):
        await master.execute_workflow("user_1", "nonexistent_workflow", {})


@pytest.mark.asyncio
async def test_get_unified_inbox_no_connected(master):
    with patch("services.master_agent.integration_repository") as mock_repo:
        mock_repo.list_for_user = AsyncMock(return_value=[])
        result = await master.get_unified_inbox("user_1")

    assert result == []


@pytest.mark.asyncio
async def test_get_unified_calendar_no_connected(master):
    with patch("services.master_agent.integration_repository") as mock_repo:
        mock_repo.list_for_user = AsyncMock(return_value=[])
        result = await master.get_unified_calendar("user_1")

    assert result == []
