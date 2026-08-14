# AI Cockpit Chatbot — Implementation Plan

> **Project**: WorkPilot AI  
> **Component**: AI Cockpit (`/api/v1/ai/chat` + `AICockpit.jsx`)  
> **Engineer Standard**: Production-grade — typed, tested, documented, secure  
> **Last Updated**: 2026-08-09

---

## 1. Project Vision

WorkPilot AI's chatbot is not a simple Q&A bot. It is an **AI Chief of Staff** — a proactive, context-aware agent that:

- Has **real-time access** to the user's Gmail, Calendar, GitHub, Slack, Jira, Notion, Zoom
- Takes **real actions** (send email, create events, post to Slack)
- Learns **user preferences** across sessions
- Surfaces **proactive intelligence** (alerts, priorities, suggestions)
- Executes **multi-step workflows** across platforms

The chatbot must feel like a senior executive assistant — concise, precise, and always actionable.

---

## 2. Current State (Completed)

### Backend (`backend/api/v1/endpoints/ai_chat.py`)
| Feature | Status |
|---|---|
| Groq LLM integration (llama-3.3-70b) | ✅ Done |
| Streaming SSE responses | ✅ Done |
| Tool calling framework | ✅ Done |
| `get_emails` tool (real Gmail) | ✅ Done |
| `get_calendar_events` tool (real Google Calendar) | ✅ Done |
| `get_team_members` tool | ✅ Done |
| `get_deployments` tool | ✅ Done |
| `get_analytics` tool | ✅ Done |
| `get_integrations_status` tool | ✅ Done |
| `sync_integration` tool | ✅ Done |
| `compose_email` tool (form card trigger) | ✅ Done |
| `improve_text` tool (rephrase/fix/tone) | ✅ Done |
| In-memory conversation history | ✅ Done |
| Fallback keyword responses (no API key) | ✅ Done |

### Frontend (`Frontend/src/components/AICockpit.jsx`)
| Feature | Status |
|---|---|
| Streaming chat UI | ✅ Done |
| Tool status badges | ✅ Done |
| Markdown bold/italic rendering | ✅ Done |
| `RealEmailsCard` (real Gmail data) | ✅ Done |
| `RealCalendarCard` (real calendar data) | ✅ Done |
| `ComposeEmailCard` with AI writing assistant | ✅ Done |
| Voice input (SpeechRecognition) | ✅ Done |
| Pinned prompts | ✅ Done |
| Conversation search | ✅ Done |
| Hardcoded demo cards (EmailCard, TeamCard, DeployCard) | ✅ Done |

---

## 3. Implementation Phases

### Phase 1 — Real Actions (P0 — Highest Impact)

**Goal**: The AI doesn't just talk about actions — it actually executes them.

#### 1.1 Send Email via Gmail API
**Files**:
- `backend/api/v1/endpoints/ai_chat.py` — add `send_gmail_email` tool
- `backend/services/integration_service.py` — add `send_user_email(uid, to, subject, body)`
- `Frontend/src/components/ComposeEmailCard.jsx` — wire Send button to real API

**Implementation**:
```python
# Tool definition
{
    "name": "send_gmail_email",
    "description": "Actually send an email via Gmail API after user confirms in compose form",
    "parameters": {
        "to": "string",
        "subject": "string", 
        "body": "string",
        "thread_id": "string (optional, for replies)"
    }
}

# Service method
async def send_user_email(uid: str, to: str, subject: str, body: str, thread_id: str = None) -> Dict:
    record = await integration_repository.get(uid, "gmail")
    token = await self._get_valid_google_token(uid, "gmail", record)
    # POST to https://gmail.googleapis.com/gmail/v1/users/me/messages/send
    # with RFC 2822 formatted message
```

**Quality gates**:
- Token refresh before send
- Error handling: invalid address, quota exceeded, auth expired
- Audit log entry on send
- Frontend shows success/failure toast

---

#### 1.2 Create Calendar Event
**Files**:
- `backend/api/v1/endpoints/ai_chat.py` — add `create_calendar_event` tool
- `backend/services/integration_service.py` — add `create_user_event(uid, title, start, end, attendees, description)`

**Implementation**:
```python
# Tool — AI extracts from natural language: "schedule standup with John tomorrow 10am"
{
    "name": "create_calendar_event",
    "description": "Create a Google Calendar event. Extract details from user message.",
    "parameters": {
        "title": "string",
        "start_datetime": "ISO 8601 string",
        "end_datetime": "ISO 8601 string", 
        "attendees": "list of emails",
        "description": "string",
        "add_meet_link": "boolean"
    }
}
```

**Quality gates**:
- Parse relative dates ("tomorrow", "next Monday", "in 2 hours") correctly
- User timezone from preferences or UTC fallback
- Confirmation card shown before creating
- Google Meet link generation if `add_meet_link=true`

---

#### 1.3 Reply to Email
**Files**:
- `backend/services/integration_service.py` — add `reply_to_email(uid, message_id, body)`

**Quality gates**:
- Thread ID preserved (Gmail threading)
- Reply-To header handled correctly
- Original message context shown in compose card

---

#### 1.4 Send Slack Message
**Files**:
- `backend/api/v1/endpoints/ai_chat.py` — add `send_slack_message` tool
- `backend/agents/communication_agent.py` — implement real Slack Web API call

**Quality gates**:
- Channel list fetched from Slack to show picker
- Message preview before sending
- Handles DMs vs channels

---

### Phase 2 — Memory & Context (P1 — High Value)

**Goal**: The AI remembers across sessions and learns user preferences.

#### 2.1 Persistent Conversation History
**Problem**: `_history` dict is in-memory — lost on server restart.  
**Solution**: Store in Firestore under `chat_history/{uid}/messages[]`

**Files**:
- `backend/repositories/chat_repository.py` — new repository
- `backend/api/v1/endpoints/ai_chat.py` — replace `_history` deque with Firestore calls

**Schema**:
```
chat_history/{uid}/
  - messages: [
      { role: "user"|"assistant", content: str, timestamp: datetime, tool_calls: [...] }
    ]
  - last_updated: datetime
  - message_count: int
```

**Quality gates**:
- Max 50 messages stored per user
- Load last 10 for context on each request
- History cleared on explicit "clear chat" action

---

#### 2.2 User Preferences & Personality Memory
**Files**:
- `backend/repositories/user_repository.py` — add `get_ai_preferences(uid)` / `save_ai_preferences(uid, prefs)`
- `backend/api/v1/endpoints/ai_chat.py` — inject preferences into system prompt

**Schema**:
```
ai_preferences/{uid}/
  - preferred_tone: "professional" | "friendly" | "brief"
  - timezone: "Asia/Kolkata"
  - primary_email: "sy985798@gmail.com"
  - key_contacts: { "Robert Chen": "CFO, Finance team" }
  - working_hours: { start: "09:00", end: "18:00" }
  - auto_brief_enabled: boolean
```

**Quality gates**:
- Preferences injected into every system prompt
- AI infers and suggests preferences over time
- User can view/edit preferences in Settings

---

#### 2.3 Daily Brief Auto-Generation
**Files**:
- `backend/api/v1/endpoints/ai_chat.py` — add `get_daily_brief` tool
- `Frontend/src/components/AICockpit.jsx` — `DailyBriefCard` component

**Implementation**:
```python
async def _generate_daily_brief(uid: str) -> dict:
    # Parallel fetch: emails + calendar + team + deployments
    emails, events, team, deployments = await asyncio.gather(
        integration_service.list_user_emails(uid),
        integration_service.list_user_events(uid),
        get_team_data(uid),
        get_deployment_data(uid),
    )
    # Return structured brief
    return {
        "urgent_emails": [e for e in emails if e["priority"] == "urgent"],
        "today_events": events[:3],
        "blocked_tasks": [t for t in team if t["status"] in ("delayed", "missing")],
        "deploy_alerts": [d for d in deployments if d["status"] != "live"],
    }
```

**Quality gates**:
- Shown automatically on first message of the day
- Cached in Firestore for 4 hours
- AI formats it as structured brief card, not text dump

---

### Phase 3 — Smart Workflows (P1 — Differentiating Feature)

**Goal**: Cross-platform automation triggered by natural language.

#### 3.1 Workflow Engine
**Files**:
- `backend/services/workflow_engine.py` — new service
- `backend/api/v1/endpoints/ai_chat.py` — add `execute_workflow` tool

**Supported Workflows**:

| Workflow ID | Trigger Example | Steps |
|---|---|---|
| `email_to_github_issue` | "Create GitHub issue from the Neon email" | get_email → create_issue |
| `meeting_summary_to_slack` | "Post today's meeting summary to #general" | get_events → format_summary → send_slack |
| `email_reply_bulk` | "Reply to all urgent emails saying I'll respond by EOD" | get_urgent_emails → draft_replies → send_all |
| `standup_report` | "Generate and post standup" | get_team → format_standup → send_slack |
| `pr_review_email` | "Email me pending PRs needing review" | get_github_prs → compose_email → send |

**Quality gates**:
- Each workflow step shown to user before execution
- Rollback supported for reversible steps
- Audit log entry per workflow execution

---

#### 3.2 Smart Follow-up Chips
After every AI response, show 2-3 contextual action chips:

```jsx
// Example after email fetch:
<ActionChips suggestions={[
  { label: "Reply to all urgent", action: "reply_all_urgent" },
  { label: "Create task from Neon email", action: "email_to_task" },
  { label: "Summarize for standup", action: "email_summary" }
]} />
```

**Files**:
- `Frontend/src/components/ActionChips.jsx` — new component
- `backend/api/v1/endpoints/ai_chat.py` — include `suggestions[]` in SSE `done` event

---

### Phase 4 — Richer UI Cards (P2)

#### 4.1 CalendarCreateCard
Full event creation form with date/time picker:
```jsx
// Fields: Title, Date (picker), Start time, End time, 
//         Attendees (email chips), Description, Add Meet link toggle
```

#### 4.2 GitHubPRCard
```
┌─ Pull Requests ─────────────────────────┐
│ #142  feat: auth-tokens  ● Review needed│
│ #139  fix: email parser  ✓ Approved     │
│ #136  chore: deps        ⏳ In CI       │
│ [Review #142]  [View All PRs]           │
└─────────────────────────────────────────┘
```

#### 4.3 SlackComposeCard
Channel picker + thread context + message preview before sending.

#### 4.4 AnalyticsCard
Real sparklines and ring charts from actual integration data.

#### 4.5 TeamRealDataCard
Pull actual task statuses from Jira/GitHub — replace hardcoded mock data.

---

### Phase 5 — Proactive Intelligence (P2)

#### 5.1 Background Alert Engine
- Runs on a schedule (or on user login)
- Scans: overdue emails, stale PRs, missed standups, expiring tokens
- Pushes alerts as AI messages when user opens cockpit

#### 5.2 Priority Scoring Engine
Assign urgency scores to emails/tasks:
```python
def score_priority(item: dict) -> str:
    # Signals: sender_is_manager, has_deadline, contains_urgent_keywords,
    #          reply_time_exceeded, mentions_client_name
    score = 0
    if is_manager(item["from"]): score += 30
    if has_deadline_keywords(item["subject"]): score += 25
    if item["is_unread"] and item["age_hours"] > 4: score += 20
    return "urgent" if score > 50 else "high" if score > 30 else "normal"
```

#### 5.3 Proactive Suggestions
AI learns from patterns:
- "You usually reply to Robert Chen within 1 hour — this email is now 3h old"
- "Sprint ends Friday — 4 tasks not started"
- "Deploy v2.4.2 has been in staging for 48h without promotion"

---

### Phase 6 — Power Features (P3)

#### 6.1 File Understanding
- User drags PDF/image/CSV into chat
- AI extracts key information, action items, summaries
- Integration with Google Drive for file access

#### 6.2 Autopilot Scheduled Actions
- User defines rules: "Every weekday 9am: send me a morning brief"
- Stored in Firestore, executed by a background job
- Firebase Cloud Functions or a cron endpoint

#### 6.3 Multi-Agent Chaining
- Complex request: "Handle my morning routine"
- AI decomposes into subtasks, executes in parallel with approval gates
- Uses the `MasterIntegrationAgent` from the integration spec

#### 6.4 Voice Output (TTS)
- Optional: read AI responses aloud
- Browser Web Speech API (free) or ElevenLabs (high quality)

---

## 4. Engineering Standards

### Backend
- All new tools must have input validation via Pydantic models
- All external API calls wrapped in try/except with specific error types
- Token refresh checked before every API call (use `_get_valid_google_token`)
- All actions logged to `audit_logs` Firestore collection
- New tools added to TOOLS list with precise descriptions (Groq prompt quality depends on this)
- No silent `except: pass` — always log with `print(f"[AI Tool] {name} failed: {e}")`

### Frontend
- New card components in `Frontend/src/components/` — one file per card
- All cards receive `data` prop (from toolResult), `T` (theme), `onDismiss`
- Cards never have hardcoded strings — all content comes from props
- Loading states for all async operations
- Error states shown inline in card (not alert popups)

### Testing
- Each new tool must have a corresponding test in `backend/tests/unit/agents/`
- Frontend card components tested with mock data in isolation
- Integration tests cover the full tool → card render flow

### Security
- Never log access tokens, even partially
- Email sends require explicit user confirmation (never auto-send)
- Workflow execution requires per-step user approval in suggest/ask modes
- Rate limit AI endpoint: 60 requests/minute per user

---

## 5. File Change Map

```
backend/
├── api/v1/endpoints/
│   └── ai_chat.py              # Add tools: send_gmail_email, create_calendar_event,
│                               # reply_to_email, send_slack_message, get_daily_brief,
│                               # execute_workflow
├── services/
│   ├── integration_service.py  # Add: send_user_email, reply_to_email,
│   │                           # create_user_event, get_daily_brief
│   └── workflow_engine.py      # NEW — workflow definitions and executor
├── repositories/
│   └── chat_repository.py      # NEW — Firestore chat history CRUD
└── models/
    └── chat.py                 # NEW — ChatMessage, DailyBrief, WorkflowResult

Frontend/src/
├── components/
│   ├── ComposeEmailCard.jsx    # EXISTING — wire Send button to real API
│   ├── CalendarCreateCard.jsx  # NEW — event creation form with date picker
│   ├── GitHubPRCard.jsx        # NEW — PR list with actions
│   ├── SlackComposeCard.jsx    # NEW — Slack message form
│   ├── DailyBriefCard.jsx      # NEW — structured morning brief
│   ├── ActionChips.jsx         # NEW — follow-up action suggestions
│   └── AnalyticsCard.jsx       # NEW — real charts from live data
└── hooks/
    └── useAIChat.js            # NEW — extract chat logic from AICockpit.jsx
```

---

## 6. Priority Implementation Order

```
Week 1 (Core Actions):
  Day 1-2: Send real email (Gmail API)
  Day 3:   Create calendar event (Google Calendar API)  
  Day 4:   Reply to email
  Day 5:   Persistent history (Firestore)

Week 2 (Intelligence):
  Day 1-2: Daily brief + DailyBriefCard
  Day 3:   Smart follow-up ActionChips
  Day 4:   User preferences memory
  Day 5:   Send Slack message

Week 3 (Workflows):
  Day 1-2: Workflow engine + email_to_github_issue
  Day 3:   meeting_summary_to_slack workflow
  Day 4:   CalendarCreateCard UI
  Day 5:   GitHubPRCard + real PR data

Week 4 (Polish):
  Day 1-2: TeamRealDataCard (Jira/GitHub data)
  Day 3:   Priority scoring engine
  Day 4:   Proactive alerts
  Day 5:   Testing + bug fixes
```

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Real emails fetched successfully | 100% when Gmail connected |
| Email send success rate | > 99% |
| Tool call latency (p95) | < 2s |
| Conversation history persisted | 100% |
| Zero hardcoded mock data in AI responses | ✅ |
| All actions audited | ✅ |
| No access tokens in logs | ✅ |

---

## 8. Notes for Implementation

1. **Tool descriptions matter** — Groq chooses tools based on description quality. Keep them specific and verb-first ("Fetch...", "Create...", "Send...").

2. **Always stream** — Users expect to see the AI typing. Never use non-streaming calls for chat responses.

3. **Confirm before acting** — In `suggest` and `ask` modes, show confirmation before send/create/delete. Only `autopilot` mode skips confirmation.

4. **Card > Text** — Whenever structured data is available, show a card. Text responses are for conversational/explanatory content only.

5. **Graceful degradation** — If an integration is not connected, AI should say "Gmail isn't connected yet — go to Integrations to connect it" rather than failing silently.

6. **The AI is the user's agent** — Every feature should save the user time. If a feature requires more effort than doing it manually, don't build it.
