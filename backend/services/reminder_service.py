"""
WorkPilot AI - Unified Alert & Reminder Engine
Manages scheduled meeting reminders, task deadlines, custom reminders,
and automated multi-channel dispatch (In-App, WebSockets, Email, Slack).
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
from uuid import uuid4

from services.websocket_manager import manager as ws_manager
from services.email_reminder_service import (
    email_reminder_service,
    render_meeting_reminder_html,
    render_task_reminder_html,
)
from services.workspace_service import workspace_service

logger = logging.getLogger("reminder_service")


class ReminderService:
    """
    Multi-tenant Reminder & Alert Engine.
    Coordinates calendar event monitoring, task deadlines, and multi-channel dispatch.
    """

    def __init__(self):
        # In-memory store per user: uid -> { reminder_id: {...} }
        self._reminders: Dict[str, Dict[str, Any]] = {}

    def list_reminders(self, uid: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """List reminders for a user, sorted by due_time."""
        user_items = list(self._reminders.get(uid, {}).values())
        if status:
            user_items = [r for r in user_items if r.get("status") == status]
        return sorted(user_items, key=lambda r: r.get("due_time") or "")

    def get_reminder(self, uid: str, reminder_id: str) -> Optional[Dict[str, Any]]:
        return self._reminders.get(uid, {}).get(reminder_id)

    async def create_reminder(self, uid: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a scheduled reminder."""
        reminder_id = str(uuid4())
        due_time = data.get("due_time") or data.get("time") or (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        
        # Determine recipient email: from data or fallback to connected account
        recipient_email = data.get("recipient_email") or ""
        if not recipient_email:
            try:
                from repositories.user_repository import user_repository
                user_record = await user_repository.get_by_uid(uid)
                if user_record and getattr(user_record, "email", None):
                    recipient_email = user_record.email
            except Exception:
                pass

        reminder = {
            "id": reminder_id,
            "uid": uid,
            "title": data.get("title", "WorkPilot Reminder").strip(),
            "type": data.get("type", "custom"),  # "meeting", "task", "custom", "system"
            "priority": data.get("priority", "normal"),  # "urgent", "high", "normal", "low"
            "due_time": due_time,
            "lead_time_minutes": int(data.get("lead_time_minutes", 15 if data.get("type") == "meeting" else 0)),
            "channels": data.get("channels", ["in_app", "email"]),
            "recipient_email": recipient_email,
            "meeting_link": data.get("meeting_link", ""),
            "attendees": data.get("attendees", []),
            "note": data.get("note") or data.get("description") or "",
            "status": "pending",  # "pending", "fired", "completed", "dismissed"
            "created_at": datetime.now(timezone.utc).isoformat(),
            "fired_at": None,
        }

        if uid not in self._reminders:
            self._reminders[uid] = {}
        self._reminders[uid][reminder_id] = reminder

        logger.info(f"Created reminder '{reminder['title']}' for user {uid} due at {due_time}")
        return reminder

    def complete_reminder(self, uid: str, reminder_id: str) -> Optional[Dict[str, Any]]:
        """Mark reminder completed."""
        if uid in self._reminders and reminder_id in self._reminders[uid]:
            self._reminders[uid][reminder_id]["status"] = "completed"
            return self._reminders[uid][reminder_id]
        return None

    def delete_reminder(self, uid: str, reminder_id: str) -> bool:
        """Remove a reminder."""
        if uid in self._reminders and reminder_id in self._reminders[uid]:
            del self._reminders[uid][reminder_id]
            return True
        return False

    async def scan_and_sync_calendar_meetings(self, uid: str) -> int:
        """
        Scan calendar events for the next 24 hours.
        Ensure upcoming meetings have active 15-minute reminders scheduled.
        """
        created_count = 0
        try:
            events = await workspace_service.list_calendar_events(uid)
            now = datetime.now(timezone.utc)
            horizon = now + timedelta(hours=24)

            existing_titles = {r["title"] for r in self.list_reminders(uid) if r.get("status") in ("pending", "fired")}

            for ev in events:
                title = ev.get("title") or "Scheduled Meeting"
                start_raw = ev.get("start") or ev.get("time")
                if not start_raw:
                    continue

                try:
                    # Parse start datetime
                    if "T" in str(start_raw):
                        start_dt = datetime.fromisoformat(str(start_raw).replace("Z", "+00:00"))
                    else:
                        # Fallback for simple time strings like "14:00"
                        h, m = [int(x) for x in str(start_raw).split(":")[:2]]
                        start_dt = now.replace(hour=h, minute=m, second=0, microsecond=0)
                        if start_dt < now:
                            start_dt += timedelta(days=1)
                except Exception:
                    continue

                # If within the next 24 hours and not in the past
                if now <= start_dt <= horizon and title not in existing_titles:
                    meeting_link = ev.get("meeting_link") or ev.get("link") or ""
                    await self.create_reminder(uid, {
                        "title": f"Meeting: {title}",
                        "type": "meeting",
                        "priority": "high",
                        "due_time": start_dt.isoformat(),
                        "lead_time_minutes": 15,
                        "channels": ["in_app", "email"],
                        "meeting_link": meeting_link,
                        "attendees": ev.get("attendees", []),
                        "note": ev.get("description") or f"Upcoming meeting with {len(ev.get('attendees', []))} participants",
                    })
                    created_count += 1
                    existing_titles.add(title)

            if created_count > 0:
                logger.info(f"Auto-synced {created_count} calendar meeting reminders for user {uid}")
        except Exception as e:
            logger.warning(f"Calendar meeting scan failed for user {uid}: {e}")

        return created_count

    async def fire_reminder(self, reminder: Dict[str, Any]) -> bool:
        """
        Execute delivery across enabled channels:
        1. In-App Notification record
        2. WebSocket push notification event
        3. Formatted HTML reminder email
        4. Slack notification if enabled
        """
        uid = reminder["uid"]
        title = reminder["title"]
        lead_min = reminder.get("lead_time_minutes", 0)
        due_time = reminder.get("due_time", "")
        rem_type = reminder.get("type", "custom")
        channels = reminder.get("channels", ["in_app"])

        # 1. In-App Notification
        body_text = reminder.get("note") or f"Reminder: {title} due at {due_time}"
        if rem_type == "meeting" and lead_min > 0:
            body_text = f"Upcoming meeting starting in {lead_min} minutes."
            if reminder.get("meeting_link"):
                body_text += f" Link: {reminder['meeting_link']}"

        await workspace_service.create_notification(
            uid=uid,
            title=f"⏰ {title}",
            body=body_text,
            kind="warning" if reminder.get("priority") in ("urgent", "high") else "info",
        )

        # 2. WebSocket Real-Time Event
        await ws_manager.send_personal_message(uid, {
            "type": "reminder_alert",
            "event": "reminder_alert",
            "data": {
                "id": reminder["id"],
                "title": title,
                "body": body_text,
                "type": rem_type,
                "priority": reminder.get("priority", "normal"),
                "due_time": due_time,
                "meeting_link": reminder.get("meeting_link", ""),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        })

        # 3. Email Delivery
        if "email" in channels and reminder.get("recipient_email"):
            email_addr = reminder["recipient_email"]
            if rem_type == "meeting":
                html = render_meeting_reminder_html(
                    title=title,
                    start_time_str=due_time,
                    lead_time_min=lead_min,
                    meeting_link=reminder.get("meeting_link"),
                    attendees=reminder.get("attendees"),
                    description=reminder.get("note"),
                )
                subject = f"⏰ Starting in {lead_min}m: {title}"
            else:
                html = render_task_reminder_html(
                    title=title,
                    due_str=due_time,
                    priority=reminder.get("priority", "normal"),
                    note=reminder.get("note"),
                )
                subject = f"🔔 Reminder: {title}"

            await email_reminder_service.send_reminder_email(
                uid=uid,
                recipient_email=email_addr,
                subject=subject,
                html_content=html,
                plain_text=body_text,
            )

        # 4. Optional Slack channel alert
        if "slack" in channels:
            try:
                from agents.communication_agent import CommunicationAgent
                slack_agent = CommunicationAgent()
                await slack_agent.send_slack_message(
                    uid=uid,
                    channel_id="general",
                    text=f"⏰ *WorkPilot Reminder*: {title} ({due_time})"
                )
            except Exception as e:
                logger.warning(f"Slack reminder dispatch error: {e}")

        # Mark as fired
        reminder["status"] = "fired"
        reminder["fired_at"] = datetime.now(timezone.utc).isoformat()
        logger.info(f"Fired reminder '{title}' for uid={uid}")
        return True

    async def check_and_dispatch_due_reminders(self) -> int:
        """
        Background tick: Checks all users' pending reminders and fires due items.
        Criteria: now >= due_time - lead_time_minutes.
        """
        now = datetime.now(timezone.utc)
        dispatched = 0

        for uid, user_rems in list(self._reminders.items()):
            for rem_id, rem in list(user_rems.items()):
                if rem.get("status") != "pending":
                    continue

                try:
                    due_str = rem.get("due_time", "")
                    if not due_str:
                        continue
                    due_dt = datetime.fromisoformat(due_str.replace("Z", "+00:00"))
                    lead_delta = timedelta(minutes=int(rem.get("lead_time_minutes", 0)))
                    trigger_time = due_dt - lead_delta

                    # Fire if trigger time has arrived (and within 30 min grace period)
                    if trigger_time <= now <= due_dt + timedelta(minutes=30):
                        await self.fire_reminder(rem)
                        dispatched += 1
                except Exception as err:
                    logger.warning(f"Error checking reminder {rem_id}: {err}")

        return dispatched


reminder_service = ReminderService()
