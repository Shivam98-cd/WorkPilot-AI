# WorkPilot AI — Integration Tasks and Handoff Guide
Last updated: 2026-08-09 07:57 UTC
Status: ALL CREDENTIALS SET - ALL OAuth URLs VERIFIED

---

## Project Paths
Frontend:  D:\workpilot-ai\Frontend\src\
Backend:   D:\workpilot-ai\backend\
Env file:  D:\workpilot-ai\backend\.env

## How to Run
# Terminal 1 - Backend
cd D:\workpilot-ai\backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd D:\workpilot-ai\Frontend
npm run dev
# Opens at http://localhost:5173

---

## Integration Status (Verified 2026-08-09)

Platform           | Credential | OAuth URL | Notes
Gmail              | SET        | VERIFIED  | Works end-to-end (tested)
Google Calendar    | SET        | VERIFIED  | Works end-to-end (tested)
Google Drive       | SET        | VERIFIED  | URL OK
GitHub             | SET        | VERIFIED  | URL OK
Slack              | SET        | VERIFIED  | URL OK
Zoom               | SET        | VERIFIED  | Uses 127.0.0.1 (Zoom blocks localhost)
Notion             | SET        | VERIFIED  | URL OK
Jira               | SET        | VERIFIED  | URL OK
Microsoft Teams    | SET        | VERIFIED  | URL OK
Outlook            | SET        | VERIFIED  | URL OK
Microsoft 365      | SET        | VERIFIED  | URL OK

All 13 platforms in catalog. All 11 tested platforms generate valid OAuth URLs.

---

## COMPLETED (Do NOT redo these)

[x] All UI pages - Dashboard, AICockpit, 8 section pages, landing page
[x] All 10 backend endpoints registered and working
[x] Firebase Admin SDK initialized and Firestore connected
[x] Windows emoji charmap crash fixed in all backend files
[x] Google (Gmail + Calendar) OAuth - fully working end-to-end
[x] GitHub OAuth credentials set and URL verified
[x] Slack OAuth credentials set and URL verified
[x] Zoom OAuth credentials set and URL verified (127.0.0.1 redirect)
[x] Notion OAuth credentials set and URL verified
[x] Jira OAuth credentials set and URL verified
[x] Microsoft (Teams/Outlook/365) credentials set and URL verified
[x] OAuth state persisted to oauth_states.json - survives server restarts
[x] Google access token auto-refresh before expiry
[x] Email page shows real Gmail messages (mock fallback if not connected)
[x] Calendar page shows real Google Calendar events (mock fallback if not connected)
[x] Connect/disconnect/sync UI in Integrations page
[x] Toast notification after OAuth redirect (success/error)
[x] npm run build passes - 0 errors
[x] ZOOM_REDIRECT_URI=http://127.0.0.1:8000/api/v1/integrations/zoom/callback in .env

---

## REMAINING (Manual steps only - no coding needed)

### Register callback URLs in each platform's developer portal

Zoom (IMPORTANT - must use 127.0.0.1 not localhost):
  Portal: https://marketplace.zoom.us/develop/apps
  Callback: http://127.0.0.1:8000/api/v1/integrations/zoom/callback

Notion:
  Portal: https://www.notion.so/my-integrations
  Callback: http://localhost:8000/api/v1/integrations/notion/callback

Jira:
  Portal: https://developer.atlassian.com/console/myapps/
  Callback: http://localhost:8000/api/v1/integrations/jira/callback

Microsoft (Azure Portal):
  Portal: https://portal.azure.com - App registrations - WorkPilot AI
  Callback 1: http://localhost:8000/api/v1/integrations/microsoft_teams/callback
  Callback 2: http://localhost:8000/api/v1/integrations/outlook/callback

GitHub (already registered - verify it):
  Portal: https://github.com/settings/developers
  Callback: http://localhost:8000/api/v1/integrations/github/callback

Slack (already registered - verify it):
  Portal: https://api.slack.com/apps
  Callback: http://localhost:8000/api/v1/integrations/slack/callback

---

## All Callback URLs Reference

Gmail:           http://localhost:8000/api/v1/integrations/gmail/callback
Google Calendar: http://localhost:8000/api/v1/integrations/google_calendar/callback
GitHub:          http://localhost:8000/api/v1/integrations/github/callback
Slack:           http://localhost:8000/api/v1/integrations/slack/callback
Zoom:            http://127.0.0.1:8000/api/v1/integrations/zoom/callback   <-- 127.0.0.1 NOT localhost
Notion:          http://localhost:8000/api/v1/integrations/notion/callback
Jira:            http://localhost:8000/api/v1/integrations/jira/callback
Microsoft Teams: http://localhost:8000/api/v1/integrations/microsoft_teams/callback
Outlook:         http://localhost:8000/api/v1/integrations/outlook/callback

---

## Key Files Reference

backend/.env                                     - All credentials (ALL SET)
backend/services/integration_service.py          - OAuth URL builders + token exchange + refresh
backend/api/v1/endpoints/integrations.py         - REST: authorize, callback, disconnect, sync
backend/repositories/integration_repository.py   - Firestore token storage
backend/core/config.py                           - Settings (ZOOM_REDIRECT_URI added)
backend/core/integrations_registry.py            - Platform catalog (13 platforms)
backend/oauth_states.json                        - Persistent OAuth state (auto-created)
Frontend/src/components/Pages.jsx                - IntegrationsPage UI (line 726+)
Frontend/src/components/Toast.jsx                - Toast + OAuth event listener
Frontend/src/App.jsx                             - OAuth callback query param detection

---

## Notes for Next AI Agent

- DO NOT regenerate or change any credentials in .env - all are set
- Microsoft platform key in code is microsoft_teams / outlook / microsoft_365 (NOT microsoft)
- Zoom callback must use http://127.0.0.1:8000 not http://localhost:8000
- Backend code handles all platforms - only portal-side callback URL registration may be missing
- Get Firebase token from browser DevTools: copy(await auth.currentUser?.getIdToken())
