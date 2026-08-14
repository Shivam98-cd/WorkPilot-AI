# Multi-AI Integration System - Architecture Reference

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐    ┌─────────────────────────────────┐   │
│  │ IntegrationsPage │───▶│  useIntegrationAgents Hook      │   │
│  │  - Connection UI │    │  - State Management             │   │
│  │  - Sync Buttons  │    │  - API Calls                    │   │
│  │  - Health Status │    │  - Error Handling               │   │
│  └──────────────────┘    └─────────────────────────────────┘   │
│           │                                                      │
│           │                                                      │
│  ┌────────▼─────────────────────────────────────────────────┐  │
│  │  Optional: UnifiedInbox & UnifiedCalendar Components     │  │
│  │  - Aggregated view of data from all platforms            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           │ HTTP/REST API
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                      BACKEND API LAYER                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  API Endpoints (FastAPI)                                         │
│  ─────────────────────────────────────────────────────────────   │
│  POST   /api/v1/integrations/sync-all                           │
│  GET    /api/v1/integrations/unified-inbox                       │
│  GET    /api/v1/integrations/unified-calendar                    │
│  GET    /api/v1/integrations/health                              │
│  POST   /api/v1/integrations/workflow/execute                    │
│  GET    /api/v1/integrations/{platform}/data                     │
│  POST   /api/v1/integrations/{platform}/authorize                │
│  GET    /api/v1/integrations/{platform}/callback                 │
│  DELETE /api/v1/integrations/{platform}/disconnect               │
│                                                                   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                    SERVICE LAYER (Business Logic)                 │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              MasterIntegrationAgent                       │   │
│  │  ────────────────────────────────────────────────────    │   │
│  │  - Orchestrates all worker agents                        │   │
│  │  - Coordinates cross-platform workflows                  │   │
│  │  - Aggregates unified data                               │   │
│  │  - Manages health checks                                 │   │
│  │  - Handles conflict resolution                           │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│                         │ Manages                                │
│                         │                                        │
│           ┌─────────────┼────────────────────────────┐          │
│           │             │                            │          │
│  ┌────────▼───────┐  ┌──▼──────────┐  ┌────────────▼───────┐  │
│  │ GoogleWorkspace│  │ Microsoft   │  │ DevTools           │  │
│  │ Agent          │  │ Agent       │  │ Agent              │  │
│  │ ─────────────  │  │ ──────────  │  │ ────────           │  │
│  │ - Gmail        │  │ - Outlook   │  │ - GitHub           │  │
│  │ - Calendar     │  │ - Teams     │  │ - Jira             │  │
│  │ - Drive        │  │ - OneDrive  │  │                    │  │
│  │ - Meet         │  │ - Calendar  │  │                    │  │
│  └────────────────┘  └─────────────┘  └────────────────────┘  │
│                                                                  │
│  ┌──────────────────┐              ┌─────────────────────────┐ │
│  │ Communication    │              │ Productivity            │ │
│  │ Agent            │              │ Agent                   │ │
│  │ ───────────      │              │ ────────────            │ │
│  │ - Slack          │              │ - Notion                │ │
│  │ - Zoom           │              │ - Trello                │ │
│  └──────────────────┘              └─────────────────────────┘ │
│                                                                  │
│  All agents inherit from: BaseIntegrationAgent                  │
│  Common interface: connect, sync, disconnect, health_check      │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                   DATA ACCESS LAYER                               │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          IntegrationRepository                             │ │
│  │          ─────────────────────                             │ │
│  │          - CRUD operations for UserIntegration model       │ │
│  │          - Token encryption/decryption                     │ │
│  │          - Firestore queries with fallback to memory       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                   STORAGE & EXTERNAL SERVICES                     │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Firebase        │  │ Redis        │  │ External APIs    │   │
│  │ Firestore       │  │ (Rate Limit) │  │ - Google         │   │
│  │ - User tokens   │  │ - Caching    │  │ - Microsoft      │   │
│  │ - Sync state    │  │ - Locks      │  │ - GitHub         │   │
│  │ - Audit logs    │  │              │  │ - Slack          │   │
│  └─────────────────┘  └──────────────┘  │ - Zoom           │   │
│                                          │ - Notion         │   │
│                                          │ - Jira           │   │
│                                          │ - Trello         │   │
│                                          └──────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow: User Connects Gmail

```
1. User clicks "Connect Gmail" button
   │
   ▼
2. Frontend → POST /api/v1/integrations/gmail/authorize
   │
   ▼
3. IntegrationService.build_authorize_url('gmail')
   │
   ▼
4. User redirected to Google OAuth consent screen
   │
   ▼
5. User grants permissions
   │
   ▼
6. Google → GET /api/v1/integrations/gmail/callback?code=xxx&state=yyy
   │
   ▼
7. IntegrationService.handle_oauth_callback()
   │
   ├─ Exchange code for access/refresh tokens
   │
   ├─ Encrypt tokens with AES-256
   │
   ├─ Create UserIntegration record
   │
   └─ Save to Firestore via IntegrationRepository
   │
   ▼
8. Redirect to frontend with success message
   │
   ▼
9. Frontend shows "Gmail Connected" with green badge
```

## Data Flow: Sync All Integrations

```
1. User clicks "Sync All" button
   │
   ▼
2. Frontend → POST /api/v1/integrations/sync-all
   │
   ▼
3. MasterIntegrationAgent.sync_all_integrations(uid)
   │
   ├─ Get all connected integrations for user
   │
   ├─ Initialize worker agents for each platform
   │
   ├─ Run syncs concurrently with asyncio.gather()
   │   │
   │   ├─ GoogleWorkspaceAgent.sync(uid) ──┐
   │   │                                     │
   │   ├─ MicrosoftAgent.sync(uid) ─────────┤
   │   │                                     ├─ Parallel execution
   │   ├─ DevToolsAgent.sync(uid) ──────────┤
   │   │                                     │
   │   └─ CommunicationAgent.sync(uid) ─────┘
   │
   ├─ Each agent:
   │   ├─ Decrypt access token
   │   ├─ Refresh if expired
   │   ├─ Call external API
   │   ├─ Transform to unified format
   │   └─ Return SyncResult
   │
   ├─ Aggregate results
   │
   ├─ Update sync timestamps in Firestore
   │
   └─ Return consolidated sync status
   │
   ▼
4. Frontend receives results
   │
   ▼
5. Update UI with last sync times and health badges
```

## Data Flow: Unified Inbox

```
1. User opens "Unified Inbox"
   │
   ▼
2. Frontend → GET /api/v1/integrations/unified-inbox
   │
   ▼
3. MasterIntegrationAgent.get_unified_inbox(uid)
   │
   ├─ Get connected email platforms (Gmail, Outlook)
   │
   ├─ Fetch messages from each platform in parallel:
   │   │
   │   ├─ GoogleWorkspaceAgent.get_messages(uid, limit=50)
   │   │   └─ Returns List[UnifiedMessage]
   │   │
   │   └─ MicrosoftAgent.get_messages(uid, limit=50)
   │       └─ Returns List[UnifiedMessage]
   │
   ├─ Merge and sort by timestamp (newest first)
   │
   ├─ Apply filters (priority, unread, date range)
   │
   └─ Return unified inbox (max 100 messages)
   │
   ▼
4. Frontend renders UnifiedInbox component
   │
   └─ Each message shows platform icon badge
```

## Agent Interaction: Cross-Platform Workflow

**Example**: "Create GitHub issue from email"

```
1. User: "Create GitHub issue from this Acme Corp email"
   │
   ▼
2. POST /api/v1/integrations/workflow/execute
   {
     "workflow": "email_to_github_issue",
     "params": {
       "email_id": "msg_123",
       "email_platform": "gmail",
       "repo": "acme/project"
     }
   }
   │
   ▼
3. MasterIntegrationAgent.execute_workflow()
   │
   ├─ Parse workflow type
   │
   ├─ Step 1: Fetch email from Gmail
   │   └─ GoogleWorkspaceAgent.get_message(uid, "msg_123")
   │       └─ Returns UnifiedMessage with subject, body
   │
   ├─ Step 2: Extract issue details
   │   ├─ Title: Email subject
   │   ├─ Body: Email body
   │   └─ Labels: "customer-feedback"
   │
   ├─ Step 3: Create GitHub issue
   │   └─ DevToolsAgent.create_github_issue(uid, repo, title, body, labels)
   │       └─ Returns issue URL
   │
   ├─ Step 4: Add comment to email (optional)
   │   └─ GoogleWorkspaceAgent.reply_to_message(uid, msg_id, "Issue created: {url}")
   │
   └─ Return workflow result
   │
   ▼
4. Frontend shows success notification
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TOKEN LIFECYCLE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. OAuth Authorization                                     │
│     └─ User grants permissions via OAuth provider          │
│                                                             │
│  2. Token Exchange                                          │
│     └─ Backend exchanges code for access/refresh tokens    │
│                                                             │
│  3. Encryption (AES-256)                                    │
│     ├─ Key: INTEGRATION_TOKEN_ENCRYPTION_KEY (env var)     │
│     ├─ Algorithm: Fernet (symmetric encryption)            │
│     └─ Encrypted tokens stored in Firestore                │
│                                                             │
│  4. Token Usage                                             │
│     ├─ Agent decrypts token before API call                │
│     ├─ Token never logged or exposed in errors             │
│     └─ Token cached in memory (max 5 min)                  │
│                                                             │
│  5. Token Refresh                                           │
│     ├─ Check expiry before each API call                   │
│     ├─ Auto-refresh if expires in < 5 minutes              │
│     └─ Re-encrypt and save new tokens                      │
│                                                             │
│  6. Token Revocation                                        │
│     ├─ User disconnects integration                        │
│     ├─ Revoke with OAuth provider                          │
│     └─ Delete from Firestore                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                  ERROR HANDLING LAYERS                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Agent Method Level                                │
│  ────────────────────────────                               │
│  Try:                                                       │
│    - Execute API call                                       │
│  Except:                                                    │
│    - NetworkError → Retry with exponential backoff (3x)    │
│    - TokenExpiredError → Refresh token, retry once         │
│    - RateLimitError → Wait per Retry-After header          │
│    - APIError → Log and raise with context                 │
│                                                             │
│  Layer 2: Master Agent Level                                │
│  ──────────────────────────                                 │
│  Try:                                                       │
│    - Coordinate worker agents                              │
│  Except:                                                    │
│    - WorkerAgentError → Mark agent as degraded             │
│    - Continue with other agents                            │
│    - Return partial success                                │
│                                                             │
│  Layer 3: API Endpoint Level                                │
│  ─────────────────────────                                  │
│  Try:                                                       │
│    - Call service method                                   │
│  Except:                                                    │
│    - ValidationError → 400 Bad Request                     │
│    - NotFoundError → 404 Not Found                         │
│    - ExternalServiceError → 502 Bad Gateway                │
│    - Log error with correlation ID                         │
│    - Return structured error response                      │
│                                                             │
│  Layer 4: Frontend Level                                    │
│  ──────────────────────                                     │
│  - Display user-friendly error messages                    │
│  - Offer retry actions                                     │
│  - Show degraded state for affected platforms              │
│  - Log to console for debugging                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING PYRAMID                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        ┌─────┐                              │
│                        │ E2E │  ← 5% (manual + automated)  │
│                        └─────┘                              │
│                     ┌───────────┐                           │
│                     │Integration│ ← 25% (API tests)        │
│                     └───────────┘                           │
│                ┌──────────────────┐                         │
│                │   Unit Tests      │ ← 70% (agent methods) │
│                └──────────────────┘                         │
│                                                             │
│  Unit Tests (backend/tests/unit/agents/)                   │
│  ──────────────────────────────────────                    │
│  - Test each agent method in isolation                     │
│  - Mock all external API calls                             │
│  - Mock IntegrationRepository                              │
│  - Test error scenarios                                    │
│  - Test retry logic                                        │
│  - Target: 90% coverage per agent                          │
│                                                             │
│  Integration Tests (backend/tests/integration/)            │
│  ──────────────────────────────────────────────            │
│  - Test MasterAgent ↔ WorkerAgent interaction             │
│  - Test Repository ↔ Firestore (with emulator)            │
│  - Test OAuth callback flow                                │
│  - Test concurrent syncs                                   │
│  - Target: 80% coverage for flows                          │
│                                                             │
│  E2E Tests (manual + optional automation)                  │
│  ─────────────────────────────────────                     │
│  - Test real OAuth flow with test accounts                 │
│  - Test frontend → backend → external API                  │
│  - Test error recovery in real scenarios                   │
│  - Target: Critical paths only                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture (Future)

```
┌──────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐       ┌─────────────────────────────┐  │
│  │   Frontend     │       │   Backend (FastAPI)         │  │
│  │   (Vite Build) │       │   - Master Agent            │  │
│  │                │       │   - Worker Agents           │  │
│  │   Deployed to: │       │   - API Endpoints           │  │
│  │   - Vercel     │       │                             │  │
│  │   - Netlify    │◀─────▶│   Deployed to:              │  │
│  │   - AWS S3     │       │   - AWS ECS/Fargate         │  │
│  └────────────────┘       │   - Google Cloud Run        │  │
│                           │   - Heroku                  │  │
│                           └─────────────────────────────┘  │
│                                        │                    │
│                                        │                    │
│              ┌─────────────────────────┼─────────────────┐ │
│              │                         │                 │ │
│     ┌────────▼────────┐    ┌──────────▼───────┐  ┌──────▼───┐
│     │ Firebase        │    │ Redis            │  │ Secrets  │
│     │ - Firestore     │    │ - Rate Limiting  │  │ Manager  │
│     │ - Auth          │    │ - Caching        │  │ - Tokens │
│     └─────────────────┘    │ - Distributed    │  │ - Keys   │
│                            │   Locks          │  └──────────┘
│                            └──────────────────┘              │
│                                                              │
│  Environment Variables (Backend):                           │
│  ────────────────────────────────                           │
│  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET                   │
│  - MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET             │
│  - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET                   │
│  - SLACK_CLIENT_ID, SLACK_CLIENT_SECRET                     │
│  - [... all OAuth credentials]                              │
│  - INTEGRATION_TOKEN_ENCRYPTION_KEY                         │
│  - REDIS_URL                                                │
│  - FIREBASE_SERVICE_ACCOUNT (JSON)                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Master-Worker Pattern
**Why**: Allows independent development and scaling of each integration while providing a unified interface.

### 2. Unified Data Models
**Why**: Simplifies frontend development by abstracting platform differences. Frontend doesn't need to know Gmail vs Outlook specifics.

### 3. Agent Base Class
**Why**: Enforces consistent interface across all agents. Makes testing and maintenance easier.

### 4. Async/Await Throughout
**Why**: Non-blocking I/O for external API calls. Allows concurrent syncs to improve performance.

### 5. Token Encryption at Rest
**Why**: Security requirement. Even if database is compromised, tokens are useless without encryption key.

### 6. Repository Pattern
**Why**: Abstracts Firestore operations. Easy to mock for testing. Can swap storage layer without changing business logic.

### 7. Firestore with Memory Fallback
**Why**: Development doesn't require Firebase setup. Tests can run in memory for speed.

### 8. Granular Error Handling
**Why**: Different errors require different responses (retry, refresh, fail). Improves reliability.

### 9. Rate Limiting Awareness
**Why**: Prevents getting blocked by external APIs. Respects rate limit headers and implements backoff.

### 10. Health Checks
**Why**: Proactive monitoring. Frontend can warn users before operations fail.

---

## File Structure Summary

```
backend/
├── agents/
│   ├── __init__.py
│   ├── base_agent.py                    # Base class for all agents
│   ├── google_workspace_agent.py        # Gmail, Calendar, Drive, Meet
│   ├── microsoft_agent.py               # Outlook, Teams, OneDrive
│   ├── devtools_agent.py                # GitHub, Jira
│   ├── communication_agent.py           # Slack, Zoom
│   └── productivity_agent.py            # Notion, Trello
├── services/
│   ├── master_agent.py                  # Master orchestrator (NEW)
│   └── integration_service.py           # OAuth flows (EXISTING, EXTEND)
├── models/
│   ├── integration.py                   # UserIntegration (EXISTING)
│   └── unified_data.py                  # Unified models (NEW)
├── api/v1/endpoints/
│   └── integrations.py                  # API endpoints (EXISTING, EXTEND)
├── tests/
│   ├── unit/agents/                     # Agent unit tests
│   ├── integration/                     # Integration tests
│   └── mocks/
│       └── integration_mocks.py         # Mock data factory

Frontend/
├── src/
│   ├── hooks/
│   │   └── useIntegrationAgents.js      # React hook for agents (NEW)
│   ├── components/
│   │   ├── IntegrationsPage.jsx         # Main integrations UI (EXISTING, ENHANCE)
│   │   ├── UnifiedInbox.jsx             # Unified inbox (NEW, OPTIONAL)
│   │   └── UnifiedCalendar.jsx          # Unified calendar (NEW, OPTIONAL)
```

---

**This architecture enables**:
- ✅ Independent development of each integration
- ✅ Easy addition of new platforms
- ✅ Concurrent syncs for performance
- ✅ Unified user experience across platforms
- ✅ Testable and maintainable codebase
- ✅ Secure token management
- ✅ Graceful error handling
- ✅ Production-ready deployment
