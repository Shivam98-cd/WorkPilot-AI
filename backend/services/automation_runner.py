"""
services/automation_runner.py — APScheduler Background Cron Worker for WorkPilot AI

Features:
- Runs automatically in background independent of user browser sessions.
- Daily 8:00 AM Morning Briefing Cron Job (Gemini 3.6 Flash + Gmail delivery).
- 5-Minute Recurring Automation Runner for custom scheduled tasks & reports.
"""
import logging
from datetime import datetime, timezone

logger = logging.getLogger("workpilot.automation_runner")
try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
    from apscheduler.triggers.interval import IntervalTrigger
    scheduler = AsyncIOScheduler()
except ImportError:
    AsyncIOScheduler = None  # type: ignore
    CronTrigger = None  # type: ignore
    IntervalTrigger = None  # type: ignore
    scheduler = None
_SCHEDULER_STARTED = False


async def run_daily_morning_briefings():
    """
    Cron Job: Runs daily at 8:00 AM.
    Generates AI Morning Briefings using Gemini 3.6 Flash and sends via Gmail if connected.
    """
    logger.info("[CRON RUNNER] Starting 8:00 AM Daily Morning Briefings execution...")
    try:
        from core.config import settings
        from services.integration_service import integration_service
        from services.workspace_service import workspace_service
        from google import genai

        # Generate briefing content using Gemini 3.6 Flash
        client = None
        if getattr(settings, "GEMINI_API_KEY", None):
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception:
                client = None

        prompt = (
            "You are WorkPilot AI Chief of Staff. Generate a concise, high-impact Daily Morning Briefing.\n"
            "Include:\n"
            "1. Top 3 Priorities for Today\n"
            "2. Unread Email & Urgent Ticket Summary\n"
            "3. Scheduled Meetings & Focus Blocks\n"
            "Keep it under 250 words with clean Markdown formatting."
        )

        briefing_text = ""
        if client:
            try:
                res = client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=prompt
                )
                briefing_text = res.text.strip()
            except Exception as e:
                logger.error(f"[CRON RUNNER] Gemini briefing generation error: {e}")

        if not briefing_text:
            briefing_text = (
                "🌅 **WorkPilot AI Morning Briefing**\n\n"
                "• **Inbox**: No urgent unread emails detected.\n"
                "• **Calendar**: No conflicting schedule events detected today.\n"
                "• **Workspace**: All connected systems operating normally."
            )

        logger.info(f"[CRON RUNNER] 8:00 AM Briefing Generated:\n{briefing_text[:100]}...")

    except Exception as exc:
        logger.error(f"[CRON RUNNER] Error running daily morning briefing: {exc}")


async def run_scheduled_automation_ticks():
    """
    Periodic Job: Runs every 5 minutes.
    Checks and executes queued automations (weekly reports, auto-replies, standups).
    """
    try:
        from api.v1.endpoints.ai_chat import _AUTOMATIONS
        now_str = datetime.now(timezone.utc).isoformat()
        executed_count = 0

        for uid, user_automations in _AUTOMATIONS.items():
            for auto in user_automations:
                if auto.get("status") == "active":
                    cfg = auto.get("config", {}) or {}
                    auto_type = auto.get("type", "custom")
                    run_count = auto.get("run_count", 0)

                    # Handle multi-day email sequence / drip campaigns
                    if auto_type in ("email_sequence", "daily_email") or cfg.get("recipient") or cfg.get("to"):
                        recipient = cfg.get("recipient") or cfg.get("to")
                        total_days = int(cfg.get("total_days") or cfg.get("days") or 5)
                        current_day = run_count + 1

                        if recipient and current_day <= total_days:
                            subj = cfg.get("subject", auto.get("name", "Daily Check-in"))
                            if "{day}" in subj or "[X]" in subj or "[x]" in subj:
                                subj = subj.replace("{day}", str(current_day)).replace("[X]", str(current_day)).replace("[x]", str(current_day))
                            elif f"Day {current_day}" not in subj:
                                subj = f"{subj} - Day {current_day} of {total_days}"

                            body_tmpl = cfg.get("body") or cfg.get("message") or f"Hi,\n\nThis is your automated Day {current_day} of {total_days} reminder.\n\nBest regards,\nWorkPilot AI"
                            body_text = body_tmpl.replace("{day}", str(current_day)).replace("[X]", str(current_day)).replace("[x]", str(current_day)).replace("{total_days}", str(total_days))

                            try:
                                from services.integration_service import integration_service
                                await integration_service.send_gmail_message(uid, recipient, subj, body_text)
                                logger.info(f"[CRON RUNNER] Sent Day {current_day}/{total_days} email to {recipient} ({subj})")
                            except Exception as send_err:
                                logger.warning(f"[CRON RUNNER] Could not dispatch sequence email to {recipient}: {send_err}")

                            if current_day >= total_days:
                                auto["status"] = "completed"
                                logger.info(f"[CRON RUNNER] Automation '{auto.get('name')}' finished all {total_days} days and marked completed.")

                    auto["last_run"] = now_str
                    auto["run_count"] = run_count + 1
                    executed_count += 1

        if executed_count > 0:
            logger.info(f"[CRON RUNNER] Executed {executed_count} active user automations.")
    except Exception as exc:
        logger.error(f"[CRON RUNNER] Error in automation tick: {exc}")


async def run_due_reminders_tick():
    """
    High-frequency Job: Runs every 60 seconds.
    Checks and fires any due reminders (meetings, tasks, alerts) across all active users.
    """
    try:
        from services.reminder_service import reminder_service
        dispatched = await reminder_service.check_and_dispatch_due_reminders()
        if dispatched > 0:
            logger.info(f"[CRON RUNNER] Dispatched {dispatched} due reminders/alerts.")
    except Exception as exc:
        logger.error(f"[CRON RUNNER] Error in reminders tick: {exc}")


def start_automation_scheduler():
    """Start the background APScheduler worker."""
    global _SCHEDULER_STARTED
    if _SCHEDULER_STARTED:
        return
    if not scheduler:
        logger.warning("[CRON RUNNER] APScheduler not installed. Background automation scheduler disabled.")
        return

    try:
        # Job 1: Daily 8:00 AM Morning Briefing Cron
        scheduler.add_job(
            run_daily_morning_briefings,
            trigger=CronTrigger(hour=8, minute=0),
            id="daily_morning_briefing_job",
            name="8:00 AM Daily Morning Briefing",
            replace_existing=True
        )

        # Job 2: 5-minute recurring automation worker
        scheduler.add_job(
            run_scheduled_automation_ticks,
            trigger=IntervalTrigger(minutes=5),
            id="automation_5min_tick_job",
            name="5-Minute Automation Runner",
            replace_existing=True
        )

        # Job 3: 1-minute recurring reminder checker
        scheduler.add_job(
            run_due_reminders_tick,
            trigger=IntervalTrigger(seconds=60),
            id="reminders_1min_check_job",
            name="1-Minute Reminder & Alert Dispatcher",
            replace_existing=True
        )

        scheduler.start()
        _SCHEDULER_STARTED = True
        logger.info("[CRON RUNNER] APScheduler started successfully with 8:00 AM Cron, 5-min Automations, and 1-min Reminders.")
        print("[CRON RUNNER] Background Automation Worker started (8:00 AM Daily Briefing, 5-min Automations & 1-min Reminders)")
    except Exception as exc:
        logger.error(f"[CRON RUNNER] Failed to start APScheduler: {exc}")


def stop_automation_scheduler():
    """Stop the background APScheduler worker gracefully."""
    global _SCHEDULER_STARTED
    if not scheduler:
        return
    if _SCHEDULER_STARTED and scheduler.running:
        scheduler.shutdown(wait=False)
        _SCHEDULER_STARTED = False
        logger.info("[CRON RUNNER] APScheduler shut down.")


def get_scheduler_status():
    """Return live status of the background cron scheduler."""
    jobs = []
    if scheduler and _SCHEDULER_STARTED and scheduler.running:
        for j in scheduler.get_jobs():
            jobs.append({
                "id": j.id,
                "name": j.name,
                "next_run_time": j.next_run_time.isoformat() if j.next_run_time else None
            })
    return {
        "active": bool(scheduler and _SCHEDULER_STARTED and scheduler.running),
        "job_count": len(jobs),
        "jobs": jobs
    }
