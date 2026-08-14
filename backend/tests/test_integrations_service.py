import time
from datetime import datetime, timezone

import pytest
from unittest.mock import AsyncMock, patch

from core.crypto import encrypt_value
from core.exceptions import ExternalServiceException, ValidationException
import services.integration_service as integration_service_module
from services.integration_service import integration_service
from models.integration import UserIntegration


@pytest.mark.asyncio
@patch("services.integration_service.integration_repository")
async def test_list_for_user_wraps_repository_errors(mock_repository):
    """Repository failures should surface as application-safe integration errors."""
    mock_repository.list_for_user = AsyncMock(side_effect=RuntimeError("firestore unavailable"))

    with pytest.raises(ExternalServiceException, match="Unable to load integrations"):
        await integration_service.list_for_user("user-123")


@pytest.mark.asyncio
async def test_handle_oauth_callback_wraps_persistence_errors():
    """OAuth callback persistence failures should be surfaced as integration errors."""
    state = "state-123"
    integration_service_module._oauth_states[state] = {
        "uid": "user-123",
        "platform": "gmail",
        "createdAt": time.time(),
    }

    with patch.object(integration_service, "_exchange_google_code", AsyncMock(return_value=({"access_token": "abc"}, {"email": "user@example.com"}))), patch.object(integration_service_module.integration_repository, "upsert", AsyncMock(side_effect=RuntimeError("db down"))):
        with pytest.raises(ExternalServiceException, match="Unable to save integration"):
            await integration_service.handle_oauth_callback("gmail", "code-123", state)

    integration_service_module._oauth_states.pop(state, None)


def test_build_authorize_url_requires_google_client_id():
    """Missing Google OAuth configuration should fail fast with a clear validation error."""
    with patch.object(integration_service_module.settings, "GOOGLE_CLIENT_ID", None):
        with pytest.raises(ValidationException, match="Google OAuth is not configured"):
            integration_service.build_authorize_url("user-123", "gmail")


def test_build_authorize_url_supports_microsoft_teams():
    """Microsoft Teams should get a proper Microsoft OAuth authorize URL."""
    with patch.object(integration_service_module.settings, "MICROSOFT_CLIENT_ID", "ms-client"), patch.object(
        integration_service_module.settings, "MICROSOFT_TENANT_ID", "tenant-123"
    ):
        url = integration_service.build_authorize_url("user-123", "microsoft_teams")

    assert "https://login.microsoftonline.com/tenant-123/oauth2/v2.0/authorize" in url
    assert "client_id=ms-client" in url
    assert "response_type=code" in url


def test_build_authorize_url_supports_slack():
    """Slack should get a proper OAuth authorize URL."""
    with patch.object(integration_service_module.settings, "SLACK_CLIENT_ID", "slack-client"):
        url = integration_service.build_authorize_url("user-123", "slack")

    assert "https://slack.com/oauth/v2/authorize" in url
    assert "client_id=slack-client" in url
    assert "scope=channels%3Aread%2Cchat%3Awrite%2Cusers%3Aread" in url


def test_build_authorize_url_supports_zoom():
    """Zoom should get a proper OAuth authorize URL."""
    with patch.object(integration_service_module.settings, "ZOOM_CLIENT_ID", "zoom-client"):
        url = integration_service.build_authorize_url("user-123", "zoom")

    assert "https://zoom.us/oauth/authorize" in url
    assert "client_id=zoom-client" in url


def test_build_authorize_url_supports_notion():
    """Notion should get a proper OAuth authorize URL."""
    with patch.object(integration_service_module.settings, "NOTION_CLIENT_ID", "notion-client"):
        url = integration_service.build_authorize_url("user-123", "notion")

    assert "https://api.notion.com/v1/oauth/authorize" in url
    assert "client_id=notion-client" in url


def test_build_authorize_url_supports_jira():
    """Jira should get a proper OAuth authorize URL."""
    with patch.object(integration_service_module.settings, "JIRA_CLIENT_ID", "jira-client"):
        url = integration_service.build_authorize_url("user-123", "jira")

    assert "https://auth.atlassian.com/authorize" in url
    assert "client_id=jira-client" in url


@pytest.mark.asyncio
async def test_list_for_user_exposes_health_status():
    """Connected integrations should report a basic health score and state."""
    record = UserIntegration(
        uid="user-123",
        platform="github",
        status="connected",
        last_sync_status="success",
    )

    with patch.object(integration_service_module.integration_repository, "list_for_user", AsyncMock(return_value=[record])):
        result = await integration_service.list_for_user("user-123")

    item = next(item for item in result if item["platform"] == "github")
    assert item["healthScore"] == 100
    assert item["healthStatus"] == "healthy"


@pytest.mark.asyncio
async def test_handle_oauth_callback_rejects_invalid_state():
    """Unknown or expired OAuth states should be rejected before any provider exchange occurs."""
    with pytest.raises(ValidationException, match="Invalid or expired OAuth state"):
        await integration_service.handle_oauth_callback("gmail", "code-123", "missing-state")


@pytest.mark.asyncio
async def test_list_user_emails_uses_gmail_messages_when_connected():
    """A connected Gmail integration should return provider-backed email data."""
    record = UserIntegration(
        uid="user-123",
        platform="gmail",
        status="connected",
        access_token_enc=encrypt_value("token-123"),
    )

    with patch.object(integration_service_module.integration_repository, "get", AsyncMock(return_value=record)), patch.object(
        integration_service,
        "_fetch_gmail_messages",
        AsyncMock(return_value=[{
            "id": "msg-1",
            "snippet": "Quarterly update pending",
            "payload": {
                "headers": [
                    {"name": "Subject", "value": "Quarterly update"},
                    {"name": "From", "value": "Jane Doe <jane@example.com>"},
                ]
            },
        }]),
    ):
        emails = await integration_service.list_user_emails("user-123")

    assert emails[0]["subject"] == "Quarterly update"
    assert emails[0]["from"] == "Jane Doe"


@pytest.mark.asyncio
async def test_list_user_events_uses_google_calendar_items_when_connected():
    """A connected Google Calendar integration should return provider-backed events."""
    record = UserIntegration(
        uid="user-123",
        platform="google_calendar",
        status="connected",
        access_token_enc=encrypt_value("token-123"),
    )

    with patch.object(integration_service_module.integration_repository, "get", AsyncMock(return_value=record)), patch.object(
        integration_service,
        "_fetch_google_calendar_events",
        AsyncMock(return_value=[{"id": "evt-1", "summary": "Sprint review", "start": {"dateTime": "2026-07-28T10:00:00Z"}, "end": {"dateTime": "2026-07-28T11:00:00Z"}}]),
    ):
        events = await integration_service.list_user_events("user-123")

    assert events[0]["title"] == "Sprint review"
    assert events[0]["time"] == "2026-07-28T10:00:00Z"


@pytest.mark.asyncio
async def test_list_user_deployments_uses_github_projects_when_connected():
    """A connected GitHub integration should return provider-backed deployment data."""
    record = UserIntegration(
        uid="user-123",
        platform="github",
        status="connected",
        access_token_enc=encrypt_value("token-123"),
    )

    with patch.object(integration_service_module.integration_repository, "get", AsyncMock(return_value=record)), patch.object(
        integration_service,
        "_fetch_github_projects",
        AsyncMock(return_value=[{"id": 1, "name": "workpilot-ai", "private": False, "updated_at": "2026-07-28T00:00:00Z", "description": "AI workspace"}]),
    ):
        deployments = await integration_service.list_user_deployments("user-123")

    assert deployments[0]["name"] == "workpilot-ai"
    assert deployments[0]["status"] == "success"


@pytest.mark.asyncio
async def test_list_for_user_exposes_sync_status_metadata():
    """Connected integrations should expose sync status and error information to the UI."""
    record = UserIntegration(
        uid="user-123",
        platform="gmail",
        status="connected",
        last_sync_at=datetime(2026, 7, 28, 10, 0, tzinfo=timezone.utc),
        last_sync_status="success",
        last_sync_error="Last sync finished with warnings",
    )

    with patch.object(integration_service_module.integration_repository, "list_for_user", AsyncMock(return_value=[record])):
        result = await integration_service.list_for_user("user-123")

    item = next(item for item in result if item["platform"] == "gmail")
    assert item["lastSyncStatus"] == "success"
    assert item["lastSyncError"] == "Last sync finished with warnings"
    assert item["lastSyncLabel"] is not None


@pytest.mark.asyncio
async def test_sync_integration_updates_last_sync_state():
    """A manual sync should mark the integration as successfully synced and update the timestamp."""
    record = UserIntegration(uid="user-123", platform="gmail", status="connected")

    with patch.object(integration_service_module.integration_repository, "get", AsyncMock(return_value=record)), patch.object(
        integration_service_module.integration_repository,
        "upsert",
        AsyncMock(side_effect=lambda integration: integration),
    ):
        result = await integration_service.sync_integration("user-123", "gmail")

    assert result["status"] == "success"
    assert record.last_sync_status == "success"
    assert record.last_sync_at is not None
