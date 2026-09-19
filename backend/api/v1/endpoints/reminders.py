"""
WorkPilot AI - Reminder API Endpoints
Provides routes for creating, listing, syncing, completing, and testing reminders.
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional

from middleware.auth import get_current_user
from services.reminder_service import reminder_service

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("")
async def list_reminders(
    status: Optional[str] = Query(None, description="Filter by status: pending, fired, completed"),
    current_user=Depends(get_current_user)
):
    """List all reminders for the authenticated user."""
    uid = current_user["uid"]
    reminders = reminder_service.list_reminders(uid, status=status)
    return {
        "success": True,
        "data": reminders,
        "count": len(reminders),
    }


@router.post("")
async def create_reminder(
    body: dict,
    current_user=Depends(get_current_user)
):
    """Create a new scheduled reminder with optional email dispatch."""
    uid = current_user["uid"]
    reminder = await reminder_service.create_reminder(uid, body)
    return {
        "success": True,
        "message": "Reminder created successfully",
        "data": reminder,
    }


@router.put("/{reminder_id}/complete")
async def complete_reminder(
    reminder_id: str,
    current_user=Depends(get_current_user)
):
    """Mark a reminder as completed."""
    uid = current_user["uid"]
    updated = reminder_service.complete_reminder(uid, reminder_id)
    if not updated:
        return {"success": False, "message": "Reminder not found"}
    return {
        "success": True,
        "data": updated,
    }


@router.delete("/{reminder_id}")
async def delete_reminder(
    reminder_id: str,
    current_user=Depends(get_current_user)
):
    """Delete a reminder."""
    uid = current_user["uid"]
    deleted = reminder_service.delete_reminder(uid, reminder_id)
    return {
        "success": deleted,
        "message": "Reminder deleted" if deleted else "Reminder not found",
    }


@router.post("/test")
async def trigger_test_reminder(
    body: Optional[dict] = None,
    current_user=Depends(get_current_user)
):
    """
    Instantly trigger a test reminder to verify in-app, WebSocket,
    and email delivery mechanisms.
    """
    uid = current_user["uid"]
    body = body or {}
    title = body.get("title") or "WorkPilot AI Test Reminder & Alert"
    email_addr = body.get("recipient_email") or current_user.get("email") or "user@workpilot.ai"

    test_rem = await reminder_service.create_reminder(uid, {
        "title": title,
        "type": body.get("type", "custom"),
        "priority": body.get("priority", "high"),
        "lead_time_minutes": 0,
        "channels": body.get("channels", ["in_app", "email"]),
        "recipient_email": email_addr,
        "note": body.get("note") or "This is a real-time test reminder confirming your notification engine and email delivery are operational.",
        "meeting_link": body.get("meeting_link") or "https://meet.google.com/abc-defg-hij",
    })

    # Fire immediately
    await reminder_service.fire_reminder(test_rem)

    return {
        "success": True,
        "message": f"Test alert dispatched via In-App Notification, WebSocket, and Email to {email_addr}!",
        "data": test_rem,
    }


@router.post("/sync-calendar")
async def sync_calendar_reminders(
    current_user=Depends(get_current_user)
):
    """Scan user calendar events and schedule reminders for upcoming meetings."""
    uid = current_user["uid"]
    synced = await reminder_service.scan_and_sync_calendar_meetings(uid)
    return {
        "success": True,
        "message": f"Calendar scanned. Created {synced} upcoming meeting reminders.",
        "synced_count": synced,
    }
