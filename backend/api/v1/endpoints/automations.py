"""
api/v1/endpoints/automations.py — Background Automations & Cron Runner API
"""
from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from services.automation_runner import get_scheduler_status, run_daily_morning_briefings

router = APIRouter(prefix="/automations", tags=["automations"])


@router.get("/status")
async def get_cron_status(current_user=Depends(get_current_user)):
    """Return status of background cron runner and scheduled jobs."""
    status = get_scheduler_status()
    return {"success": True, "data": status}


@router.post("/trigger-morning-briefing")
async def trigger_morning_briefing_now(current_user=Depends(get_current_user)):
    """Manually trigger the 8:00 AM Daily Morning Briefing job right now for testing."""
    await run_daily_morning_briefings()
    return {
        "success": True,
        "message": "Daily Morning Briefing cron job executed manually! Check server logs."
    }
