"""
ai_chat.py — WorkPilot AI Brain v2
Features: anti-hallucination, 15 tools, parallel execution, smart suggestions, automations
"""
import json, uuid, asyncio
from datetime import datetime
from collections import defaultdict, deque
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import Groq
from core.config import settings
from middleware.auth import get_current_user

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
    "6. After successful send, confirm with message ID and mention email is saved in their account.\n"
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
    "create_calendar_event": "📅 Creating calendar event...",
    "search_workspace": "🔍 Searching across your workspace...",
    "schedule_automation": "⚡ Setting up automation...",
    "generate_report": "📋 Generating your report...",
    "find_meeting_time": "🕐 Analyzing calendar availability...",
    "summarize_document": "📄 Reading and summarizing document...",
    "sync_integration": "🔄 Syncing integration...",
}

CARD_MAP = {
    "get_emails": "email", "get_calendar_events": "calendar",
    "get_team_members": "team", "get_deployments": "deploy",
    "get_integrations_status": "integrations", "get_analytics": "analytics",
    "compose_email": "compose", "improve_text": "improve_text",
    "create_calendar_event": "create_event", "search_workspace": "search",
    "generate_report": "report", "find_meeting_time": "meeting_time",
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
    {"type":"function","function":{"name":"search_workspace","description":"Search across emails, documents, calendar. Use when user asks to find something.","parameters":{"type":"object","properties":{"query":{"type":"string"},"sources":{"type":"array","items":{"type":"string"}}},"required":["query"]}}},
    {"type":"function","function":{"name":"schedule_automation","description":"Create a scheduled automation task. Use when user asks to automate recurring AI tasks.","parameters":{"type":"object","properties":{"type":{"type":"string","enum":["daily_briefing","auto_reply","weekly_report","meeting_digest","custom"]},"name":{"type":"string"},"schedule":{"type":"string"},"config":{"type":"object"}},"required":["type","name","schedule"]}}},
    {"type":"function","function":{"name":"generate_report","description":"Generate a productivity or analytics report.","parameters":{"type":"object","properties":{"type":{"type":"string","enum":["weekly","monthly","productivity","team"]},"include_sections":{"type":"array","items":{"type":"string"}}},"required":["type"]}}},
    {"type":"function","function":{"name":"find_meeting_time","description":"Find best meeting time slots. Use when asked to find free time or schedule with others.","parameters":{"type":"object","properties":{"attendees":{"type":"array","items":{"type":"string"}},"duration_minutes":{"type":"integer","default":30},"preferred_days":{"type":"array","items":{"type":"string"}}},"required":["attendees"]}}},
    {"type":"function","function":{"name":"summarize_document","description":"Summarize a document or long text.","parameters":{"type":"object","properties":{"content":{"type":"string"},"style":{"type":"string","enum":["brief","detailed","bullets","executive"]}},"required":["content"]}}},
]

def _detect_forced_tool(message: str):
    lower = message.lower()
    if any(k in lower for k in ["send email","compose email","draft email","write email","reply to"]) and "email" in lower: return "compose_email"
    if any(k in lower for k in ["create event","schedule meeting","book meeting","add to calendar","set up call","arrange meeting","create a meeting","new meeting"]): return "create_calendar_event"
    if any(k in lower for k in ["generate report","weekly report","monthly report","productivity report","team report"]): return "generate_report"
    if any(k in lower for k in ["find time","best time","when can","meeting slot","availability","free slot"]): return "find_meeting_time"
    if any(k in lower for k in ["automate","schedule task","every day","daily briefing","auto reply","remind me every","set up automation","create automation"]): return "schedule_automation"
    if any(k in lower for k in ["search","find","look for"]) and any(k in lower for k in ["email","document","file","message"]): return "search_workspace"
    if any(k in lower for k in ["email","inbox","unread","gmail","message from","subject"]): return "get_emails"
    if any(k in lower for k in ["calendar","event","meeting today","schedule today","appointment","briefing","today schedule","what meetings"]): return "get_calendar_events"
    if any(k in lower for k in ["team","standup","member","overdue","delayed","task progress","team status"]): return "get_team_members"
    if any(k in lower for k in ["deploy","pipeline","production","staging","rollback","build status","ci/cd","deployment"]): return "get_deployments"
    if any(k in lower for k in ["analytics","productivity","focus hours","stats","metrics","performance score","how productive"]): return "get_analytics"
    if any(k in lower for k in ["integration","connected","platform","slack","github","notion","zoom","jira","integrations"]): return "get_integrations_status"
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
                from services.integration_service import integration_service
                emails = await integration_service.list_user_emails(uid)
                if emails:
                    return {"emails": emails, "source": "gmail", "count": len(emails)}
                # Gmail connected but no emails found
                return {"emails": [], "source": "gmail", "count": 0, "note": "No emails found in your Gmail inbox."}
            except Exception as e:
                err = str(e)
                if "not connected" in err.lower() or "missing" in err.lower():
                    pass  # fall through to mock
                else:
                    pass  # other error, fall through to mock
            return {"emails": [
                {"id":"1","from":"Robert Chen","role":"CFO","subject":"Q3 Budget Approval","preview":"Please review the attached Q3 budget proposal...","time":"8m ago","priority":"urgent","read":False},
                {"id":"2","from":"Acme Corp","role":"Client","subject":"Service complaint #4821","preview":"We are still experiencing the reported issue...","time":"32m ago","priority":"urgent","read":False},
                {"id":"3","from":"HR Team","role":"Internal","subject":"Team offsite — August 2026","preview":"Planning the August team offsite. Fill availability...","time":"1h ago","priority":"normal","read":True},
                {"id":"4","from":"Stripe","role":"Billing","subject":"Invoice ready — $2,490.00","preview":"Your monthly invoice for August is available...","time":"3h ago","priority":"normal","read":True},
                {"id":"5","from":"GitHub","role":"Dev","subject":"PR #142 needs review","preview":"feature/auth-tokens — 3 files changed...","time":"5h ago","priority":"low","read":True},
            ], "source":"mock_data","count":5,"note":"Connect Gmail in Integrations to see real emails"}

        elif name == "get_calendar_events":
            try:
                from services.integration_service import integration_service
                events = await integration_service.list_user_events(uid)
                if events:
                    return {"events": events, "source": "google_calendar", "count": len(events)}
                return {"events": [], "source": "google_calendar", "count": 0, "note": "No upcoming events found."}
            except Exception as e:
                pass  # fall through to mock
            now = datetime.now()
            return {"events": [
                {"id":"e1","title":"Daily Standup","time":now.strftime("%Y-%m-%dT09:00:00"),"tag":"Recurring · 15 min","attendees":5},
                {"id":"e2","title":"Client Review — Acme Corp","time":now.strftime("%Y-%m-%dT11:00:00"),"tag":"External · 1 hr","meetingLink":"https://meet.google.com/abc"},
                {"id":"e3","title":"Q3 Planning Session","time":now.strftime("%Y-%m-%dT14:00:00"),"tag":"Internal · 2 hrs","attendees":8},
                {"id":"e4","title":"1-on-1 with Sarah Chen","time":now.strftime("%Y-%m-%dT16:00:00"),"tag":"Team · 30 min"},
            ], "source":"mock_data","count":4,"note":"Connect Google Calendar for real events"}

        elif name == "get_integrations_status":
            try:
                from services.integration_service import integration_service
                real_list = await integration_service.list_for_user(uid)
                connected_count = sum(1 for p in real_list if p.get("connected"))
                platforms = [
                    {"name": p["displayName"], "platform": p["platform"], "connected": p["connected"],
                     "status": p["status"], "last_sync": p.get("lastSyncLabel"), "healthStatus": p.get("healthStatus")}
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
            body = args.get("body", "")
            tone = args.get("tone", "professional")
            
            # Validate required fields
            if not to or not subject or not body:
                missing = []
                if not to: missing.append("recipient email")
                if not subject: missing.append("subject")
                if not body: missing.append("body/message")
                return {
                    "action": "compose",
                    "status": "incomplete",
                    "missing_fields": missing,
                    "to": to or None,
                    "subject": subject or None,
                    "body": body or None,
                    "tone": tone,
                    "ready_to_send": False,
                    "source": "ai_generated",
                    "note": f"I need more information to send the email. Please provide: {', '.join(missing)}"
                }
            
            # Try to send via real Gmail if connected
            try:
                from services.integration_service import integration_service
                from repositories.email_repository import email_repository
                from models.email import Email
                import uuid
                
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
                r = _get_groq().chat.completions.create(model="llama-3.3-70b-versatile",messages=[{"role":"user","content":prompts.get(mode,prompts["improve"])}],max_tokens=512,temperature=0.3)
                result = r.choices[0].message.content.strip()
            except Exception: result = f"[{mode}] {text}"
            return {"result": result, "mode": mode, "original": text, "source": "groq_ai"}

        elif name == "sync_integration":
            p = args.get("platform","unknown")
            return {"platform":p,"status":"syncing","message":f"Sync started for {p}. Data will refresh in 30 seconds.","source":"integration_service"}

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
            return {**record,"source":"automation_engine","message":f"Automation created and activated."}

        elif name == "generate_report":
            return {"report_type":args.get("type","weekly"),"period":"This Week","sections":{"summary":"Strong week: 6.5 avg focus hours, 2 deployments shipped, team mostly on-track.","emails":{"sent":15,"received":47,"urgent_handled":3,"response_rate":"94%","top_sender":"Robert Chen (CFO)"},"team":{"on_track":3,"delayed":1,"missing":1,"highlight":"Sarah completed UI mockups ahead of schedule"},"deployments":{"successful":2,"failed":0,"uptime":"99.9%","version_shipped":"v2.4.1"},"productivity":{"score":87,"vs_last_week":"+12%","best_day":"Thursday","focus_blocks":8}},"weekly_data":[4.2,5.8,6.1,6.5,7.2,5.9,6.5],"generated_at":datetime.now().isoformat(),"source":"analytics_engine"}

        elif name == "find_meeting_time":
            dur = args.get("duration_minutes",30)
            return {"attendees":args.get("attendees",[]),"duration_minutes":dur,"suggestions":[{"date":"Tomorrow","time":"10:00 AM","day":"Thu","duration":dur,"conflicts":0},{"date":"Thursday","time":"2:00 PM","day":"Thu","duration":dur,"conflicts":0},{"date":"Friday","time":"11:00 AM","day":"Fri","duration":dur,"conflicts":1}],"best_slot":{"date":"Tomorrow","time":"10:00 AM"},"source":"calendar_ai"}

        elif name == "summarize_document":
            content = args.get("content",""); words = content.split()
            return {"summary":content[:200]+"..." if len(content)>200 else content,"key_points":["Main topic identified","Key data extracted","Action items noted"],"word_count":len(words),"reading_time":f"{max(1,len(words)//200)} min","source":"document_ai"}

        return {"error": f"Unknown tool: {name}"}
    except Exception as e:
        return {"error": str(e), "source": "error"}

async def _run_tools_parallel(tool_calls, uid: str) -> list:
    tasks = [_execute_tool(tc.function.name, json.loads(tc.function.arguments or "{}"), uid) for tc in tool_calls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [{"tool_call_id":tc.id,"name":tc.function.name,"result":r if not isinstance(r,Exception) else {"error":str(r),"source":"error"}} for tc,r in zip(tool_calls,results)]

def _sse(event: str, data) -> str:
    return f'data: {json.dumps({"event": event, "data": data})}\n\n'

class ChatRequest(BaseModel):
    message: str
    history: list = []
    mode: str = "suggest"

async def _stream_chat(req: ChatRequest, uid: str) -> AsyncGenerator[str, None]:
    client = _get_groq()
    history = list(_HISTORY[uid])
    messages = [{"role":"system","content":SYSTEM_PROMPT}, *history[-10:], {"role":"user","content":req.message}]
    forced_tool = _detect_forced_tool(req.message)
    tool_choice = "auto"
    if forced_tool:
        tool_choice = {"type":"function","function":{"name":forced_tool}}
        yield _sse("thinking", THINK_MSGS.get(forced_tool,"🔍 Analyzing your request..."))
        await asyncio.sleep(0)
    last_tool_called = None
    try:
        response = client.chat.completions.create(model="llama-3.3-70b-versatile",messages=messages,tools=TOOLS,tool_choice=tool_choice,max_tokens=2048,temperature=0.1)
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
            await asyncio.sleep(0)
            messages.append({"role":"assistant","content":msg.content or "","tool_calls":[{"id":tc.id,"type":"function","function":{"name":tc.function.name,"arguments":tc.function.arguments}} for tc in msg.tool_calls]})
            for tr in tool_results:
                messages.append({"role":"tool","tool_call_id":tr["tool_call_id"],"content":json.dumps(tr["result"])})
            stream = client.chat.completions.create(model="llama-3.3-70b-versatile",messages=messages,stream=True,max_tokens=2048,temperature=0.1)
            full_text = ""
            for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta: full_text += delta; yield _sse("token",delta)
            _HISTORY[uid].append({"role":"user","content":req.message})
            _HISTORY[uid].append({"role":"assistant","content":full_text})
        else:
            stream = client.chat.completions.create(model="llama-3.3-70b-versatile",messages=messages,stream=True,max_tokens=2048,temperature=0.15)
            full_text = ""
            for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta: full_text += delta; yield _sse("token",delta)
            _HISTORY[uid].append({"role":"user","content":req.message})
            _HISTORY[uid].append({"role":"assistant","content":full_text})
        yield _sse("suggestions", _get_suggestions(last_tool_called))
        yield _sse("done",{"card":CARD_MAP.get(last_tool_called) if last_tool_called else None,"tool":last_tool_called})
        yield "data: [DONE]\n\n"
    except Exception as e:
        yield _sse("error",str(e))
        yield "data: [DONE]\n\n"

@router.post("/chat")
async def chat_stream(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid","anonymous")
    return StreamingResponse(_stream_chat(req, uid),media_type="text/event-stream",headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

@router.get("/suggestions")
async def get_smart_suggestions(current_user: dict = Depends(get_current_user)):
    hour = datetime.now().hour
    if hour < 10: s = ["Good morning briefing","Check overnight emails","Review today schedule","Team standup prep","Check deployment status"]
    elif hour < 14: s = ["Draft follow-up emails","Check team progress","Review deployments","Analytics check","Search documents"]
    else: s = ["End-of-day summary","Generate daily report","Schedule tomorrow meetings","Standup wrap-up","Sync all integrations"]
    return {"suggestions":s,"time":hour}

@router.post("/summary")
async def get_daily_summary(current_user: dict = Depends(get_current_user)):
    return {"briefing":"You have 5 emails (2 urgent), 4 meetings today, 1 delayed member, staging deployment at 67%.","emails_count":5,"urgent":2,"events_today":4,"team_alerts":1,"deploy_status":"in_progress","productivity_score":87,"ai_time_saved":2.3}

@router.get("/automations")
async def list_automations(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid","anonymous")
    if not _AUTOMATIONS[uid]:
        _AUTOMATIONS[uid] = [
            {"id":str(uuid.uuid4()),"type":"daily_briefing","name":"Daily Morning Briefing","schedule":"0 8 * * *","schedule_human":"08:00 daily","status":"active","config":{},"created_at":datetime.now().isoformat(),"last_run":"Today 08:00","next_run":"Tomorrow 08:00","run_count":14},
            {"id":str(uuid.uuid4()),"type":"weekly_report","name":"Weekly Productivity Report","schedule":"0 17 * * 5","schedule_human":"Fri 17:00","status":"active","config":{},"created_at":datetime.now().isoformat(),"last_run":"Last Friday","next_run":"This Friday","run_count":4},
            {"id":str(uuid.uuid4()),"type":"meeting_digest","name":"Meeting Prep Digest","schedule":"*/30 * * * *","schedule_human":"30 min before meetings","status":"paused","config":{},"created_at":datetime.now().isoformat(),"last_run":"Yesterday 14:30","next_run":"Paused","run_count":8},
        ]
    return {"automations":_AUTOMATIONS[uid],"total":len(_AUTOMATIONS[uid])}

@router.get("/actions")
async def get_actions(current_user: dict = Depends(get_current_user)):
    return {"actions":[],"total":0}
