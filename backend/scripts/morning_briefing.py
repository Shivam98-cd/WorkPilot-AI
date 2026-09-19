#!/usr/bin/env python3
"""
scripts/morning_briefing.py — Standalone Runner for Morning Briefings

Designed for:
- Render Cron Jobs: `python scripts/morning_briefing.py`
- Linux Crontab: `0 8 * * * cd /path/to/backend && python scripts/morning_briefing.py`
- Manual testing / CI execution

Executes the WorkPilot AI daily morning briefing synthesis using Gemini 3.6 Flash
and dispatches summaries to connected user accounts.
"""
import sys
import os
import asyncio
import logging
import time
from pathlib import Path

# Ensure backend root is in sys.path
BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Load .env if present
try:
    from dotenv import load_dotenv
    env_path = BACKEND_ROOT / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [MORNING_BRIEFING_CRON] %(message)s"
)
logger = logging.getLogger("scripts.morning_briefing")


async def main():
    start_time = time.time()
    logger.info("=== Starting WorkPilot AI Morning Briefing Cron Job ===")
    
    try:
        from services.automation_runner import run_daily_morning_briefings
        await run_daily_morning_briefings()
        elapsed = time.time() - start_time
        logger.info(f"=== Morning Briefing Cron completed successfully in {elapsed:.2f}s ===")
        sys.exit(0)
    except Exception as exc:
        elapsed = time.time() - start_time
        logger.error(f"=== Morning Briefing Cron failed after {elapsed:.2f}s: {exc} ===", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
