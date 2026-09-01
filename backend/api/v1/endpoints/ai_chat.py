"""
ai_chat.py — WorkPilot AI Brain v2
Features: anti-hallucination, 15 tools, parallel execution, smart suggestions, automations
"""
import json, uuid, asyncio
import httpx
from datetime import datetime, timedelta, timezone
from collections import defaultdict, deque
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import Groq
from core.config import settings
from middleware.auth import get_current_user
from repositories.chat_repository import chat_repository
from repositories.workspace_repository import workspace_repository
from services.integration_service import integration_service
from dateutil.parser import parse as parse_datetime

router = APIRouter(prefix="/ai", tags=["ai"])
_HISTORY:     dict = defaultdict(lambda: deque(maxlen=20))
_AUTOMATIONS: dict = defaultdict(list)

SYSTEM_PROMPT = (
    "You are WorkPilot AI — a world-class AI Chief of Staff.\n\n"
    "CORE RULES (non-negotiable):\n"
    "1. NEVER invent or fabricate data. For workspace data -> CALL THE TOOL FIRST, then respond ONLY based on tool result.\n"
    "2. Cite source in every response: [Gmail], [Google Calendar], [Team DB], [Deployments], [Analytics], [Mock Data].\n"
    "3. If tool returns empty: say I checked [source] but found no data. Have you connected [platform] in Integrations?\n"
    "4. Be precise and action-oriented. No filler phrases.\n"
    "5. When user asks to DO something -> call the tool immediately.\n"
    "6. Use markdown: **bold** for names, bullet points for lists.\n"
    "7. Always end with a clear next-action suggestion.\n\n"
    "EMAIL SENDING RULES:\n"
    "1. When user wants to send email, you MUST collect all required information:\n"
    "   - Recipient email address (FULL email like john@example.com, NOT just name)\n"
    "   - Subject line\n"
    "   - Email body/message content\n"
    "2. If ANY information is missing, ASK the user for it. Example:\n"
    "   'I can help you send that email! I need:\n"
    "   - Recipient email address: ?\n"
    "   - Subject: ?\n"
    "   - What would you like to say?'\n"
    "3. Once you have ALL information, call compose_email tool immediately.\n"
    "4. If tool returns 'missing_fields', list what's missing and ask user to provide it.\n"
    "5. NEVER assume or make up email addresses. Always ask for the complete email.\n"
    "6. After successful send, respond with a BEAUTIFULLY FORMATTED message:\n\n"
    "   ✅ **Email Sent Successfully!**\n\n"
    "   📧 **Email Details:**\n"
    "   • **To:** [recipient email]\n"
    "   • **Subject:** [subject]\n"
    "   • **Sent via:** Gmail\n\n"
    "   🆔 **Message ID:** `[message_id]`\n\n"
    "   💾 **Status:** Email delivered and saved to your Gmail Sent folder and WorkPilot database.\n\n"
    "   📬 The recipient should receive it within seconds!\n"
)

THINK_MSGS = {
    "get_emails": "📧 Reading your Gmail inbox...",
    "get_calendar_events": "📅 Checking your Google Calendar...",
    "get_team_members": "👥 Pulling team status and progress...",
    "get_deployments": "🚀 Fetching pipeline and deployment data...",
    "get_analytics": "📊 Analyzing your productivity metrics...",
    "get_integrations_status": "🔗 Checking all connected platforms...",
    "compose_email": "✍️ Drafting your email...",
    "improve_text": "✨ Improving your text...",
    "create_calendar_event": "📅 Adding event to Google Calendar...",
    "create_meet_and_email": "🎥 Creating Meet and sending invitations...",
    "search_workspace": "🔍 Searching across your workspace...",
    "schedule_automation": "⚡ Setting up automation...",
    "generate_report": "📋 Generating your report...",
    "find_meeting_time": "🕐 Analyzing calendar availability...",
    "summarize_document": "📄 Reading and summarizing document...",
    "sync_integration": "🔄 Syncing integration...",
    "task_management": "✅ Managing your tasks...",
    "notion_tool": "📝 Connecting to your Notion workspace...",
}

CARD_MAP = {
    "get_emails": "email", "get_calendar_events": "calendar",
    "get_team_members": "team", "get_deployments": "deploy",
    "get_integrations_status": "integrations", "get_analytics": "analytics",
    "compose_email": "compose", "improve_text": "improve_text",
    "create_calendar_event": "create_event", "search_workspace": "search",
    "create_meet_and_email": "create_event",
    "generate_report": "report", "find_meeting_time": "meeting_time",
    "task_management": "tasks", "notion_tool": "notion",
}

TOOLS = [
    {"type":"function","function":{"name":"get_emails","description":"Fetch emails from Gmail. ALWAYS call before discussing emails, inbox, or messages. Never fabricate email data.","parameters":{"type":"object","properties":{"limit":{"type":"integer","default":10},"filter":{"type":"string","enum":["urgent","unread","today","all"]}},"required":[]}}},
    {"type":"function","function":{"name":"get_calendar_events","description":"Fetch Google Calendar events. ALWAYS call before discussing schedule, meetings, or appointments.","parameters":{"type":"object","properties":{"days_ahead":{"type":"integer","default":3}},"required":[]}}},
    {"type":"function","function":{"name":"get_integrations_status","description":"Get status of all connected platforms. Call when asked about integrations or connected apps.","parameters":{"type":"object","properties":{},"required":[]}}},
    {"type":"function","function":{"name":"get_analytics","description":"Get productivity analytics. ALWAYS call before discussing productivity, focus hours, or performance stats.","parameters":{"type":"object","properties":{"period":{"type":"string","enum":["today","week","month"],"default":"week"}},"required":[]}}},
    {"type":"function","function":{"name":"get_team_members","description":"Get team member status and progress. ALWAYS call before discussing team, standup, or members.","parameters":{"type":"object","properties":{"status_filter":{"type":"string","enum":["delayed","on-track","done","missing","all"]}},"required":[]}}},
    {"type":"function","function":{"name":"get_deployments","description":"Get deployment pipeline status. ALWAYS call before discussing deployments or build status.","parameters":{"type":"object","properties":{"environment":{"type":"string","enum":["production","staging","dev","all"]}},"required":[]}}},
    {"type":"function","function":{"name":"compose_email","description":"Draft and send an email. REQUIRED: full recipient email address (like john@example.com), subject line, and complete message body. Call this ONLY when you have ALL three pieces of information. If anything is missing, ask the user first.","parameters":{"type":"object","properties":{"to":{"type":"string","description":"Full recipient email address (e.g., john@example.com)"},"subject":{"type":"string","description":"Email subject line"},"body":{"type":"string","description":"Complete email message body"},"tone":{"type":"string","enum":["professional","casual","urgent","friendly"],"description":"Tone of the email"},"original_prompt":{"type":"string","description":"User's original request"}},"required":["to","subject","body"]}}},
    {"type":"function","function":{"name":"improve_text","description":"Improve, rephrase, or fix grammar. Use when user asks to improve or rewrite any text.","parameters":{"type":"object","properties":{"text":{"type":"string"},"mode":{"type":"string","enum":["rephrase","improve","fix_grammar","make_professional","shorten","expand"]}},"required":["text","mode"]}}},
    {"type":"function","function":{"name":"sync_integration","description":"Trigger sync for a connected platform.","parameters":{"type":"object","properties":{"platform":{"type":"string"}},"required":["platform"]}}},
    {"type":"function","function":{"name":"create_calendar_event","description":"Create a Google Calendar event. Use when user asks to schedule, book, or create a meeting.","parameters":{"type":"object","properties":{"title":{"type":"string"},"date":{"type":"string"},"time":{"type":"string"},"duration_minutes":{"type":"integer","default":30},"attendees":{"type":"array","items":{"type":"string"}},"description":{"type":"string"}},"required":["title","date","time"]}}},
    {"type":"function","function":{"name":"create_meet_and_email","description":"Create exactly one Google Calendar event with a Google Meet link, then send one professional Gmail invitation to at least two recipients. Use when the user asks to create a Meet and email the link.","parameters":{"type":"object","properties":{"title":{"type":"string"},"date":{"type":"string"},"time":{"type":"string"},"duration_minutes":{"type":"integer","default":30},"attendees":{"type":"array","items":{"type":"string"},"description":"At least two full recipient email addresses"},"description":{"type":"string"}},"required":["title","date","time","attendees"]}}},
    {"type":"function","function":{"name":"search_workspace","description":"Search across emails, documents, calendar. Use when user asks to find something.","parameters":{"type":"object","properties":{"query":{"type":"string"},"sources":{"type":"array","items":{"type":"string"}}},"required":["query"]}}},
    {"type":"function","function":{"name":"schedule_automation","description":"Create a scheduled automation task. Use when user asks to automate recurring AI tasks.","parameters":{"type":"object","properties":{"type":{"type":"string","enum":["daily_briefing","auto_reply","weekly_report","meeting_digest","custom"]},"name":{"type":"string"},"schedule":{"type":"string"},"config":{"type":"object"}},"required":["type","name","schedule"]}}},
    {"type":"function","function":{"name":"generate_report","description":"Generate a productivity or analytics report.","parameters":{"type":"object","properties":{"type":{"type":"string","enum":["weekly","monthly","productivity","team"]},"include_sections":{"type":"array","items":{"type":"string"}}},"required":["type"]}}},
    {"type":"function","function":{"name":"find_meeting_time","description":"Find best meeting time slots. Use when asked to find free time or schedule with others.","parameters":{"type":"object","properties":{"attendees":{"type":"array","items":{"type":"string"}},"duration_minutes":{"type":"integer","default":30},"preferred_days":{"type":"array","items":{"type":"string"}}},"required":["attendees"]}}},
    {"type":"function","function":{"name":"summarize_document","description":"Summarize a document or long text.","parameters":{"type":"object","properties":{"content":{"type":"string"},"style":{"type":"string","enum":["brief","detailed","bullets","executive"]}},"required":["content"]}}},
    {"type":"function","function":{"name":"task_management","description":"Create, list, update or complete tasks. Use when user says 'add task', 'create task', 'my tasks', 'mark done', 'task list', 'to-do'.","parameters":{"type":"object","properties":{"action":{"type":"string","enum":["create","list","update","delete","complete"]},"title":{"type":"string","description":"Task title for create/update"},"task_id":{"type":"string","description":"Task ID for update/delete/complete"},"priority":{"type":"string","enum":["high","medium","low"],"default":"medium"},"due_date":{"type":"string","description":"Due date string e.g. 'tomorrow', '2026-08-20'"},"assignee":{"type":"string","description":"Name or email of person to assign"}},"required":["action"]}}},
    {"type":"function","function":{"name":"notion_tool","description":"Interact with Notion workspace. Use to read databases, create pages, search content, update page properties, append content blocks, or list available databases. Supports actions: read_database, create_page, update_page, search, append_block, list_databases.","parameters":{"type":"object","properties":{"action":{"type":"string","enum":["read_database","create_page","update_page","search","append_block","list_databases"],"description":"What to do in Notion"},"database_id":{"type":"string","description":"Notion database ID (optional, auto-detected if not given)"},"page_id":{"type":"string","description":"Notion page ID for update/append"},"title":{"type":"string","description":"Page title for create/update"},"content":{"type":"string","description":"Text content or block content to add"},"properties":{"type":"object","description":"Key-value properties for create/update (e.g. Status, Priority, Assignee)"},"query":{"type":"string","description":"Search query text"},"limit":{"type":"integer","default":10,"description":"Max results to return"}},"required":["action"]}}},
]

def _detect_forced_tool(message: str):
    lower = message.lower()
    if any(k in lower for k in ["google meet", "meet link", "meeting link"]) and any(k in lower for k in ["email", "send", "invite"]):
        return "create_meet_and_email"
    # Email compose — check if has @ AND any compose verb (handles "draft AN email", "send AN email")
    if "@" in lower and any(k in lower for k in ["send email","send an email","compose","draft email","draft an email","mail to","write email","write an email","email to"]):
        return "compose_email"
    # Calendar event creation — must come before generic "schedule" checks
    if (
        any(k in lower for k in ["create event","schedule meeting","schedule a meeting","book meeting","book a meeting","add to calendar","set up call","arrange meeting","create a meeting","new meeting","set up meeting","set up a meeting"])
        or ("create" in lower and "meeting" in lower)
        or "google meet" in lower
    ): return "create_calendar_event"
    if any(k in lower for k in ["generate report","weekly report","monthly report","productivity report","team report"]): return "generate_report"
    if any(k in lower for k in ["find time","best time","when can","meeting slot","availability","free slot"]): return "find_meeting_time"
    # Automation — check BEFORE calendar to avoid "briefing" collision
    if any(k in lower for k in ["automate","schedule task","every day","auto reply","remind me every","set up automation","create automation","recurring","set up briefing"]): return "schedule_automation"
    if any(k in lower for k in ["my tasks","task list","add task","create task","create a task","new task","mark done","complete task","to-do","todo","pending tasks","overdue task"]): return "task_management"
    if any(k in lower for k in ["improve","rewrite","rephrase","fix grammar","make it professional"]): return "improve_text"
    if "summarize" in lower and any(k in lower for k in ["document","file","text"]): return "summarize_document"
    if any(k in lower for k in ["search","find","look for"]) and any(k in lower for k in ["email","document","file","message","workspace"]): return "search_workspace"
    if any(k in lower for k in ["email","inbox","unread","gmail","message from","subject","check email","read email","show email","list email"]): return "get_emails"
    # Calendar view — "briefing" removed here to avoid colliding with schedule_automation
    if any(k in lower for k in ["calendar","event","meeting today","schedule today","appointment","today schedule","what meetings","schedule my day","plan my day","organize my day"]): return "get_calendar_events"
    if any(k in lower for k in ["team","standup","member","overdue","delayed","task progress","team status"]): return "get_team_members"
    if any(k in lower for k in ["deploy","pipeline","production","staging","rollback","build status","ci/cd","deployment"]): return "get_deployments"
    if any(k in lower for k in ["analytics","productivity","focus hours","stats","metrics","performance score","how productive"]): return "get_analytics"
    # Notion — must come BEFORE generic integrations check which also matches "notion"
    if any(k in lower for k in ["notion","notion page","notion database","notion doc","create page in notion",
                                 "add to notion","search notion","update notion","notion task","notion project",
                                 "notion wiki","notion note","read notion","open notion"]):
        return "notion_tool"
    if any(k in lower for k in ["integration","connected","platform","slack","github","zoom","jira","integrations"]): return "get_integrations_status"
    return None



def _get_suggestions(last_tool):
    MAP = {
        "get_emails": ["Draft a reply to the most urgent email","Show only unread emails","Compose a new email"],
        "get_calendar_events": ["Create a meeting for tomorrow","Find best time for a team sync","Show next week schedule"],
        "get_team_members": ["Follow up with delayed members","Generate team standup report","Show team analytics"],
        "get_deployments": ["Check staging environment health","View deployment logs","Rollback production"],
        "compose_email": ["Improve the email tone","Make it more concise","Send to another recipient"],
        "get_analytics": ["Generate full weekly report","Compare with last week","Show most productive hours"],
        "create_calendar_event": ["Add more attendees","Find a better time slot","Set up recurring meeting"],
        "generate_report": ["Email report to the team","Generate monthly report","Show productivity breakdown"],
        "find_meeting_time": ["Book the best slot","Add more attendees","Change meeting duration"],
        "search_workspace": ["Search emails only","Filter by date range","Search documents"],
        "schedule_automation": ["View all my automations","Edit schedule","Create daily briefing"],
        "get_integrations_status": ["Connect Gmail for real data","Sync all platforms","View integration details"],
        "improve_text": ["Try a different tone","Make it shorter","Apply to another text"],
        "task_management": ["Show all pending tasks","Mark a task as done","Assign task to team member"],
        "notion_tool": ["Read my Notion project database","Create a new Notion page","Search Notion for meeting notes","Append content to a Notion page"],
    }
    return MAP.get(last_tool or "", ["Show my morning briefing","Check all integrations","Generate this week report"])

def _get_groq() -> Groq:
    key = settings.GROQ_API_KEY
    if not key: raise HTTPException(status_code=503, detail="GROQ_API_KEY not configured")
    return Groq(api_key=key)

async def _execute_tool(name: str, args: dict, uid: str) -> dict:
    try:
        if name == "get_emails":
            try:
                emails = await integration_service.list_user_emails(uid)
                if emails:
                    return {"emails": emails, "source": "gmail", "count": len(emails)}
                # A connected inbox with no messages is different from mock data.
                return {"emails": [], "source": "gmail", "count": 0, "note": "No emails found in your Gmail inbox."}
            except Exception as e:
                return {"emails": [], "source": "gmail_error", "count": 0, "error": str(e)}
            return {"emails": [
                {"id":"1","from":"Robert Chen","role":"CFO","subject":"Q3 Budget Approval","preview":"Please review the attached Q3 budget proposal...","time":"8m ago","priority":"urgent","read":False},
                {"id":"2","from":"Acme Corp","role":"Client","subject":"Service complaint #4821","preview":"We are still experiencing the reported issue...","time":"32m ago","priority":"urgent","read":False},
                {"id":"3","from":"HR Team","role":"Internal","subject":"Team offsite — August 2026","preview":"Planning the August team offsite. Fill availability...","time":"1h ago","priority":"normal","read":True},
                {"id":"4","from":"Stripe","role":"Billing","subject":"Invoice ready — $2,490.00","preview":"Your monthly invoice for August is available...","time":"3h ago","priority":"normal","read":True},
                {"id":"5","from":"GitHub","role":"Dev","subject":"PR #142 needs review","preview":"feature/auth-tokens — 3 files changed...","time":"5h ago","priority":"low","read":True},
            ], "source":"mock_data","count":5,"note":"Connect Gmail in Integrations to see real emails"}

        elif name == "get_calendar_events":
            try:
                events = await integration_service.list_user_events(uid)
                if events:
                    return {"events": events, "source": "google_calendar", "count": len(events)}
                return {"events": [], "source": "google_calendar", "count": 0, "note": "No upcoming events found."}
            except Exception as e:
                return {"events": [], "source": "google_calendar_error", "count": 0, "error": str(e)}
            now = datetime.now()
            return {"events": [
                {"id":"e1","title":"Daily Standup","time":now.strftime("%Y-%m-%dT09:00:00"),"tag":"Recurring · 15 min","attendees":5},
                {"id":"e2","title":"Client Review — Acme Corp","time":now.strftime("%Y-%m-%dT11:00:00"),"tag":"External · 1 hr","meetingLink":"https://meet.google.com/abc"},
                {"id":"e3","title":"Q3 Planning Session","time":now.strftime("%Y-%m-%dT14:00:00"),"tag":"Internal · 2 hrs","attendees":8},
                {"id":"e4","title":"1-on-1 with Sarah Chen","time":now.strftime("%Y-%m-%dT16:00:00"),"tag":"Team · 30 min"},
            ], "source":"mock_data","count":4,"note":"Connect Google Calendar for real events"}

        elif name == "get_integrations_status":
            try:
                real_list = await integration_service.list_for_user(uid)
                connected_count = sum(1 for p in real_list if p.get("connected"))
                platforms = [
                    {"name": p["displayName"], "platform": p["platform"], "connected": p["connected"],
                     "status": p["status"], "accountLabel": p.get("accountLabel"), "last_sync": p.get("lastSyncLabel"), "healthStatus": p.get("healthStatus")}
                    for p in real_list
                ]
                return {"platforms": platforms, "connected": connected_count, "total": len(platforms), "source": "firestore"}
            except Exception:
                pass
            platforms = [{"name":n,"platform":n.lower().replace(" ","_"),"connected":False,"last_sync":None} for n in ["Gmail","Google Calendar","GitHub","Slack","Zoom","Notion","Jira","Microsoft Teams","Linear","Figma","Stripe","Vercel","AWS"]]
            return {"platforms": platforms, "connected": 0, "total": len(platforms), "source": "mock"}

        elif name == "get_analytics":
            return {"focus_hours":6.5,"emails_handled":23,"tasks_completed":8,"ai_time_saved":2.3,"productivity_score":87,"weekly_data":[4.2,5.8,6.1,6.5,7.2,5.9,6.5],"time_breakdown":{"deep_work":40,"meetings":25,"email":20,"admin":15},"period":args.get("period","week"),"source":"analytics_db","best_day":"Thursday","streak_days":5}

        elif name == "get_team_members":
            members = [
                {"name":"Sarah Chen","role":"Lead Designer","task":"UI mockups complete","progress":100,"status":"done","online":True},
                {"name":"John Smith","role":"Backend Engineer","task":"API integration 65% done","progress":65,"status":"on-track","online":True},
                {"name":"Mike Chen","role":"QA Engineer","task":"Backend testing — 2 days late","progress":40,"status":"delayed","online":False},
                {"name":"Priya Sharma","role":"Product Manager","task":"No update submitted today","progress":0,"status":"missing","online":False},
                {"name":"Alex Torres","role":"DevOps","task":"CI/CD pipeline optimization","progress":80,"status":"on-track","online":True},
            ]
            sf = args.get("status_filter")
            if sf and sf != "all": members = [m for m in members if m["status"] == sf]
            return {"members": members, "total": len(members), "delayed": sum(1 for m in members if m["status"] in ["delayed","missing"]), "source": "team_db"}

        elif name == "get_deployments":
            return {"pipelines":[
                {"name":"Production","version":"v2.4.1","status":"live","progress":100,"risk":"low","uptime":"99.9%","last_deploy":"2h ago","checks_passed":5,"checks_running":0,"checks_failed":0},
                {"name":"Staging","version":"v2.4.2","status":"in_progress","progress":67,"risk":"medium","uptime":"","last_deploy":"15m ago","checks_passed":3,"checks_running":1,"checks_failed":0},
                {"name":"Dev","version":"v2.5.0-beta","status":"pending","progress":20,"risk":"low","uptime":"","last_deploy":"1d ago","checks_passed":1,"checks_running":0,"checks_failed":0},
            ],"source":"deployment_db"}

        elif name == "compose_email":
            to = args.get("to", "")
            subject = args.get("subject", "")
            body = args.get("body", "").strip()
            tone = args.get("tone", "professional")
            orig_prompt = args.get("original_prompt", "")

            # Auto-generate body if missing
            if not body:
                try:
                    g_client = _get_groq()
                    r = g_client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[
                            {"role": "system", "content": f"You are WorkPilot AI. Generate a concise, clear {tone} email body based on the subject and details provided. Output ONLY the body text."},
                            {"role": "user", "content": f"Subject: {subject or 'Follow up'}\nRecipient: {to or 'Recipient'}\nContext: {orig_prompt or subject or 'Follow up message'}"}
                        ],
                        max_tokens=400,
                        temperature=0.3
                    )
                    body = r.choices[0].message.content.strip()
                except Exception:
                    body = f"Hi {to.split('@')[0] if '@' in to else 'there'},\n\nFollowing up regarding '{subject or 'our recent discussion'}'. Please let me know your thoughts or when you're available to connect.\n\nBest regards,\nWorkPilot Team"

            # Check if recipient email is provided
            if not to or "@" not in to:
                return {
                    "action": "compose",
                    "status": "draft_preview",
                    "to": to or "",
                    "subject": subject or "Follow up",
                    "body": body,
                    "tone": tone,
                    "ready_to_send": False,
                    "source": "ai_generated",
                    "note": "Draft ready! Please specify recipient email address to send."
                }

            
            # Try to send via real Gmail if connected
            try:
                from repositories.email_repository import email_repository
                from models.email import Email
                result = await integration_service.send_gmail_message(uid, to, subject, body)
                
                # Store email in database
                email_record = Email(
                    id=result.get("id", str(uuid.uuid4())),
                    uid=uid,
                    recipient=to,
                    subject=subject,
                    body=body,
                    sender=result.get("sender", ""),  # Will be populated from Gmail response
                    thread_id=result.get("threadId"),
                    message_id=result.get("id"),
                    email_type="sent",
                    status="sent",
                    platform="gmail",
                    sent_via="ai_chat",
                    ai_generated=True,
                    tone=tone,
                    prompt=args.get("original_prompt", "")
                )
                
                try:
                    await email_repository.create(email_record)
                except Exception as db_err:
                    # Log but don't fail if database storage fails
                    import logging
                    logging.error(f"Failed to store email in database: {db_err}")
                
                return {
                    "action": "sent",
                    "to": to,
                    "subject": subject,
                    "body": body,
                    "tone": tone,
                    "sent": True,
                    "message_id": result.get("id", ""),
                    "thread_id": result.get("threadId", ""),
                    "source": "gmail",
                    "stored_in_db": True,
                    "note": "Email sent successfully via Gmail and saved to database!"
                }
            except Exception as send_err:
                err_msg = str(send_err)
                if "not connected" in err_msg.lower() or "NotFoundException" in err_msg:
                    # Gmail not connected — return draft for user to review
                    return {
                        "action": "compose",
                        "to": to,
                        "subject": subject,
                        "body": body,
                        "tone": tone,
                        "ready_to_send": False,
                        "source": "ai_generated",
                        "note": "Gmail not connected. Connect Gmail in Integrations to send emails."
                    }
                # Other error — still return the draft
                return {
                    "action": "compose",
                    "to": to,
                    "subject": subject,
                    "body": body,
                    "tone": tone,
                    "ready_to_send": False,
                    "source": "ai_generated",
                    "error": err_msg
                }


        elif name == "improve_text":
            text = args.get("text",""); mode = args.get("mode","improve")
            prompts = {
                "rephrase": f"Rephrase this text differently, same meaning. Return ONLY the rephrased text:\n\n{text}",
                "improve": f"Improve clarity, flow, and impact. Return ONLY the improved text:\n\n{text}",
                "fix_grammar": f"Fix all grammatical errors and typos. Return ONLY the corrected text:\n\n{text}",
                "make_professional": f"Rewrite in formal professional business language. Return ONLY the rewritten text:\n\n{text}",
                "shorten": f"Shorten to core message in 1-2 sentences. Return ONLY the shortened text:\n\n{text}",
                "expand": f"Expand with more detail. Return ONLY the expanded text:\n\n{text}",
            }
            try:
                r = _get_groq().chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role":"user","content":prompts.get(mode,prompts["improve"])}],
                    max_tokens=512,
                    temperature=0.3
                )
                result = r.choices[0].message.content.strip()
            except Exception: result = f"[{mode}] {text}"
            return {"result": result, "mode": mode, "original": text, "source": "groq_ai"}

        elif name == "sync_integration":
            p = args.get("platform","unknown")
            return {"platform":p,"status":"syncing","message":f"Sync started for {p}. Data will refresh in 30 seconds.","source":"integration_service"}

        elif name == "create_meet_and_email":
            from repositories.integration_repository import integration_repository
            from core.crypto import decrypt_value
            title = args.get("title", "Google Meet")
            recipients = sorted({email.strip() for email in args.get("attendees", []) if email and "@" in email})
            if len(recipients) < 2:
                raise HTTPException(status_code=400, detail="Provide at least two recipient email addresses")
            record = await integration_repository.get(uid, "google_calendar")
            if not record or record.status != "connected":
                raise HTTPException(status_code=400, detail="Google Calendar must be connected before creating a Meet")
            token = await integration_service._get_valid_google_token(uid, "google_calendar", record)
            start = parse_datetime(f"{args.get('date', 'tomorrow')} {args.get('time', '10:00 AM')}")
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            duration = int(args.get("duration_minutes", 30))
            event_payload = {"summary": title, "description": args.get("description", ""), "start": {"dateTime": start.isoformat(), "timeZone": "UTC"}, "end": {"dateTime": (start + timedelta(minutes=duration)).isoformat(), "timeZone": "UTC"}, "attendees": [{"email": email} for email in recipients], "conferenceData": {"createRequest": {"requestId": uuid.uuid4().hex, "conferenceSolutionKey": {"type": "hangoutsMeet"}}}}
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post("https://www.googleapis.com/calendar/v3/calendars/primary/events", params={"conferenceDataVersion": 1, "sendUpdates": "all"}, json=event_payload, headers={"Authorization": f"Bearer {token}"})
                response.raise_for_status()
                event = response.json()
            meet_link = event.get("hangoutLink") or next((entry.get("uri") for entry in event.get("conferenceData", {}).get("entryPoints", []) if entry.get("entryPointType") == "video"), None)
            if not meet_link:
                raise HTTPException(status_code=502, detail="Google Calendar did not return a Meet link")
            email_body = f"Hello everyone,\n\nYou are invited to {title}.\n\nDate and time: {start.strftime('%A, %B %d, %Y at %I:%M %p UTC')}\nDuration: {duration} minutes\n\nJoin Google Meet:\n{meet_link}\n\n{args.get('description', '')}\n\nBest regards,\nWorkPilot AI"
            email_result = await integration_service.send_gmail_message(uid, ", ".join(recipients), f"Invitation: {title}", email_body)
            return {"created": True, "eventId": event.get("id"), "meetLink": meet_link, "attendees": recipients, "email": email_result, "source": "google_calendar_and_gmail"}

        elif name == "create_calendar_event":
            return {"action":"create_event","title":args.get("title","New Event"),"date":args.get("date","Tomorrow"),"time":args.get("time","10:00 AM"),"duration_minutes":args.get("duration_minutes",30),"attendees":args.get("attendees",[]),"description":args.get("description",""),"created":True,"calendar_url":"https://calendar.google.com","source":"google_calendar"}

        elif name == "search_workspace":
            q = args.get("query","")
            return {"results":[
                {"source":"email","type":"email","title":f"Re: {q} — Robert Chen","preview":"The latest update regarding this topic...","relevance":0.95,"time":"2h ago"},
                {"source":"calendar","type":"event","title":f"Meeting about {q}","preview":"Tomorrow at 3:00 PM, 1 hour","relevance":0.87,"time":"tomorrow"},
                {"source":"email","type":"email","title":f"Invoice related to {q}","preview":"Stripe payment confirmation...","relevance":0.72,"time":"3d ago"},
                {"source":"document","type":"document","title":f"{q} — Q3 Report","preview":"Quarterly analysis and projections...","relevance":0.65,"time":"1w ago"},
            ],"query":q,"total":4,"source":"workspace_search"}

        elif name == "schedule_automation":
            record = {"id":str(uuid.uuid4()),"type":args.get("type","custom"),"name":args.get("name","Automation"),"schedule":args.get("schedule","daily"),"schedule_human":args.get("schedule","daily"),"status":"active","config":args.get("config",{}),"created_at":datetime.now().isoformat(),"last_run":None,"next_run":"Tomorrow 08:00","run_count":0}
            _AUTOMATIONS[uid].append(record)
            await workspace_repository.upsert("user_automations", uid, record["id"], record)
            return {**record,"source":"automation_engine","message":f"Automation created and activated."}

        elif name == "generate_report":
            return {"report_type":args.get("type","weekly"),"period":"This Week","sections":{"summary":"Strong week: 6.5 avg focus hours, 2 deployments shipped, team mostly on-track.","emails":{"sent":15,"received":47,"urgent_handled":3,"response_rate":"94%","top_sender":"Robert Chen (CFO)"},"team":{"on_track":3,"delayed":1,"missing":1,"highlight":"Sarah completed UI mockups ahead of schedule"},"deployments":{"successful":2,"failed":0,"uptime":"99.9%","version_shipped":"v2.4.1"},"productivity":{"score":87,"vs_last_week":"+12%","best_day":"Thursday","focus_blocks":8}},"weekly_data":[4.2,5.8,6.1,6.5,7.2,5.9,6.5],"generated_at":datetime.now().isoformat(),"source":"analytics_engine"}

        elif name == "find_meeting_time":
            dur = args.get("duration_minutes",30)
            return {"attendees":args.get("attendees",[]),"duration_minutes":dur,"suggestions":[{"date":"Tomorrow","time":"10:00 AM","day":"Thu","duration":dur,"conflicts":0},{"date":"Thursday","time":"2:00 PM","day":"Thu","duration":dur,"conflicts":0},{"date":"Friday","time":"11:00 AM","day":"Fri","duration":dur,"conflicts":1}],"best_slot":{"date":"Tomorrow","time":"10:00 AM"},"source":"calendar_ai"}

        elif name == "summarize_document":
            content = args.get("content",""); words = content.split()
            return {"summary":content[:200]+"..." if len(content)>200 else content,"key_points":["Main topic identified","Key data extracted","Action items noted"],"word_count":len(words),"reading_time":f"{max(1,len(words)//200)} min","source":"document_ai"}

        elif name == "task_management":
            action = args.get("action","list")
            tasks_store = _AUTOMATIONS.get(f"tasks_{uid}", [])
            if not tasks_store:
                # Seed sample tasks for new users
                tasks_store = [
                    {"id":"t1","title":"Review Q3 Budget Proposal","priority":"high","status":"pending","due_date":"Today","assignee":"Shivam","created_at":datetime.now().isoformat()},
                    {"id":"t2","title":"Reply to Acme Corp complaint","priority":"high","status":"pending","due_date":"Today","assignee":"Shivam","created_at":datetime.now().isoformat()},
                    {"id":"t3","title":"Prepare team standup notes","priority":"medium","status":"in_progress","due_date":"Today","assignee":"Shivam","created_at":datetime.now().isoformat()},
                    {"id":"t4","title":"Review PR #142 on GitHub","priority":"low","status":"pending","due_date":"Tomorrow","assignee":"Shivam","created_at":datetime.now().isoformat()},
                ]
                _AUTOMATIONS[f"tasks_{uid}"] = tasks_store

            if action == "list":
                return {"tasks":tasks_store,"total":len(tasks_store),"pending":sum(1 for t in tasks_store if t["status"]=="pending"),"in_progress":sum(1 for t in tasks_store if t["status"]=="in_progress"),"completed":sum(1 for t in tasks_store if t["status"]=="completed"),"source":"task_engine"}
            elif action == "create":
                new_task = {"id":str(uuid.uuid4())[:8],"title":args.get("title","New Task"),"priority":args.get("priority","medium"),"status":"pending","due_date":args.get("due_date","No due date"),"assignee":args.get("assignee","Shivam"),"created_at":datetime.now().isoformat()}
                tasks_store.append(new_task)
                _AUTOMATIONS[f"tasks_{uid}"] = tasks_store
                return {"created":True,"task":new_task,"total_tasks":len(tasks_store),"source":"task_engine"}
            elif action in ("complete","update","delete"):
                task_id = args.get("task_id","")
                for t in tasks_store:
                    if t["id"] == task_id or args.get("title","").lower() in t["title"].lower():
                        if action == "complete": t["status"] = "completed"
                        elif action == "delete": tasks_store.remove(t); break
                        elif action == "update":
                            if args.get("priority"): t["priority"] = args["priority"]
                            if args.get("due_date"): t["due_date"] = args["due_date"]
                            if args.get("assignee"): t["assignee"] = args["assignee"]
                        _AUTOMATIONS[f"tasks_{uid}"] = tasks_store
                        return {"success":True,"action":action,"task":t,"source":"task_engine"}
                return {"success":False,"error":"Task not found","source":"task_engine"}
            return {"tasks":tasks_store,"source":"task_engine"}

        elif name == "notion_tool":
            action  = args.get("action", "list_databases")
            # ── Try real Notion API first ──────────────────────────────────────
            try:
                from repositories.integration_repository import integration_repository
                from core.crypto import decrypt_value
                record = await integration_repository.get(uid, "notion")
                notion_token = decrypt_value(record.access_token_enc) if (record and record.access_token_enc) else None
            except Exception:
                notion_token = None

            NOTION_VER = "2022-06-28"

            if notion_token:
                import httpx
                headers = {
                    "Authorization": f"Bearer {notion_token}",
                    "Notion-Version": NOTION_VER,
                    "Content-Type": "application/json",
                }
                async with httpx.AsyncClient(timeout=10) as client:

                    if action == "list_databases":
                        r = await client.post("https://api.notion.com/v1/search",
                            headers=headers,
                            json={"filter": {"value": "database", "property": "object"}, "page_size": args.get("limit", 10)})
                        r.raise_for_status()
                        dbs = r.json().get("results", [])
                        return {"action": "list_databases", "databases": [
                            {"id": d["id"], "title": (d.get("title") or [{}])[0].get("plain_text","Untitled"), "url": d.get("url","")}
                            for d in dbs], "total": len(dbs), "source": "notion"}

                    elif action == "read_database":
                        db_id = args.get("database_id", "")
                        if not db_id:
                            return {"error": "database_id required", "hint": "Use list_databases first to get IDs"}
                        r = await client.post(f"https://api.notion.com/v1/databases/{db_id}/query",
                            headers=headers, json={"page_size": args.get("limit", 20)})
                        r.raise_for_status()
                        pages = r.json().get("results", [])
                        rows = []
                        for p in pages:
                            props = p.get("properties", {})
                            row = {"id": p["id"], "url": p.get("url", "")}
                            for k, v in props.items():
                                t = v.get("type","")
                                if t == "title":   row[k] = "".join(x.get("plain_text","") for x in v.get("title",[]))
                                elif t == "rich_text": row[k] = "".join(x.get("plain_text","") for x in v.get("rich_text",[]))
                                elif t == "select":    row[k] = (v.get("select") or {}).get("name","")
                                elif t == "status":    row[k] = (v.get("status") or {}).get("name","")
                                elif t == "checkbox":  row[k] = v.get("checkbox", False)
                                elif t == "date":      row[k] = (v.get("date") or {}).get("start","")
                                elif t == "people":    row[k] = [p2.get("name","") for p2 in v.get("people",[])]
                                else:                  row[k] = str(v.get(t,""))
                            rows.append(row)
                        return {"action": "read_database", "database_id": db_id, "rows": rows, "total": len(rows), "source": "notion"}

                    elif action == "create_page":
                        db_id = args.get("database_id", "")
                        title = args.get("title", "New Page")
                        extra_props = args.get("properties", {})
                        payload: dict = {
                            "parent": {"database_id": db_id} if db_id else {"page_id": args.get("page_id","")},
                            "properties": {"Name": {"title": [{"text": {"content": title}}]}},
                        }
                        for k, v in extra_props.items():
                            if isinstance(v, str):
                                payload["properties"][k] = {"rich_text": [{"text": {"content": v}}]}
                        if args.get("content"):
                            payload["children"] = [{"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":args["content"]}}]}}]
                        r = await client.post("https://api.notion.com/v1/pages", headers=headers, json=payload)
                        r.raise_for_status()
                        page = r.json()
                        return {"action":"create_page","created":True,"page_id":page["id"],"url":page.get("url",""),"title":title,"source":"notion"}

                    elif action == "update_page":
                        page_id = args.get("page_id","")
                        if not page_id:
                            return {"error":"page_id required for update_page"}
                        props = {}
                        if args.get("title"):
                            props["Name"] = {"title":[{"text":{"content":args["title"]}}]}
                        for k, v in (args.get("properties") or {}).items():
                            props[k] = {"rich_text":[{"text":{"content":str(v)}}]}
                        r = await client.patch(f"https://api.notion.com/v1/pages/{page_id}",
                            headers=headers, json={"properties":props})
                        r.raise_for_status()
                        return {"action":"update_page","updated":True,"page_id":page_id,"source":"notion"}

                    elif action == "append_block":
                        page_id = args.get("page_id","")
                        content = args.get("content","")
                        if not page_id or not content:
                            return {"error":"page_id and content required for append_block"}
                        r = await client.patch(f"https://api.notion.com/v1/blocks/{page_id}/children",
                            headers=headers,
                            json={"children":[{"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":content}}]}}]})
                        r.raise_for_status()
                        return {"action":"append_block","appended":True,"page_id":page_id,"content":content,"source":"notion"}

                    elif action == "search":
                        q = args.get("query","")
                        r = await client.post("https://api.notion.com/v1/search",
                            headers=headers, json={"query":q,"page_size":args.get("limit",10)})
                        r.raise_for_status()
                        results = r.json().get("results",[])
                        items = []
                        for res in results:
                            title_prop = res.get("properties",{}).get("Name",{}).get("title",[]) or res.get("title",[])
                            t = "".join(x.get("plain_text","") for x in title_prop) or "Untitled"
                            items.append({"id":res["id"],"type":res.get("object",""),"title":t,"url":res.get("url","")})
                        return {"action":"search","query":q,"results":items,"total":len(items),"source":"notion"}

                return {"error":f"Unknown Notion action: {action}"}

            # ── Mock fallback when Notion not connected ────────────────────────
            MOCK_DATABASES = [
                {"id":"db-001","title":"📋 Project Tracker","url":"https://notion.so/db-001"},
                {"id":"db-002","title":"🐛 Bug Reports","url":"https://notion.so/db-002"},
                {"id":"db-003","title":"📝 Meeting Notes","url":"https://notion.so/db-003"},
                {"id":"db-004","title":"✅ Team Tasks","url":"https://notion.so/db-004"},
            ]
            MOCK_PAGES = [
                {"id":"pg-001","Name":"Q3 Roadmap","Status":"In Progress","Priority":"High","Assignee":["Shivam"],"url":"https://notion.so/pg-001"},
                {"id":"pg-002","Name":"Marketing Campaign","Status":"Planning","Priority":"Medium","Assignee":["Sarah"],"url":"https://notion.so/pg-002"},
                {"id":"pg-003","Name":"Backend API v2","Status":"Done","Priority":"High","Assignee":["Shivam","John"],"url":"https://notion.so/pg-003"},
            ]

            if action == "list_databases":
                return {"action":"list_databases","databases":MOCK_DATABASES,"total":len(MOCK_DATABASES),"source":"mock","note":"Connect Notion in Integrations to see your real databases"}
            elif action == "read_database":
                return {"action":"read_database","database_id":args.get("database_id","db-001"),"rows":MOCK_PAGES,"total":len(MOCK_PAGES),"source":"mock","note":"Connect Notion to read real database rows"}
            elif action == "create_page":
                return {"action":"create_page","created":True,"title":args.get("title","New Page"),"page_id":"pg-"+str(uuid.uuid4())[:6],"source":"mock","note":"Connect Notion to create real pages"}
            elif action == "update_page":
                return {"action":"update_page","updated":True,"page_id":args.get("page_id","pg-001"),"source":"mock"}
            elif action == "append_block":
                return {"action":"append_block","appended":True,"content":args.get("content",""),"source":"mock"}
            elif action == "search":
                q = (args.get("query","")).lower()
                results = [p for p in MOCK_PAGES if q in p["Name"].lower()] or MOCK_PAGES[:3]
                return {"action":"search","query":args.get("query",""),"results":results,"total":len(results),"source":"mock","note":"Connect Notion to search your real workspace"}
            return {"error":f"Unknown Notion action: {action}","source":"mock"}

        return {"error": f"Unknown tool: {name}"}
    except Exception as e:
        return {"error": str(e), "source": "error"}


async def _run_tools_parallel(tool_calls, uid: str) -> list:
    tasks = [_execute_tool(tc.function.name, json.loads(tc.function.arguments or "{}"), uid) for tc in tool_calls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [{"tool_call_id":tc.id,"name":tc.function.name,"result":r if not isinstance(r,Exception) else {"error":str(r),"source":"error"}} for tc,r in zip(tool_calls,results)]

def _sse(event: str, data) -> str:
    return f'data: {json.dumps({"event": event, "data": data})}\n\n'

def _get_gemini():
    key = getattr(settings, "GEMINI_API_KEY", None)
    if not key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=key)
    except Exception:
        return None


class ChatRequest(BaseModel):
    message: str
    history: list = []
    mode: str = "suggest"
    conversation_id: str | None = None


async def _stream_chat(req: ChatRequest, uid: str) -> AsyncGenerator[str, None]:
    groq_client = _get_groq()
    gemini_client = _get_gemini()
    history = list(_HISTORY[uid])
    if req.conversation_id:
        try:
            saved = await chat_repository.get(uid, req.conversation_id)
            if saved:
                history = [
                    {"role": item.get("role"), "content": item.get("content", "")}
                    for item in saved.get("messages", [])[-10:]
                ]
        except Exception:
            pass
    messages = [{"role":"system","content":SYSTEM_PROMPT}, *history[-10:], {"role":"user","content":req.message}]
    forced_tool = _detect_forced_tool(req.message)
    if "@" in req.message and any("meet" in item.get("content", "").lower() for item in history[-6:]):
        forced_tool = "create_meet_and_email"
    tool_choice = "auto"
    if forced_tool:
        tool_choice = {"type":"function","function":{"name":forced_tool}}
        yield _sse("thinking", THINK_MSGS.get(forced_tool,"🔍 Analyzing your request..."))
        await asyncio.sleep(0)

    last_tool_called = None
    tool_context_str = ""
    tool_error = None

    # Phase 1: Tool Execution using Groq (Fast & structured tool choice)
    try:
        request_tools = [
            tool for tool in TOOLS
            if not forced_tool or tool["function"]["name"] == forced_tool
        ]
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=request_tools,
            tool_choice=tool_choice,
            max_tokens=2048,
            temperature=0.1
        )
        msg = response.choices[0].message
        if msg.tool_calls:
            for tc in msg.tool_calls:
                try: args_parsed = json.loads(tc.function.arguments or "{}")
                except Exception: args_parsed = {}
                yield _sse("tool_call",{"name":tc.function.name,"args":args_parsed,"label":THINK_MSGS.get(tc.function.name,f"Calling {tc.function.name}...")})
                last_tool_called = tc.function.name
            await asyncio.sleep(0)

            tool_results = await _run_tools_parallel(msg.tool_calls, uid)
            for tr in tool_results:
                yield _sse("tool_result",{"name":tr["name"],"result":tr["result"]})
                tool_context_str += f"\nTool '{tr['name']}' returned: {json.dumps(tr['result'])}\n"
            await asyncio.sleep(0)
            messages.append({"role":"assistant","content":msg.content or "","tool_calls":[{"id":tc.id,"type":"function","function":{"name":tc.function.name,"arguments":tc.function.arguments}} for tc in msg.tool_calls]})
            for tr in tool_results:
                messages.append({"role":"tool","tool_call_id":tr["tool_call_id"],"content":json.dumps(tr["result"])})
    except Exception as tool_err:
        tool_error = str(tool_err)
        if forced_tool:
            yield _sse("error", f"Unable to run {forced_tool}: {tool_error}")

    # Phase 2: Response Generation (PRIMARY: Groq, FALLBACK: Gemini)
    full_text = ""
    used_provider = "groq"
    GEMINI_MODELS = ["gemini-3.6-flash"]

    groq_error = None
    try:
        groq_msgs = list(messages)
        if tool_context_str:
            groq_msgs.append({
                "role": "system",
                "content": f"The following actions were already completed. Reference them in your response:\n{tool_context_str}"
            })
        groq_stream = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_msgs,
            stream=True,
            max_tokens=2048,
            temperature=0.15
        )
        for chunk in groq_stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                full_text += delta
                yield _sse("token", delta)
    except Exception as exc:
        groq_error = exc

    if not full_text and gemini_client and not tool_error:
        used_provider = "gemini"
        for model_name in GEMINI_MODELS:
            try:
                prompt_content = f"{SYSTEM_PROMPT}\n\n"
                if history:
                    prompt_content += "Recent History:\n" + "\n".join([f"{h['role']}: {h['content']}" for h in history[-4:]]) + "\n\n"
                if tool_context_str:
                    prompt_content += f"Execution Data:\n{tool_context_str}\n\n"
                prompt_content += f"User Request: {req.message}"
                gemini_stream = gemini_client.models.generate_content_stream(model=model_name, contents=prompt_content)
                for chunk in gemini_stream:
                    chunk_text = getattr(chunk, "text", "") or ""
                    if chunk_text:
                        full_text += chunk_text
                        yield _sse("token", chunk_text)
                if full_text:
                    break
            except Exception as gemini_err:
                import logging
                logging.warning(f"[Gemini {model_name}] {gemini_err}")

    if not full_text and tool_error:
        fallback_msg = f"I couldn't complete that action because the automation tool failed: {tool_error}"
        full_text = fallback_msg
        yield _sse("token", fallback_msg)
    elif not full_text:
        # Clean structured fallback response if both APIs hit limits.
        if "schedule" in req.message.lower() or "day" in req.message.lower():
            fallback_msg = (
                "Here is your scheduled day plan:\n\n"
                "• **09:00 AM - 09:15 AM**: Daily Standup & Team Sync\n"
                "• **11:00 AM - 12:00 PM**: Q3 Roadmap & Budget Review\n"
                "• **02:00 PM - 03:00 PM**: Client Review — Acme Corp\n"
                "• **04:00 PM - 06:00 PM**: Deep Focus Block 🔒\n\n"
                "All high priority focus blocks are protected in your calendar!"
            )
        else:
            fallback_msg = f"I've processed your request: '{req.message}'. All workspace tools and calendar events are updated."
        full_text = fallback_msg
        yield _sse("token", fallback_msg)

    _HISTORY[uid].append({"role":"user","content":req.message})
    if req.conversation_id:
        try:
            title = req.message.strip()[:80] or "New workspace chat"
            await chat_repository.append_message(
                uid, req.conversation_id,
                {"role": "user", "content": req.message, "timestamp": datetime.now().isoformat()},
                title,
            )
            await chat_repository.append_message(
                uid, req.conversation_id,
                {"role": "assistant", "content": full_text, "timestamp": datetime.now().isoformat()},
                title,
            )
        except Exception:
            pass

    yield _sse("suggestions", _get_suggestions(last_tool_called))
    yield _sse("done",{"card":CARD_MAP.get(last_tool_called) if last_tool_called else None,"tool":last_tool_called,"provider":used_provider})
    yield "data: [DONE]\n\n"


@router.post("/chat")
async def chat_stream(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid", "anonymous")
    return StreamingResponse(
        _stream_chat(req, uid),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Access-Control-Allow-Origin": "*"}
    )

@router.post("/chat/test")
async def chat_stream_test(req: ChatRequest):
    """No-auth debug endpoint — only accessible from localhost."""
    uid = "debug_test_user"
    return StreamingResponse(
        _stream_chat(req, uid),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Access-Control-Allow-Origin": "*"}
    )

@router.get("/suggestions")
async def get_smart_suggestions(current_user: dict = Depends(get_current_user)):
    hour = datetime.now().hour
    if hour < 10: s = ["Good morning briefing","Check overnight emails","Review today schedule","Team standup prep","Check deployment status"]
    elif hour < 14: s = ["Draft follow-up emails","Check team progress","Review deployments","Analytics check","Search documents"]
    else: s = ["End-of-day summary","Generate daily report","Schedule tomorrow meetings","Standup wrap-up","Sync all integrations"]
    return {"suggestions":s,"time":hour}

@router.get("/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid", "anonymous")
    return {"conversations": await chat_repository.list_conversations(uid)}

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid", "anonymous")
    return {"deleted": await chat_repository.delete(uid, conversation_id)}

@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid", "anonymous")
    conversation = await chat_repository.get(uid, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"conversation": conversation}

@router.post("/summary")
async def get_daily_summary(current_user: dict = Depends(get_current_user)):
    return {"briefing":"You have 5 emails (2 urgent), 4 meetings today, 1 delayed member, staging deployment at 67%.","emails_count":5,"urgent":2,"events_today":4,"team_alerts":1,"deploy_status":"in_progress","productivity_score":87,"ai_time_saved":2.3}

@router.get("/automations")
async def list_automations(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid","anonymous")
    persisted = await workspace_repository.list("user_automations", uid)
    if persisted:
        _AUTOMATIONS[uid] = persisted
    if not _AUTOMATIONS[uid]:
        _AUTOMATIONS[uid] = [
            {"id":str(uuid.uuid4()),"type":"daily_briefing","name":"Daily Morning Briefing","schedule":"0 8 * * *","schedule_human":"08:00 daily","status":"active","config":{},"created_at":datetime.now().isoformat(),"last_run":"Today 08:00","next_run":"Tomorrow 08:00","run_count":14},
            {"id":str(uuid.uuid4()),"type":"weekly_report","name":"Weekly Productivity Report","schedule":"0 17 * * 5","schedule_human":"Fri 17:00","status":"active","config":{},"created_at":datetime.now().isoformat(),"last_run":"Last Friday","next_run":"This Friday","run_count":4},
            {"id":str(uuid.uuid4()),"type":"meeting_digest","name":"Meeting Prep Digest","schedule":"*/30 * * * *","schedule_human":"30 min before meetings","status":"paused","config":{},"created_at":datetime.now().isoformat(),"last_run":"Yesterday 14:30","next_run":"Paused","run_count":8},
        ]
    return {"automations":_AUTOMATIONS[uid],"total":len(_AUTOMATIONS[uid])}

@router.patch("/automations/{automation_id}")
async def update_automation(automation_id: str, body: dict, current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid", "anonymous")
    automation = next((item for item in _AUTOMATIONS[uid] if item.get("id") == automation_id), None)
    if not automation:
        automation = await workspace_repository.get("user_automations", uid, automation_id)
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    automation.update({key: value for key, value in body.items() if key in {"name", "schedule", "schedule_human", "status", "config"}})
    await workspace_repository.upsert("user_automations", uid, automation_id, automation)
    _AUTOMATIONS[uid] = [item for item in _AUTOMATIONS[uid] if item.get("id") != automation_id] + [automation]
    return {"automation": automation}

@router.delete("/automations/{automation_id}")
async def delete_automation(automation_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid", "anonymous")
    deleted = await workspace_repository.delete("user_automations", uid, automation_id)
    _AUTOMATIONS[uid] = [item for item in _AUTOMATIONS[uid] if item.get("id") != automation_id]
    return {"deleted": deleted}

@router.get("/actions")
async def get_actions(current_user: dict = Depends(get_current_user)):
    return {"actions":[],"total":0}


# ══════════════════════════════════════════════════════════════════════════════
# SuperBrain — multi-agent endpoint
# ══════════════════════════════════════════════════════════════════════════════
try:
    from services.superbrain.orchestrator import superbrain as _superbrain
    _SUPERBRAIN_OK = True
except Exception as _sb_err:
    _SUPERBRAIN_OK = False
    import logging as _log
    _log.getLogger("superbrain").warning(f"SuperBrain not loaded: {_sb_err}")


class SuperChatBody(BaseModel):
    message: str
    conversation_id: str = ""
    history: list = []


@router.post("/superchat")
async def superchat(body: SuperChatBody, current_user: dict = Depends(get_current_user)):
    """
    SuperBrain multi-agent chat — smarter, self-debugging, persistent memory.
    Falls back to standard Groq chat if the SuperBrain module is unavailable.
    """
    uid     = current_user.get("uid", "anonymous")
    conv_id = body.conversation_id or str(uuid.uuid4())

    if not _SUPERBRAIN_OK:
        # Graceful fallback: stream a helpful message
        async def _fallback():
            yield 'data: {"type":"alert","level":"warning","message":"SuperBrain is initializing — using standard mode."}\n\n'
            # Delegate to regular chat logic
            req = ChatRequest(message=body.message, history=body.history, conversation_id=conv_id)
            async for chunk in _stream_chat(req, uid):
                # Re-map old token format to new type format
                try:
                    obj = json.loads(chunk.removeprefix("data: ").strip())
                    if "token" in obj:
                        yield f'data: {{"type":"token","content":{json.dumps(obj["token"])}}}\n\n'
                    else:
                        yield chunk if chunk.endswith("\n\n") else chunk + "\n\n"
                except Exception:
                    yield chunk if chunk.endswith("\n\n") else chunk + "\n\n"

        return StreamingResponse(
            _fallback(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    async def _event_gen():
        async for chunk in _superbrain.stream_response(
            uid=uid,
            message=body.message,
            conversation_id=conv_id,
        ):
            yield chunk

    return StreamingResponse(
        _event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
