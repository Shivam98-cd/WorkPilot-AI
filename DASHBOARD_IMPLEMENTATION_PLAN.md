# WorkPilot AI — User Dashboard Review & Implementation Plan

> **Last updated:** 2026-08-03  
> **Scope:** Full user dashboard (`Dashboard.jsx`, `Pages.jsx`, `AICockpit.jsx`) + backend APIs  
> **Related docs:** `implementation_plan.md` (UI redesign), `INTEGRATIONS_ARCHITECTURE.md` (OAuth/connect flow)

---

## 1. Executive Summary

The user dashboard is **visually rich and feature-complete as a prototype**, but most sections still run on **hardcoded mock data** in the frontend. Backend endpoints exist for all major areas, but only **Email, Calendar, Deployments** partially pull real data when integrations are connected. The **agent layer** (`DataFetchAgent`, `IntegrationAgent`, etc.) is scaffolded but **not wired into dashboard widgets**.

| Layer | Maturity | Notes |
|-------|----------|-------|
| **UI shell** (sidebar, topbar, nav) | 🟢 High | Collapsible sidebar, themes, keyboard shortcuts |
| **Home widgets** | 🟡 Medium | Polished UI, static data |
| **Workspace pages** | 🟡 Medium | API calls + mock fallback |
| **Integrations** | 🟡 Medium | OAuth flow started, needs credentials |
| **AI Cockpit** | 🟡 Medium | SSE streaming, keyword intents — no LLM |
| **Backend data** | 🔴 Low | Mostly in-memory seeds |
| **Agent orchestration** | 🔴 Low | Initialized but unused by widgets |

---

## 2. Dashboard Layout Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (64px collapsed / 220px expanded)                                │
│  MAIN: Dashboard · Chat with AI                                        │
│  WORKSPACE: Email · Calendar · Team · Deployments · Documents            │
│  ACCOUNT: Analytics · Integrations · Settings                            │
├──────────────────────────────────────────────────────────────────────────┤
│ TOPBAR: Search (⌘K) · Notifications · User menu                          │
├──────────────────────────────────────────────────────────────────────────┤
│ CONTENT (switches by activeNav)                                          │
│  ├─ dashboard → Greeting band + Command bar + Widget grid               │
│  ├─ email/calendar/team/... → Pages.jsx full-page views                 │
│  └─ chat → opens AICockpit (via App.jsx view switch)                    │
├──────────────────────────────────────────────────────────────────────────┤
│ FAB: Floating chat bubble (dashboard only)                               │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Section-by-Section Review

### 3.1 Shell — Sidebar, Topbar, Navigation

| Component | Current state | Data source | Issues |
|-----------|---------------|-------------|--------|
| Collapsible sidebar | ✅ 64px/220px, tooltips, sections | Static `NAV_SECTIONS` | Mobile → bottom tab bar (partial CSS only) |
| Theme switcher | ✅ blue/purple/green | `localStorage` | Not synced to backend user preferences |
| Role pill (Manager) | ✅ UI only | `localStorage` | No RBAC backend enforcement |
| Search bar | ✅ UI | None | No global search API |
| Notifications dropdown | ✅ UI | `NOTIFS_DATA` hardcoded | No `/notifications` API |
| User menu | ✅ Sign out works | Firebase + `backendLogout` | Profile not loaded from API |
| Keyboard shortcuts | ✅ G+D, G+E, ⌘K, ? | Local | Good |

**Backend needed:**
- `GET /notifications` — user alerts from email/team/deploy webhooks
- `GET/PUT /users/profile` — theme, role, preferences (partially exists)
- `GET /search?q=` — cross-entity search (emails, docs, team)

**Recommended add-ons:**
- Unread badge counts on nav items (email count, deploy status dot)
- “Connect Gmail” CTA in sidebar when integration missing
- Persist sidebar collapsed state (currently not saved)

---

### 3.2 Home Dashboard — Greeting & Command Bar

| Component | Current state | Data source | Issues |
|-----------|---------------|-------------|--------|
| Greeting band | ✅ “Good morning, {name}” + date | Firebase user | Static alert pills |
| Alerts ribbon | ✅ Dismissible pills | `ALERTS` hardcoded | Not derived from real urgent items |
| Command bar | ✅ Opens AI Cockpit on Enter | Local | Does not pass command text to cockpit |
| Quick chips | ✅ 4 presets | Hardcoded | Should call AI with preset prompts |

**Backend needed:**
- `GET /dashboard/alerts` — aggregate urgent emails, overdue tasks, deploy blockers
- `GET /dashboard/greeting` — personalized summary (or use SummarizerAgent output)

**Recommended add-ons:**
- Wire `state.dailyBrief` from `SummarizerAgent` into briefing widget (agent exists, widget uses static bullets)
- Pass `cmdVal` to AICockpit as initial message
- Time-of-day greeting (morning/afternoon/evening)

---

### 3.3 Home Widget — Email

| UI | Static `EMAILS_DATA` (3 items) | API exists: `GET /emails` |
|----|-------------------------------|---------------------------|

**Frontend file:** `Dashboard.jsx` → `WIDGETS.email`  
**Backend:** `emails.py` — Gmail via `integration_service.list_user_emails()` or mock seed  
**Workspace page:** `EmailPage` — ✅ calls `getEmails()`, falls back to `EMAILS` constant

| Gap | Fix |
|-----|-----|
| Widget uses hardcoded data | Fetch from `data.emails` (agent state) or `getEmails()` |
| “Draft All” / “Reply” buttons | Wire to `draftEmail()`, open cockpit with context |
| No “connect Gmail” empty state | Check integrations status, show CTA |

**Backend add-ons:**
- `POST /emails/send` — send via Gmail API
- Gmail push sync (Pub/Sub)
- Priority scoring via AI

---

### 3.4 Home Widget — Schedule (Calendar)

| UI | Static `MEETINGS_DATA` | API: `GET /calendar/events` |
|----|------------------------|-------------------------------|

**Frontend:** Timeline blocks with duration-based height ✅ (redesign done)  
**Backend:** Google Calendar via integration or mock seed

| Gap | Fix |
|-----|-----|
| Widget not API-connected | Use `getCalendarEvents()` in agent or widget mount |
| “+ Schedule with AI” | Open cockpit with calendar intent or `createCalendarEvent()` |

**Backend add-ons:**
- Free/busy lookup for scheduling AI
- Zoom/Meet link creation on event create

---

### 3.5 Home Widget — Stats

| UI | Hardcoded counters (86, 142, 32, 45h) | API: `GET /analytics/summary` |
|----|----------------------------------------|---------------------------------|

**Backend:** Static computed seed in `analytics.py` — not user-specific history

| Gap | Fix |
|-----|-----|
| Widget ignores analytics API | Bind to `getAnalytics()` response |
| Sparklines use random data | Use `weekly_data` from API |
| No radial focus ring (redesign) | Optional UI enhancement |

**Backend add-ons:**
- Firestore `user_analytics` — track daily focus hours, emails handled
- Background job to aggregate from activity logs

---

### 3.6 Home Widget — Team

| UI | Static `TEAM_DATA` | API: `GET /team/members` |
|----|-------------------|---------------------------|

**Backend:** In-memory seed only — no Jira/Slack/HRIS integration

| Gap | Fix |
|-----|-----|
| Widget not API-connected | Fetch team members on dashboard load |
| Remind / Follow up buttons | `POST /team/members/{id}/nudge` → Slack/email |

**Backend add-ons:**
- Jira sprint integration for real task progress
- Slack standup bot ingestion
- `PUT /team/members/{id}` already exists — wire from Team page edits

---

### 3.7 Home Widget — Deployments

| UI | Animated `deployPct` (fake timer) | API: `GET /deployments` |
|----|-----------------------------------|-------------------------|

**Backend:** GitHub repos via integration or static pipelines mock

| Gap | Fix |
|-----|-----|
| Progress bar is simulated | Poll GitHub Actions workflow status |
| Rollback button | `POST /deployments/{id}/rollback` (GitHub API) |

**Backend add-ons:**
- Webhook: `POST /webhooks/github` for workflow_run events
- Real pipeline stages from CI provider

---

### 3.8 Home Widget — Morning Briefing

| UI | Static 3 bullet points | Agent: `SummarizerAgent` |
|----|------------------------|--------------------------|

**Backend:** Summarizer calls `/ai/summary` — **endpoint may not exist** (agent uses wrong path)

| Gap | Fix |
|-----|-----|
| Widget ignores `state.dailyBrief` | Render `state.dailyBrief` from SummarizerAgent |
| Summarizer API path | Add `POST /ai/summary` or fix agent to use existing endpoint |
| Dismiss X button | Hide widget via localStorage |

---

### 3.9 Home Widget — AI Actions Log

| UI | Static `AI_ACTIONS_DATA` | No backend |
|----|--------------------------|------------|

**Backend needed (new):**
- `GET /ai/actions` — audit log of AI-executed actions
- `POST /ai/actions/{id}/undo` — reverse reversible actions

**Recommended add-ons:**
- Link to audit_service / Firestore `ai_actions` collection
- Filter by date, type, status

---

### 3.10 Home Widget — Documents

| UI | Static 4 files | API: `GET /documents` |
|----|---------------|------------------------|

**Backend:** In-memory upload store — lost on restart

| Gap | Fix |
|-----|-----|
| Widget not API-connected | Fetch documents list |
| Drop zone | Wire to `uploadDocument()` |
| Ask AI | Wire to `askDocumentAI()` — simulated response today |

**Backend add-ons:**
- Firebase Storage or S3 for file persistence
- Vector store + RAG for real document Q&A
- PDF/DOCX text extraction service

---

### 3.11 Workspace Page — Email (`EmailPage`)

| Status | 🟡 Partial |
|--------|------------|

- ✅ API fetch on mount, skeleton loading, error state
- ✅ Mark read, draft reply buttons
- ✅ Inbox tabs (UI only — no filter logic)
- ❌ Sent/drafts/archived tabs use same data
- ❌ Compose not implemented

**Backend:** `emails.py` — get, draft, mark read ✅

---

### 3.12 Workspace Page — Calendar (`CalendarPage`)

| Status | 🟡 Partial |

- ✅ Week grid UI, event list, create event API call
- ❌ Events not proportional to all durations in grid
- ❌ No Google Calendar write-back

**Backend:** `calendar.py` — get/post events ✅

---

### 3.13 Workspace Page — Team (`TeamPage`)

| Status | 🟡 Partial |

- ✅ Table with filters, progress bars, status dots
- ✅ `getTeamMembers()` + `updateTeamMember()`
- ❌ All data is mock seed

**Backend:** `team.py` — in-memory only

---

### 3.14 Workspace Page — Deployments (`DeploymentsPage`)

| Status | 🟡 Partial |

- ✅ Pipeline selector, logs panel
- ✅ `getDeployments()` + `getDeploymentLogs()`
- ❌ GitHub integration returns repos, not CI pipelines shape frontend expects

**Backend:** Needs response shape adapter for frontend

---

### 3.15 Workspace Page — Documents (`DocumentsPage`)

| Status | 🟡 Partial |

- ✅ Upload, list, Ask AI button
- ❌ No persistent storage
- ❌ AI answers are simulated strings

---

### 3.16 Workspace Page — Analytics (`AnalyticsPage`)

| Status | 🟡 Partial |

- ✅ Metrics cards, bar chart, time breakdown
- ✅ `getAnalytics()` wired
- ❌ Static seed data, not real user activity

---

### 3.17 Account Page — Integrations (`IntegrationsPage`)

| Status | 🟡 In progress |

- ✅ Loads from API with fallback catalog
- ✅ OAuth authorize flow (Gmail, GitHub when creds set)
- ✅ Disconnect, sync, request integration
- ❌ Requires backend running + OAuth app credentials

**See:** `INTEGRATIONS_ARCHITECTURE.md`

---

### 3.18 Account Page — Settings (`SettingsPage`)

| Status | 🔴 Mostly mock |

- ✅ Profile, notifications, AI mode, security, billing tabs (UI)
- ❌ Save profile → setTimeout mock (not `updateProfile()`)
- ❌ Billing/security placeholders

**Backend:** `users.py` — profile GET/PUT exists, wire frontend

---

### 3.19 AI Cockpit (`AICockpit.jsx`)

| Status | 🟡 Partial |

- ✅ Full-screen chat UI, modes (autopilot/suggest/ask)
- ✅ Pinned prompts, left panel, streaming via SSE
- ✅ Rich cards (email, team, deploy, calendar)
- ✅ `/ai/chat` backend with keyword intent matching
- ❌ No real LLM (OpenAI/Gemini/Claude)
- ❌ No conversation persistence
- ❌ No tool calling to execute actions

**Backend:** `ai_chat.py` — SSE stream, bounded context deque

**Backend add-ons:**
- LLM provider abstraction (`services/llm_service.py`)
- Tool definitions: send_email, create_event, get_team_status
- `GET/POST /ai/conversations` for history

---

### 3.20 Floating Chat (Dashboard mini-window)

| Status | 🔴 Mock |

- Local `CHAT_INIT` messages, setTimeout fake replies
- Does not use `/ai/chat` SSE like AICockpit

**Fix:** Reuse AICockpit chat hook or call same API

---

## 4. Agent Layer Review

| Agent | Purpose | Wired to UI? |
|-------|---------|--------------|
| `StateManagerAgent` | Global state init | ⚠️ Partial (`state.dailyBrief` unused in briefing widget) |
| `DataFetchAgent` | Dashboard data fetch | ❌ Returns mock only, not API |
| `IntegrationAgent` | Auth sync + parallel fetch | ⚠️ Runs on mount but widgets ignore `data` |
| `UIUpdateAgent` | DOM refs / UI state | ❌ Scaffold only |
| `SummarizerAgent` | Daily brief | ⚠️ Runs but widget shows static text |
| `MasterAgent` | Orchestrator | ❌ Not imported in Dashboard |

**Critical fix:** Single dashboard bootstrap that:
1. Calls all APIs in parallel (like `IntegrationAgent.fetchDashboardData`)
2. Maps responses into widget props
3. Removes duplicate hardcoded constants in `Dashboard.jsx`

---

## 5. Backend Architecture (Target)

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND DASHBOARD                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ JWT (wp_tokens)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  API Layer (FastAPI)                                         │
│  /dashboard/summary  /emails  /calendar  /team  /deployments│
│  /documents  /analytics  /integrations  /ai/chat  /users    │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ Service Layer │  │ Integration Svc │  │ AI Service (LLM) │
│ email_service │  │ OAuth + tokens  │  │ tools + stream   │
│ team_service  │  │ provider adapters│  │                  │
└───────┬───────┘  └────────┬────────┘  └────────┬─────────┘
        │                   │                     │
        ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Firestore (+ in-memory dev fallback)                        │
│  users · user_integrations · emails_cache · ai_actions · …  │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  External: Gmail · GCal · GitHub · Slack · Zoom · LLM API   │
└─────────────────────────────────────────────────────────────┘
```

### New backend endpoints to add

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `GET /dashboard/summary` | Single call: alerts, brief, widget counts | P0 |
| `POST /ai/summary` | Daily brief generation | P0 |
| `GET /ai/actions` | AI action audit log | P1 |
| `POST /ai/actions/{id}/undo` | Undo reversible action | P2 |
| `GET /notifications` | Notification feed | P1 |
| `GET /search` | Global search | P2 |
| `POST /emails/send` | Send email via Gmail | P1 |
| `POST /webhooks/github` | Deploy status realtime | P2 |

---

## 6. Recommended Changes & Add-Ons (Prioritized)

### P0 — Must have (MVP production)

1. **Wire dashboard widgets to API** — remove hardcoded `*_DATA` constants
2. **Fix agent bootstrap** — one fetch, populate all widgets
3. **Wire briefing widget** to `SummarizerAgent` / `POST /ai/summary`
4. **Settings save** → real `updateProfile()` API
5. **Backend always running** — document dev setup, health check in UI
6. **Integration connect** — Gmail + GitHub OAuth with env credentials

### P1 — High value

7. **AICockpit + floating chat** share same `/ai/chat` SSE pipeline
8. **Dashboard alerts API** derived from email/team/deploy data
9. **Documents** persistent storage (Firebase Storage)
10. **Analytics** from real activity logs
11. **Nav badges** (unread emails, deploy status)
12. **Command bar** passes text to cockpit

### P2 — Enhancements

13. Real LLM integration with tool calling
14. GitHub Actions webhooks for deploy widget
15. Jira/Slack for team widget
16. Global search
17. Mobile bottom tab bar polish
18. Extract inline CSS to shared design tokens (`index.css`)

### P3 — Future

19. Multi-workspace / org admin
20. Custom widget marketplace
21. WebSocket realtime updates
22. Offline PWA support

---

## 7. Implementation Plan (Phases)

### Phase 1 — Data Wiring (1–2 weeks)

**Goal:** Dashboard shows real API data everywhere mock exists today.

| Task | Files |
|------|-------|
| Create `useDashboardData()` hook | `Frontend/src/hooks/useDashboardData.js` |
| Parallel fetch: emails, calendar, team, deploy, docs, analytics, integrations | `api.js` |
| Replace widget constants with hook data | `Dashboard.jsx` |
| Fix `DataFetchAgent` or remove in favor of hook | `agents/` |
| Add `GET /dashboard/summary` | `backend/api/v1/endpoints/dashboard.py` |
| Add `POST /ai/summary` for brief | `backend/api/v1/endpoints/ai_chat.py` |
| Wire briefing widget to `state.dailyBrief` | `Dashboard.jsx` |
| Wire Settings save to API | `Pages.jsx` |

**Acceptance:** Refresh dashboard → widgets show API data (mock OK if no integrations).

---

### Phase 2 — Integrations & Real Data (2–3 weeks)

**Goal:** Connect Gmail/GitHub → Email, Calendar, Deployments show live data.

| Task | Files |
|------|-------|
| Complete OAuth (Google + GitHub) | `integration_service.py`, `.env` |
| Gmail full message fetch + normalize | `integration_service.py`, `emails.py` |
| GitHub Actions workflow status | new `github_provider.py`, `deployments.py` |
| Google Calendar event sync | `calendar.py` |
| Empty states: “Connect Gmail” on email widget | `Dashboard.jsx`, `EmailPage` |
| Integration status in nav/sidebar | `Dashboard.jsx` |

**Acceptance:** Connect Gmail → Email page shows real inbox.

---

### Phase 3 — AI Pipeline (2–3 weeks)

**Goal:** Unified AI across cockpit, command bar, briefing.

| Task | Files |
|------|-------|
| LLM service (OpenAI/Gemini configurable) | `backend/services/llm_service.py` |
| Replace keyword intents with LLM + tools | `ai_chat.py` |
| Shared chat component for FAB + Cockpit | `Frontend/src/components/ChatCore.jsx` |
| AI actions audit log | `ai_actions` collection + endpoints |
| Summarizer uses LLM + connected data | `SummarizerAgent.js`, backend |

**Acceptance:** Ask cockpit “draft CFO reply” → streams real LLM response; action logged.

---

### Phase 4 — Persistence & Production (2–4 weeks)

**Goal:** Data survives restarts; production-ready storage.

| Task | Files |
|------|-------|
| Firestore repositories for emails cache, team, documents metadata | `backend/repositories/` |
| Firebase Storage for uploads | `documents.py` |
| Activity tracking for analytics | `analytics.py`, middleware |
| Webhooks (GitHub, Slack) | `webhooks.py` |
| Background sync jobs | `workers/sync.py` |
| Redis OAuth state (replace in-memory) | `integration_service.py` |

---

### Phase 5 — UI Polish (from `implementation_plan.md`)

**Goal:** Design system, mobile, animations.

| Task | Reference |
|------|-----------|
| Mobile bottom tab bar | `implementation_plan.md` § Mobile |
| AICockpit bubble contrast, thinking bar | § AI Chatbot |
| Page transitions, table hovers | § Pages |
| Global CSS tokens | `index.css` |

---

## 8. File Change Matrix

| Section | Frontend | Backend |
|---------|----------|---------|
| Shell / Nav | `Dashboard.jsx` | `users.py`, new `notifications.py` |
| Home widgets | `Dashboard.jsx`, new hook | `dashboard.py`, existing endpoints |
| Email | `Pages.jsx` | `emails.py`, Gmail provider |
| Calendar | `Pages.jsx` | `calendar.py`, GCal provider |
| Team | `Pages.jsx` | `team.py` → Jira/Slack |
| Deployments | `Pages.jsx` | `deployments.py`, GitHub Actions |
| Documents | `Pages.jsx` | `documents.py`, Storage, RAG |
| Analytics | `Pages.jsx` | `analytics.py`, activity logs |
| Integrations | `Pages.jsx` | `integrations.py` ✅ started |
| Settings | `Pages.jsx` | `users.py` |
| AI Cockpit | `AICockpit.jsx` | `ai_chat.py`, `llm_service.py` |
| Agents | Refactor or remove | N/A |

---

## 9. Current vs Target — Quick Reference

| Section | UI | API wired (page) | API wired (widget) | Real external data |
|---------|-----|------------------|--------------------|--------------------|
| Sidebar/Nav | ✅ | — | — | — |
| Greeting/Alerts | ✅ | ❌ | ❌ | ❌ |
| Email widget | ✅ | ✅ | ❌ | ⚠️ if Gmail connected |
| Schedule widget | ✅ | ✅ | ❌ | ⚠️ if GCal connected |
| Stats widget | ✅ | ✅ | ❌ | ❌ |
| Team widget | ✅ | ✅ | ❌ | ❌ |
| Deploy widget | ✅ | ✅ | ❌ | ⚠️ if GitHub connected |
| Briefing widget | ✅ | ❌ | ❌ | ❌ |
| AI Actions widget | ✅ | ❌ | ❌ | ❌ |
| Docs widget | ✅ | ✅ | ❌ | ❌ |
| Email page | ✅ | ✅ | — | ⚠️ |
| Calendar page | ✅ | ✅ | — | ⚠️ |
| Team page | ✅ | ✅ | — | ❌ |
| Deployments page | ✅ | ✅ | — | ⚠️ |
| Documents page | ✅ | ✅ | — | ❌ |
| Analytics page | ✅ | ✅ | — | ❌ |
| Integrations page | ✅ | ✅ | — | ⚠️ |
| Settings page | ✅ | ❌ | — | ❌ |
| AI Cockpit | ✅ | ✅ | — | ❌ (keyword bot) |
| Floating chat | ✅ | ❌ | — | ❌ |

---

## 10. Immediate Next Steps

1. **Phase 1 kickoff** — Create `useDashboardData` hook and wire one widget (Email) as template.
2. **Add `POST /ai/summary`** — unblock briefing widget.
3. **Ensure backend runs** alongside frontend (`uvicorn main:app --reload`).
4. **Configure Google OAuth** in `.env` for Gmail/Calendar connect testing.
5. **Decide LLM provider** for Phase 3 (OpenAI vs Gemini vs local).

---

## 11. Open Questions

1. **LLM provider** — Which API for production AI chat and summarization?
2. **Team data source** — Manual entry, Jira, or Slack standup bot first?
3. **Documents** — Firebase Storage vs S3 for file uploads?
4. **Mobile priority** — Phase 5 or sooner?
5. **Agent layer** — Keep agents or replace with React Query / single hook?

---

*Generated from codebase review of WorkPilot AI user dashboard — Frontend + Backend.*
