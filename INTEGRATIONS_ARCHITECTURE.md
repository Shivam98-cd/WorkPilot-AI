# WorkPilot AI — Integrations Architecture & Implementation Plan

> **Last updated:** 2026-07-28  
> **Scope:** User dashboard integrations UI + backend flow to connect third-party tools (Gmail, Calendar, GitHub, Slack, etc.)

---

## 1. Executive Summary

The dashboard **Integrations** page is UI-complete but **not wired to real OAuth or sync**. The backend exposes stub endpoints that store connection state in memory and reset on server restart. Login OAuth (Firebase, Microsoft, GitHub via `auth_service`) exists separately and must not be confused with **workspace integrations** (connecting Gmail/Slack to power Email, Calendar, Deployments widgets).

This document defines the target backend architecture, API contract, data model, and recommended frontend changes.

---

## 2. Current State Analysis

### 2.1 Frontend — Dashboard Integrations UI

| Location | Role | Status |
|----------|------|--------|
| `Frontend/src/components/Pages.jsx` → `IntegrationsPage` | Main integrations management screen | **UI only — mock data** |
| `Frontend/src/components/Dashboard.jsx` | Nav item + renders `<IntegrationsPage />` | **Routed correctly** |
| `Frontend/src/agents/IntegrationAgent.js` | Fetches `getIntegrations()` on dashboard load | **Misnamed** — handles auth sync + all dashboard data, not OAuth connect flow |
| `Frontend/src/api.js` | `getIntegrations()`, `getOAuthUrl()` | **Partial** — no `connectIntegration()` / `disconnectIntegration()` |
| `Frontend/src/components/Integrations.jsx` | Marketing marquee on landing page | **Separate** — not connected to dashboard |

#### IntegrationsPage behavior today

```736:772:Frontend/src/components/Pages.jsx
export function IntegrationsPage({ T }) {
  const [integrations, setIntegrations] = useState(INTEGRATIONS_LIST);
  // ...
  const toggle = (name) => {
    const ig = integrations.find(i => i.name === name);
    if (!ig.connected) {
      getOAuthUrl(name).then(() => showToast(`Connecting to ${name}...`, 'info'))
        .catch(() => showToast(`Connected to ${name}`, 'success'));
      setIntegrations(prev => prev.map(i => i.name === name ? { ...i, connected: true, lastSync: 'Just now' } : i));
    } else {
      setIntegrations(prev => prev.map(i => i.name === name ? { ...i, connected: false, lastSync: null } : i));
    }
  };
```

**Problems:**

1. **Hardcoded list** — 8 platforms with fake `connected` / `lastSync` values; never calls `getIntegrations()` on mount.
2. **Platform name mismatch** — UI uses `"Gmail"`, `"Google Calendar"`; backend uses `"gmail"`, `"github"`, `"slack"`, `"zoom"` (no calendar, teams, notion, jira).
3. **Broken OAuth flow** — `getOAuthUrl(name)` passes display name (`"Gmail"`) instead of platform slug; response URL is never opened in browser/popup.
4. **Optimistic fake connect** — Toggle updates local state even when API fails; disconnect never hits backend.
5. **No token persistence** — Connection state lost on refresh (would be lost on backend restart too).

#### Supported platforms in UI vs backend

| Platform (UI) | Backend slug | Backend `/integrations` | OAuth login (`auth_service`) |
|---------------|--------------|-------------------------|------------------------------|
| Gmail | `gmail` | Listed | Firebase Google |
| Google Calendar | — | **Missing** | — |
| GitHub | `github` | Listed | `/auth/github/callback` (login) |
| Slack | `slack` | Listed | — |
| Zoom | `zoom` | Listed | — |
| Microsoft Teams | — | **Missing** | `/auth/microsoft/callback` (login) |
| Notion | — | **Missing** | — |
| Jira | — | **Missing** | — |

---

### 2.2 Backend — Current Integrations Endpoints

```1:31:backend/api/v1/endpoints/integrations.py
router = APIRouter(prefix='/integrations', tags=['integrations'])
_state = defaultdict(dict)  # uid -> {platform: connected_bool}

@router.get('')
async def get_integrations(...):
    platforms = ['gmail', 'github', 'slack', 'zoom']
    res = [{'platform': p, 'connected': _state[uid].get(p, False)} for p in platforms]
    return {'success': True, 'data': res}

@router.get('/oauth-url')
async def get_oauth_url(platform: str, ...):
    url = _oauth_urls.get(platform, '')  # static base URLs, no client_id/state/redirect

@router.post('/connect')
async def connect_integration(body: dict, ...):
    _state[uid][platform] = True  # no OAuth exchange, no tokens stored
```

**Problems:**

1. **In-memory `_state`** — lost on restart; not multi-instance safe.
2. **No OAuth callback** — `/connect` marks connected without authorization code exchange.
3. **Static OAuth URLs** — missing `client_id`, `redirect_uri`, `scope`, `state`, PKCE.
4. **No token storage** — cannot call Gmail API, GitHub API, etc.
5. **No disconnect, sync, or webhook endpoints**.
6. **No link to feature endpoints** — `/emails`, `/calendar/events` use seeded mock data, not integration tokens.

#### Related but separate: Login OAuth

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/google` | Firebase ID token → WorkPilot JWT |
| `POST /auth/microsoft/callback` | Microsoft login → user + JWT |
| `POST /auth/github/callback` | GitHub login → user + JWT |

These authenticate **the user into WorkPilot**. Integrations OAuth stores **provider tokens** to read/write workspace data. A user can log in with Google and still need a separate Gmail integration connect (or you can auto-link if scopes overlap — see §5.3).

---

## 3. Target Architecture

### 3.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Dashboard)                             │
│  IntegrationsPage ──► api.js ──► GET /integrations                    │
│       │                    │                                             │
│       │ Connect toggle     ├──► GET /integrations/{platform}/authorize  │
│       │                    │         └── returns OAuth URL + state      │
│       │                    │         └── window.location or popup       │
│       │                    │                                             │
│       │ OAuth redirect     ◄──► GET /integrations/{platform}/callback   │
│       │                    │         (backend exchanges code → tokens)  │
│       │                    │                                             │
│       Disconnect           ├──► DELETE /integrations/{platform}           │
│       Manual sync          ├──► POST /integrations/{platform}/sync        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                                │
│  integrations.py (routes)                                                │
│       │                                                                  │
│       ▼                                                                  │
│  IntegrationService ──► IntegrationRepository (Firestore)                │
│       │                    • user_integrations/{uid}_{platform}          │
│       │                    • encrypted access_token, refresh_token       │
│       ├──► OAuthProvider adapters (Gmail, GitHub, Slack, …)            │
│       ├──► Sync workers (Celery/ARQ or background tasks)                 │
│       └──► Webhook handlers (GitHub, Slack events)                       │
│                                                                          │
│  Feature endpoints consume tokens:                                       │
│       emails.py ──► GmailProvider.list_messages()                        │
│       calendar.py ──► GoogleCalendarProvider.list_events()               │
│       deployments.py ──► GitHubProvider.list_workflows()                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    FIRESTORE + REDIS + EXTERNAL APIs                     │
│  Firestore: integration records, sync cursors, audit logs                │
│  Redis: OAuth state (CSRF), rate limits, sync job queue                  │
│  External: Google, GitHub, Slack, Zoom, Microsoft Graph, …               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Layer Responsibilities

| Layer | Files (proposed) | Responsibility |
|-------|------------------|----------------|
| **API** | `api/v1/endpoints/integrations.py` | HTTP routes, auth, validation |
| **Schemas** | `schemas/integration.py` | Pydantic request/response models |
| **Service** | `services/integration_service.py` | OAuth orchestration, connect/disconnect/sync |
| **Repository** | `repositories/integration_repository.py` | Firestore CRUD for integration records |
| **Providers** | `services/integrations/gmail.py`, `github.py`, … | Provider-specific API calls |
| **Crypto** | `core/crypto.py` or use Firebase/KMS | Encrypt refresh tokens at rest |
| **Jobs** | `workers/sync_integrations.py` | Periodic sync (every 5–15 min) |
| **Webhooks** | `api/v1/endpoints/webhooks.py` | Real-time updates from GitHub/Slack |

---

## 4. Data Model

### 4.1 Firestore Collection: `user_integrations`

Document ID: `{uid}_{platform}` (e.g. `abc123_gmail`)

```json
{
  "uid": "firebase-uid",
  "platform": "gmail",
  "status": "connected",
  "connectedAt": "2026-07-28T10:00:00Z",
  "lastSyncAt": "2026-07-28T10:05:00Z",
  "lastSyncStatus": "success",
  "lastSyncError": null,
  "scopes": ["https://www.googleapis.com/auth/gmail.readonly"],
  "accountLabel": "user@gmail.com",
  "accountAvatar": "https://...",
  "accessTokenEnc": "...",
  "refreshTokenEnc": "...",
  "tokenExpiresAt": "2026-07-28T11:00:00Z",
  "metadata": {
    "githubLogin": "octocat",
    "slackTeamId": "T123",
    "zoomAccountId": "..."
  },
  "syncCursor": {},
  "webhookId": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Status enum:** `pending` | `connected` | `expired` | `revoked` | `error`

### 4.2 Platform Registry (config)

Central catalog in `backend/core/integrations_registry.py`:

```python
PLATFORMS = {
  "gmail": {
    "displayName": "Gmail",
    "category": "communication",
    "oauth": {
      "authorizeUrl": "https://accounts.google.com/o/oauth2/v2/auth",
      "tokenUrl": "https://oauth2.googleapis.com/token",
      "scopes": ["https://www.googleapis.com/auth/gmail.readonly", "..."],
      "clientIdEnv": "GOOGLE_CLIENT_ID",
      "clientSecretEnv": "GOOGLE_CLIENT_SECRET",
    },
    "features": ["emails"],
    "syncIntervalMinutes": 5,
  },
  "google_calendar": { ... },
  "github": { ... },
  # ...
}
```

### 4.3 OAuth State (Redis)

Key: `oauth_state:{state_token}` → `{ uid, platform, redirectUri, createdAt }`  
TTL: 10 minutes. Prevents CSRF on callback.

---

## 5. OAuth Connect Flow (Detailed)

### 5.1 Connect sequence

```
1. User toggles ON "Gmail" in IntegrationsPage
2. Frontend: GET /api/v1/integrations/gmail/authorize
   Headers: Authorization: Bearer <wp_access_token>
3. Backend:
   - Generate state + PKCE verifier
   - Store state in Redis
   - Return { authorizeUrl: "https://accounts.google.com/...&state=..." }
4. Frontend: window.open(authorizeUrl) or redirect
5. User approves at Google
6. Google redirects: GET /api/v1/integrations/gmail/callback?code=...&state=...
7. Backend:
   - Validate state from Redis
   - Exchange code for access + refresh tokens
   - Encrypt tokens, upsert Firestore record
   - Trigger initial sync job
   - Redirect to: FRONTEND_URL/dashboard?integrations=gmail&status=connected
8. Frontend: show toast, refetch GET /integrations
```

### 5.2 Disconnect sequence

```
DELETE /api/v1/integrations/gmail
  → Revoke token at provider (if supported)
  → Delete Firestore record
  → Clear cached synced data for that source (optional)
```

### 5.3 Login vs integration (recommended policy)

| Scenario | Recommendation |
|----------|----------------|
| User logs in with Google (Firebase) | Offer **one-click connect** for Gmail + Calendar using same Google account if additional scopes granted |
| User logs in with GitHub | Auto-mark GitHub integration as connected for **profile only**; prompt for repo/workflow scopes separately |
| User logs in with email/password | All integrations require explicit OAuth connect |

---

## 6. API Specification (Target)

All routes under `/api/v1/integrations`, protected by `get_current_user`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List all platforms with connection status for current user |
| `GET` | `/catalog` | List available platforms (metadata, icons, required scopes) |
| `GET` | `/{platform}/authorize` | Start OAuth; returns `{ authorizeUrl }` |
| `GET` | `/{platform}/callback` | OAuth redirect handler (public, validates state) |
| `DELETE` | `/{platform}` | Disconnect integration |
| `POST` | `/{platform}/sync` | Trigger manual sync |
| `GET` | `/{platform}/status` | Detailed status, last error, scopes |
| `POST` | `/request` | User requests a new integration (feature request) |

### 6.1 `GET /integrations` response

```json
{
  "success": true,
  "data": [
    {
      "platform": "gmail",
      "displayName": "Gmail",
      "description": "Read, send and triage emails",
      "connected": true,
      "status": "connected",
      "accountLabel": "alex@company.com",
      "lastSyncAt": "2026-07-28T10:05:00Z",
      "lastSyncStatus": "success",
      "scopes": ["gmail.readonly"]
    }
  ]
}
```

### 6.2 Environment variables to add

```env
# Google (Gmail + Calendar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/integrations/google_calendar/callback

# Slack
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=

# Zoom
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

# Notion, Jira (future)
NOTION_CLIENT_ID=
JIRA_CLIENT_ID=

# Token encryption
INTEGRATION_TOKEN_ENCRYPTION_KEY=

# Frontend redirect after OAuth
FRONTEND_OAUTH_REDIRECT=http://localhost:5173/dashboard
```

---

## 7. Sync & Webhooks

### 7.1 Sync strategy

| Platform | Sync method | Frequency | Powers |
|----------|-------------|-----------|--------|
| Gmail | Poll Gmail API + History ID cursor | 5 min | Email page, AI brief |
| Google Calendar | Poll Events.list | 5 min | Calendar page, brief |
| GitHub | Poll + webhooks | 15 min + realtime | Deployments, PR alerts |
| Slack | Webhooks (Events API) | Realtime | Notifications, AI actions |
| Zoom | Poll meetings | 30 min | Calendar join links |

### 7.2 Background jobs

Use **FastAPI BackgroundTasks** for MVP, then **Celery + Redis** for production:

```python
async def sync_integration(uid: str, platform: str):
    record = await integration_repo.get(uid, platform)
    provider = get_provider(platform)
    await provider.refresh_token_if_needed(record)
    data = await provider.fetch_delta(record.syncCursor)
    await cache_repo.upsert(uid, platform, data)
    await integration_repo.update_sync_status(uid, platform, "success")
```

### 7.3 Webhook endpoints (Phase 2)

| Path | Provider |
|------|----------|
| `POST /webhooks/github` | Push, PR, workflow_run |
| `POST /webhooks/slack/events` | Messages, mentions |
| `POST /webhooks/google/pubsub` | Gmail push notifications |

Verify signatures (GitHub `X-Hub-Signature-256`, Slack signing secret).

---

## 8. Frontend Changes Required

### 8.1 IntegrationsPage refactor

| Change | Detail |
|--------|--------|
| Load from API | `useEffect` → `getIntegrations()` on mount |
| Platform slug map | `{ "Gmail": "gmail", "Google Calendar": "google_calendar", ... }` |
| Connect flow | Call `authorizeIntegration(platform)` → redirect/popup |
| Disconnect | Call `disconnectIntegration(platform)` before UI update |
| OAuth return handling | Parse `?integrations=gmail&status=connected` in Dashboard/App |
| Loading/error states | Use `SkeletonCard` while fetching |
| Remove fake defaults | Delete hardcoded `connected: true` in `INTEGRATIONS_LIST` |

### 8.2 api.js additions

```javascript
export const getIntegrationsCatalog = () => apiFetch('/integrations/catalog');
export const authorizeIntegration = (platform) => apiFetch(`/integrations/${platform}/authorize`);
export const disconnectIntegration = (platform) => apiFetch(`/integrations/${platform}`, { method: 'DELETE' });
export const syncIntegration = (platform) => apiFetch(`/integrations/${platform}/sync`, { method: 'POST' });
export const requestIntegration = (body) => apiFetch('/integrations/request', { method: 'POST', body: JSON.stringify(body) });
```

### 8.3 IntegrationAgent rename (recommended)

Rename `IntegrationAgent.js` → `DashboardBootstrapAgent.js` to avoid confusion with OAuth integrations. Keep `getIntegrations()` in dashboard bootstrap fetch.

### 8.4 Dashboard widget linkage

- Email widget: show banner **"Connect Gmail"** when `integrations.gmail.connected === false`
- Deployments widget: link to GitHub connect
- Settings → Notifications: enable Slack toggle only when Slack connected

---

## 9. Security Considerations

| Topic | Requirement |
|-------|-------------|
| Token storage | Encrypt refresh tokens (Fernet/AES-256); never log tokens |
| OAuth state | Redis TTL + single use |
| Scopes | Request minimum scopes per feature |
| Revocation | Call provider revoke on disconnect |
| Audit | Log connect/disconnect/sync in `audit_repository` |
| RBAC | Only integration owner can disconnect (uid match) |
| Rate limits | Apply SlowAPI limits on `/sync` and OAuth routes |

---

## 10. Implementation Phases

### Phase 1 — Foundation (MVP)
- [ ] Firestore `user_integrations` repository
- [ ] Token encryption utility
- [ ] Platform registry config
- [ ] Replace in-memory `_state` in `integrations.py`
- [ ] `GET /integrations`, `GET /catalog`
- [ ] Wire `IntegrationsPage` to real API (read-only)

### Phase 2 — OAuth Connect (Gmail + GitHub)
- [ ] Google OAuth with Gmail scopes
- [ ] GitHub OAuth for repos/actions (separate from login scopes)
- [ ] Authorize + callback routes
- [ ] Frontend connect/disconnect flow
- [ ] OAuth redirect landing in Dashboard

### Phase 3 — Data Sync
- [ ] Gmail sync → replace mock `/emails` seed data
- [ ] GitHub sync → replace mock `/deployments`
- [ ] Google Calendar sync → replace mock `/calendar/events`
- [ ] Manual sync button on integration cards
- [ ] `lastSyncAt` / error display in UI

### Phase 4 — Additional Platforms
- [ ] Slack (notifications + AI send)
- [ ] Zoom (meetings)
- [ ] Microsoft Teams / Graph
- [ ] Notion, Jira

### Phase 5 — Advanced
- [ ] Webhooks (GitHub, Slack)
- [ ] Push notifications (Gmail Pub/Sub)
- [ ] Integration health dashboard
- [ ] Admin: org-wide integration policies
- [ ] "Request integration" → stores request in Firestore + email admin

---

## 11. Recommended Add-Ons & Enhancements

### 11.1 Product features

| Add-on | Description |
|--------|-------------|
| **Smart connect suggestions** | After login, prompt to connect tools matching provider (Google → Gmail + Calendar) |
| **Integration health score** | Green/yellow/red per platform based on token expiry and sync errors |
| **Scope upgrade flow** | User connected Gmail read-only → prompt to upgrade for send/draft |
| **Multi-account** | Connect personal + work Gmail (separate records per account) |
| **Integration activity log** | "GitHub synced 12 PRs 2 min ago" in Settings |
| **AI-triggered actions** | AI Cockpit sends Slack message / creates calendar event via integration tokens |
| **Workspace templates** | "Engineering stack" bundle: GitHub + Slack + Jira one-click setup |

### 11.2 Technical add-ons

| Add-on | Description |
|--------|-------------|
| **Unified provider interface** | `BaseIntegrationProvider` abstract class |
| **Token refresh scheduler** | Proactive refresh before expiry |
| **Circuit breaker** | Pause sync after N consecutive provider failures |
| **Feature flags** | Enable platforms per plan (free vs pro) |
| **Webhook replay** | Idempotent event processing with dedup keys |
| **Integration tests** | Mock OAuth + provider APIs in pytest |

### 11.3 UI polish (from redesign plan)

- iOS-style toggle (already in UI) + **connected green dot** on brand icon
- Show **account email** under platform name when connected
- **Expand card** on click → scopes, last sync, sync now, disconnect
- Filter tabs: All | Connected | Available | Coming soon
- Mobile: single-column cards

---

## 12. Gap Summary

| Area | Current | Target |
|------|---------|--------|
| Connection storage | In-memory dict | Firestore + encrypted tokens |
| OAuth | Static URLs, fake connect | Full authorize/callback + PKCE |
| UI data source | Hardcoded `INTEGRATIONS_LIST` | `GET /integrations` |
| Platform parity | 4 backend / 8 frontend | Unified registry |
| Feature data | Mock seeds in emails/calendar | Provider-backed sync |
| Login OAuth vs integration | Conflated conceptually | Separate flows, optional auto-link |
| Agent naming | `IntegrationAgent` = dashboard bootstrap | Rename + dedicated connect service on frontend |

---

## 13. File Change Checklist

### Backend (new/modified)

```
backend/
├── api/v1/endpoints/integrations.py      # rewrite
├── api/v1/endpoints/webhooks.py          # new (phase 2)
├── schemas/integration.py                  # new
├── models/integration.py                 # new
├── repositories/integration_repository.py # new
├── services/integration_service.py       # new
├── services/integrations/
│   ├── base.py
│   ├── gmail.py
│   ├── google_calendar.py
│   ├── github.py
│   ├── slack.py
│   └── zoom.py
├── workers/sync_integrations.py          # new
├── core/integrations_registry.py         # new
├── core/crypto.py                        # new
└── core/config.py                        # add OAuth env vars
```

### Frontend (modified)

```
Frontend/src/
├── components/Pages.jsx                  # IntegrationsPage refactor
├── api.js                                # new integration methods
├── agents/IntegrationAgent.js            # rename optional
└── App.jsx                               # OAuth redirect query handler
```

---

## 14. Next Steps

1. **Approve platform priority** — Recommend: Gmail → GitHub → Google Calendar → Slack.
2. **Register OAuth apps** — Google Cloud Console, GitHub App/OAuth, Slack App.
3. **Implement Phase 1** — Firestore repository + real `GET /integrations`.
4. **Wire IntegrationsPage** — Remove mock state; test with API.
5. **Implement Gmail OAuth (Phase 2)** — First end-to-end connect flow.

---

*Document generated from codebase analysis of WorkPilot AI dashboard integrations (Frontend + Backend).*
