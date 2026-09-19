from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import json
import re
from datetime import datetime, timedelta, timezone

from core.config import settings
from middleware.auth import get_current_user
from services.integration_service import integration_service
from services.workspace_service import workspace_service

router = APIRouter(prefix='/calendar', tags=['calendar'])

@router.get('/events')
async def get_events(
    time_min: Optional[str] = Query(None),
    time_max: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
):
    uid = current_user['uid']
    provider_events = await integration_service.list_user_events(uid, time_min=time_min, time_max=time_max)
    workspace_events = await workspace_service.list_calendar_events(uid)
    return {'success': True, 'data': [*provider_events, *workspace_events]}

@router.post('/events')
async def add_event(body: dict, current_user=Depends(get_current_user)):
    uid = current_user['uid']
    event = await integration_service.create_user_event(uid, body)
    if event is None:
        event = await workspace_service.create_calendar_event(uid, body)
    return {'success': True, 'data': event}

@router.delete('/events/{event_id}')
async def delete_event(event_id: str, current_user=Depends(get_current_user)):
    uid = current_user['uid']
    deleted = await integration_service.delete_user_event(uid, event_id)
    return {'success': True, 'deleted': deleted}

@router.post('/ai-schedule')
async def ai_schedule(body: dict, current_user=Depends(get_current_user)):
    uid = current_user['uid']
    prompt = (body.get('prompt') or '').strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Scheduling prompt is required")

    now = datetime.now(timezone.utc)
    today_str = now.strftime('%Y-%m-%d (%A)')
    parsed = None

    if settings.GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY)
            system_msg = (
                f"Today is {today_str}. Current UTC time is {now.strftime('%H:%M')}.\n"
                "Extract meeting details from user prompt and return ONLY a valid JSON object without markdown formatting:\n"
                "{\n"
                '  "title": "Meeting Title",\n'
                '  "date": "YYYY-MM-DD",\n'
                '  "time": "HH:MM",\n'
                '  "duration": 30,\n'
                '  "attendees": ["email@example.com"],\n'
                '  "description": "...",\n'
                '  "create_meet": true\n'
                "}\n"
                "Ensure date is properly calculated based on today (e.g. tomorrow, next Monday, etc.). Return only JSON."
            )
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=300,
            )
            raw = completion.choices[0].message.content.strip()
            raw = re.sub(r"^```json\s*", "", raw)
            raw = re.sub(r"^```\s*", "", raw)
            raw = re.sub(r"```$", "", raw).strip()
            parsed = json.loads(raw)
        except Exception:
            parsed = None

    if not parsed or not isinstance(parsed, dict):
        # Fallback simple parser
        target_date = (now + timedelta(days=1)).strftime('%Y-%m-%d')
        if "today" in prompt.lower():
            target_date = now.strftime('%Y-%m-%d')
        elif "friday" in prompt.lower():
            days_ahead = (4 - now.weekday() + 7) % 7 or 7
            target_date = (now + timedelta(days=days_ahead)).strftime('%Y-%m-%d')

        duration = 30
        if "45" in prompt:
            duration = 45
        elif "1h" in prompt or "hour" in prompt or "60" in prompt:
            duration = 60

        parsed = {
            "title": prompt[:50].capitalize(),
            "date": target_date,
            "time": "14:00",
            "duration": duration,
            "attendees": [],
            "description": f"AI Scheduled via WorkPilot: {prompt}",
            "create_meet": True,
        }

    event = await integration_service.create_user_event(uid, parsed)
    if event is None:
        event = await workspace_service.create_calendar_event(uid, parsed)

    return {'success': True, 'data': event, 'parsed': parsed}
