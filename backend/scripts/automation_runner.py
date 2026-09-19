#!/usr/bin/env python3
"""
scripts/automation_runner.py — Standalone Runner for Periodic Automations

Designed for:
- Render Cron Jobs: Run every 5, 10, or 15 minutes
- Linux Crontab: `*/5 * * * * cd /path/to/backend && python scripts/automation_runner.py`
- Manual execution / testing

Executes active user automations (standups, auto-replies, scheduled digest tasks).
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
    format="%(asctime)s [%(levelname)s] [AUTOMATION_TICK_CRON] %(message)s"
)
logger = logging.getLogger("scripts.automation_runner")


async def main():
    start_time = time.time()
    logger.info("=== Starting WorkPilot AI Automation Runner Tick ===")
    
    try:
        from services.automation_runner import run_scheduled_automation_ticks
        await run_scheduled_automation_ticks()
        elapsed = time.time() - start_time
        logger.info(f"=== Automation Runner Tick completed successfully in {elapsed:.2f}s ===")
        sys.exit(0)
    except Exception as exc:
        elapsed = time.time() - start_time
        logger.error(f"=== Automation Runner Tick failed after {elapsed:.2f}s: {exc} ===", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
