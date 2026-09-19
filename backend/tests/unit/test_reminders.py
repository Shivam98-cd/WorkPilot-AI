"""
Unit tests for WorkPilot AI Reminder and Notification Services
"""
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch

from services.reminder_service import ReminderService
from services.email_reminder_service import (
    EmailReminderService,
    render_meeting_reminder_html,
    render_task_reminder_html,
)


class TestReminderService:
    def setup_method(self):
        self.service = ReminderService()
        self.uid = "user_test_reminders"

    @pytest.mark.asyncio
    async def test_create_and_list_reminders(self):
        rem = await self.service.create_reminder(self.uid, {
            "title": "Quarterly Planning Sync",
            "type": "meeting",
            "priority": "high",
            "lead_time_minutes": 15,
            "channels": ["in_app", "email"],
            "recipient_email": "leader@workpilot.ai",
        })

        assert rem["id"] is not None
        assert rem["title"] == "Quarterly Planning Sync"
        assert rem["status"] == "pending"

        all_rems = self.service.list_reminders(self.uid)
        assert len(all_rems) == 1
        assert all_rems[0]["id"] == rem["id"]

    @pytest.mark.asyncio
    async def test_complete_and_delete_reminder(self):
        rem = await self.service.create_reminder(self.uid, {
            "title": "Review PR #42",
            "type": "task",
        })
        rem_id = rem["id"]

        updated = self.service.complete_reminder(self.uid, rem_id)
        assert updated["status"] == "completed"

        deleted = self.service.delete_reminder(self.uid, rem_id)
        assert deleted is True
        assert len(self.service.list_reminders(self.uid)) == 0

    @pytest.mark.asyncio
    async def test_calendar_meeting_auto_sync(self):
        # Mock workspace_service.list_calendar_events to return an event 2 hours from now
        future_time = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
        mock_events = [
            {
                "id": "ev_123",
                "title": "Architecture Deep Dive",
                "start": future_time,
                "meeting_link": "https://meet.google.com/xyz-abcd-efg",
                "attendees": ["alice@company.com", "bob@company.com"],
            }
        ]

        with patch("services.reminder_service.workspace_service.list_calendar_events", new=AsyncMock(return_value=mock_events)):
            synced_count = await self.service.scan_and_sync_calendar_meetings(self.uid)
            assert synced_count == 1

            rems = self.service.list_reminders(self.uid)
            assert len(rems) == 1
            assert "Architecture Deep Dive" in rems[0]["title"]
            assert rems[0]["lead_time_minutes"] == 15
            assert rems[0]["meeting_link"] == "https://meet.google.com/xyz-abcd-efg"

    @pytest.mark.asyncio
    async def test_fire_reminder_dispatches_channels(self):
        rem = await self.service.create_reminder(self.uid, {
            "title": "Client Status Briefing",
            "type": "meeting",
            "priority": "urgent",
            "channels": ["in_app", "email"],
            "recipient_email": "exec@company.com",
            "meeting_link": "https://zoom.us/j/123456789",
        })

        with patch("services.reminder_service.workspace_service.create_notification", new=AsyncMock()) as mock_notif, \
             patch("services.reminder_service.ws_manager.send_personal_message", new=AsyncMock()) as mock_ws, \
             patch("services.reminder_service.email_reminder_service.send_reminder_email", new=AsyncMock(return_value={"success": True})) as mock_email:

            fired = await self.service.fire_reminder(rem)
            assert fired is True
            assert rem["status"] == "fired"
            assert rem["fired_at"] is not None

            mock_notif.assert_called_once()
            mock_ws.assert_called_once()
            mock_email.assert_called_once()


class TestEmailReminderTemplates:
    def test_render_meeting_reminder_html(self):
        html = render_meeting_reminder_html(
            title="Team All Hands",
            start_time_str="2026-09-14T16:00:00Z",
            lead_time_min=15,
            meeting_link="https://teams.microsoft.com/l/meetup-join/123",
            attendees=["dev@workpilot.ai"],
            description="Discussing Q4 OKRs",
        )
        assert "Team All Hands" in html
        assert "15 mins" in html
        assert "https://teams.microsoft.com/l/meetup-join/123" in html
        assert "dev@workpilot.ai" in html

    def test_render_task_reminder_html(self):
        html = render_task_reminder_html(
            title="Submit Security Audit Report",
            due_str="5:00 PM",
            priority="Urgent",
            note="Must include SOC2 compliance checklist.",
        )
        assert "Submit Security Audit Report" in html
        assert "Urgent" in html
        assert "SOC2 compliance checklist" in html
