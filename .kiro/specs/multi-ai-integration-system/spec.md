# Multi-AI Agent Integration System

## Overview
Complete implementation of 12 third-party platform integrations using a Master-Worker agent architecture for WorkPilot AI. The system enables seamless OAuth connection, data synchronization, and intelligent automation across Gmail, Google Calendar, Google Drive, GitHub, Slack, Microsoft 365, Outlook, Jira, Notion, Zoom, Google Meet, and Trello.

## Status
- **Phase**: Design
- **Created**: 2026-08-03
- **Target Completion**: End of day (2026-08-03)

## Architecture Vision

### Master Agent Pattern
```
MasterIntegrationAgent (Orchestrator)
├── Manages all worker agents
├── Coordinates cross-platform operations
├── Handles conflict resolution
├── Maintains sync state
└── Provides unified API to frontend

WorkerAgents (Platform-Specific)
├── GoogleWorkspaceAgent (Gmail, Calendar, Drive, Meet)
├── MicrosoftAgent (365, Outlook, Teams)
├── DevToolsAgent (GitHub, Jira)
├── CommunicationAgent (Slack, Zoom)
└── ProductivityAgent (Notion, Trello)
```

### Core Principles
1. **Efficiency**: Reuse OAuth tokens, batch API calls, cache responses
2. **Security**: Encrypted token storage, scope minimization, audit logging
3. **Simplicity**: Clear agent responsibilities, minimal configuration
4. **Testability**: Mocked external APIs, integration test suite

## Design Specifications

### 1. Backend Architecture

#### 1.1 Master Agent Service
**File**: `backend/services/master_agent.py`

**Responsibilities**:
- Initialize and manage all worker agents
- Route requests to appropriate worker agents
- Aggregate data from multiple platforms
- Handle cross-platform workflows (e.g., "create GitHub issue from email")
- Maintain global sync status

**Core Methods**:
```python
async def sync_all_integrations(uid: str) -> Dict[str, Any]
async def execute_workflow(uid: str, workflow: str, params: Dict) -> Any
async def get_unified_inbox(uid: str) -> List[UnifiedMessage]
async def get_unified_calendar(uid: str) -> List[UnifiedEvent]
async def health_check(uid: str) -> Dict[str, AgentHealth]
```

#### 1.2 Worker Agent Base Class
**File**: `backend/agents/base_agent.py`

**Common Interface**:
```python
class BaseIntegrationAgent(ABC):
    @abstractmethod
    async def connect(uid: str, tokens: Dict) -> bool
    @abstractmethod
    async def sync(uid: str) -> SyncResult
    @abstractmethod
    async def disconnect(uid: str) -> bool
    @abstractmethod
    async def health_check(uid: str) -> AgentHealth
    @abstractmethod
    async def refresh_token(uid: str) -> bool
```

#### 1.3 Worker Agent Implementations

**GoogleWorkspaceAgent** (`backend/agents/google_workspace_agent.py`)
- **Platforms**: Gmail, Google Calendar, Google Drive, Google Meet
- **Features**:
  - Email reading, sending, filtering, labeling
  - Calendar event CRUD, availability checking
  - Drive file listing, uploading, sharing
  - Meet link generation
- **API**: Google Workspace APIs (unified OAuth)
- **Scopes**: `gmail.readonly`, `gmail.send`, `calendar`, `drive.readonly`, `meet`

**MicrosoftAgent** (`backend/agents/microsoft_agent.py`)
- **Platforms**: Microsoft 365, Outlook, Teams
- **Features**:
  - Outlook email management
  - Calendar integration
  - Teams channel messaging
  - OneDrive file access
- **API**: Microsoft Graph API
- **Scopes**: `Mail.Read`, `Mail.Send`, `Calendars.ReadWrite`, `Files.Read`, `Chat.ReadWrite`

**DevToolsAgent** (`backend/agents/devtools_agent.py`)
- **Platforms**: GitHub, Jira
- **Features**:
  - GitHub: Repo listing, PR status, issue tracking, workflow runs, deployments
  - Jira: Issue listing, sprint status, project boards
- **APIs**: GitHub REST API v3, Jira Cloud REST API
- **Scopes**: GitHub: `repo`, `workflow`, `read:org`; Jira: `read:jira-work`, `write:jira-work`

**CommunicationAgent** (`backend/agents/communication_agent.py`)
- **Platforms**: Slack, Zoom
- **Features**:
  - Slack: Send messages, read channels, DMs, reactions
  - Zoom: Create meetings, list recordings, get participants
- **APIs**: Slack Web API, Zoom API v2
- **Scopes**: Slack: `chat:write`, `channels:read`, `users:read`; Zoom: `meeting:write`, `meeting:read`

**ProductivityAgent** (`backend/agents/productivity_agent.py`)
- **Platforms**: Notion, Trello
- **Features**:
  - Notion: Database queries, page creation, block updates
  - Trello: Board listing, card CRUD, list management
- **APIs**: Notion API v1, Trello REST API
- **Scopes**: Notion: full workspace access; Trello: `read`, `write`

#### 1.4 Data Models Extension
**File**: `backend/models/unified_data.py`

**New Models**:
```python
@dataclass
class UnifiedMessage:
    id: str
    platform: str
    sender: str
    subject: str
    body: str
    timestamp: datetime
    priority: str
    thread_id: Optional[str]
    attachments: List[Attachment]

@dataclass
class UnifiedEvent:
    id: str
    platform: str
    title: str
    start: datetime
    end: datetime
    attendees: List[str]
    location: Optional[str]
    meeting_link: Optional[str]
    status: str

@dataclass
class UnifiedTask:
    id: str
    platform: str
    title: str
    description: str
    status: str
    assignee: Optional[str]
    due_date: Optional[datetime]
    labels: List[str]

@dataclass
class SyncResult:
    platform: str
    success: bool
    items_synced: int
    last_sync: datetime
    errors: List[str]
    next_sync: Optional[datetime]

@dataclass
class AgentHealth:
    platform: str
    status: str  # "healthy", "degraded", "down"
    token_valid: bool
    last_sync: Optional[datetime]
    error_count: int
    response_time_ms: float
```

#### 1.5 API Endpoints Extension
**File**: `backend/api/v1/endpoints/integrations.py` (extend existing)

**New Endpoints**:
```python
POST /integrations/sync-all          # Sync all connected integrations
GET  /integrations/unified-inbox     # Aggregated messages from all platforms
GET  /integrations/unified-calendar  # Aggregated events
GET  /integrations/health            # Health status of all agents
POST /integrations/workflow/execute  # Execute cross-platform workflow
GET  /integrations/{platform}/data   # Platform-specific data fetch
```

### 2. Frontend Architecture

#### 2.1 Agent Manager Hook
**File**: `Frontend/src/hooks/useIntegrationAgents.js`

**Purpose**: React hook to manage integration agents state

**State**:
```javascript
{
  agents: {
    google: { status: 'connected', health: 'healthy', lastSync: '...' },
    microsoft: { status: 'connected', health: 'degraded', lastSync: '...' },
    // ...
  },
  syncing: false,
  error: null
}
```

**Methods**:
```javascript
const {
  agents,
  syncing,
  syncAll,
  syncPlatform,
  executeWorkflow,
  getUnifiedData,
  refreshHealth
} = useIntegrationAgents();
```

#### 2.2 Integration Dashboard Enhancement
**File**: `Frontend/src/components/IntegrationsPage.jsx` (enhance existing)

**New Features**:
- Real-time sync status for each platform
- Health indicators with tooltip details
- Bulk sync button ("Sync All")
- Platform-specific action buttons
- Last sync timestamp with relative time
- Error notifications with retry button

#### 2.3 Unified Data Components

**UnifiedInbox Component** (`Frontend/src/components/UnifiedInbox.jsx`)
- Displays messages from Gmail, Outlook, Slack in single view
- Filtering by platform, priority, date
- AI-powered categorization and summarization
- Quick reply/action buttons

**UnifiedCalendar Component** (`Frontend/src/components/UnifiedCalendar.jsx`)
- Shows events from Google Calendar, Outlook, Zoom
- Color-coded by platform
- Meeting link quick access
- Availability blocking

### 3. Testing Framework

#### 3.1 Backend Testing Strategy

**Unit Tests** (`backend/tests/unit/agents/`)
- Test each agent method in isolation
- Mock external API calls with `httpx.AsyncMock`
- Test token refresh logic
- Test error handling and retries

**Integration Tests** (`backend/tests/integration/agents/`)
- Test OAuth flow end-to-end (with test accounts)
- Test data synchronization accuracy
- Test cross-platform workflows
- Test rate limiting and throttling

**E2E Tests** (`backend/tests/e2e/`)
- Test complete user journey: connect → sync → disconnect
- Test master agent orchestration
- Test concurrent syncs

**Test Coverage Target**: 85%+

#### 3.2 Frontend Testing Strategy

**Component Tests** (Vitest + React Testing Library)
- Test integration card rendering
- Test sync button interactions
- Test health indicator states
- Test error state displays

**Integration Tests**
- Test hook state management
- Test API call mocking
- Test optimistic updates

#### 3.3 Test Utilities

**Mock Factory** (`backend/tests/mocks/integration_mocks.py`)
```python
def mock_gmail_response(count: int) -> List[Dict]
def mock_calendar_response(count: int) -> List[Dict]
def mock_github_response(count: int) -> List[Dict]
# ... for each platform
```

**Test Data Seeds** (`backend/tests/fixtures/integration_data.json`)
- Realistic sample data for each platform
- Edge cases (empty responses, large datasets, errors)

### 4. Configuration Management

#### 4.1 Environment Variables
**File**: `backend/.env.example` (extend existing)

**New Variables**:
```bash
# Google Drive
GOOGLE_DRIVE_ENABLED=true

# Microsoft Graph (extend)
MICROSOFT_TEAMS_ENABLED=true
MICROSOFT_ONEDRIVE_ENABLED=true

# Trello
TRELLO_API_KEY=
TRELLO_API_SECRET=
TRELLO_ENABLED=true

# Agent Configuration
SYNC_INTERVAL_MINUTES=15
MAX_CONCURRENT_SYNCS=5
AGENT_TIMEOUT_SECONDS=30
RETRY_ATTEMPTS=3
RETRY_BACKOFF_SECONDS=5

# Rate Limiting (per platform)
GMAIL_RATE_LIMIT_PER_MINUTE=100
GITHUB_RATE_LIMIT_PER_MINUTE=60
SLACK_RATE_LIMIT_PER_MINUTE=50
```

#### 4.2 Platform Registry Extension
**File**: `backend/core/integrations_registry.py` (extend)

**Add Missing Platforms**:
```python
PLATFORMS = {
    # ... existing platforms
    "google_drive": {
        "displayName": "Google Drive",
        "description": "Access and manage files",
        "category": "storage",
        "available": True,
        "oauthProvider": "google",
        "scopes": ["https://www.googleapis.com/auth/drive.readonly"],
        "features": ["documents", "files"],
        "agentClass": "GoogleWorkspaceAgent",
    },
    "google_meet": {
        "displayName": "Google Meet",
        "description": "Create and join video meetings",
        "category": "communication",
        "available": True,
        "oauthProvider": "google",
        "scopes": ["https://www.googleapis.com/auth/meetings"],
        "features": ["calendar", "video"],
        "agentClass": "GoogleWorkspaceAgent",
    },
    "outlook": {
        "displayName": "Outlook",
        "description": "Manage Outlook emails and calendar",
        "category": "communication",
        "available": True,
        "oauthProvider": "microsoft",
        "scopes": ["Mail.Read", "Mail.Send", "Calendars.ReadWrite"],
        "features": ["emails", "calendar"],
        "agentClass": "MicrosoftAgent",
    },
    "microsoft_365": {
        "displayName": "Microsoft 365",
        "description": "Full Microsoft 365 suite integration",
        "category": "productivity",
        "available": True,
        "oauthProvider": "microsoft",
        "scopes": ["Mail.Read", "Files.Read", "Sites.Read.All"],
        "features": ["emails", "documents", "calendar"],
        "agentClass": "MicrosoftAgent",
    },
    "trello": {
        "displayName": "Trello",
        "description": "Manage boards, lists, and cards",
        "category": "productivity",
        "available": True,
        "oauthProvider": "trello",
        "scopes": ["read", "write"],
        "features": ["team", "tasks"],
        "agentClass": "ProductivityAgent",
    },
}
```

### 5. Security Considerations

#### 5.1 Token Management
- All tokens encrypted with `INTEGRATION_TOKEN_ENCRYPTION_KEY` (AES-256)
- Tokens stored in Firestore with field-level encryption
- Token refresh 5 minutes before expiry
- Automatic token revocation on disconnect
- Rate limiting per user per platform

#### 5.2 Scope Minimization
- Request only necessary scopes per platform
- Display scope explanations to users during OAuth
- Allow users to audit granted permissions

#### 5.3 Audit Logging
- Log all OAuth grants/revocations
- Log all data access events
- Log cross-platform workflows
- Store audit logs for 90 days

### 6. Deployment Strategy

#### 6.1 Rollout Phases

**Phase 1: Core Platforms** (Priority 1 - Today)
- Gmail ✓ (already partial)
- Google Calendar ✓ (already partial)
- GitHub ✓ (already partial)
- Slack (complete OAuth + sync)
- Microsoft Outlook (complete OAuth + sync)

**Phase 2: Extended Platforms** (Priority 2)
- Google Drive
- Google Meet
- Microsoft Teams
- Zoom (complete OAuth + sync)

**Phase 3: Project Management** (Priority 3)
- Jira (complete OAuth + sync)
- Notion (complete OAuth + sync)
- Trello (new implementation)

#### 6.2 Monitoring & Observability
- Health check endpoint for each agent
- Prometheus metrics for sync success rate
- Alert on token expiry within 24 hours
- Dashboard for agent performance

### 7. Documentation Requirements

#### 7.1 Developer Documentation
- Agent architecture diagram
- API endpoint documentation
- Testing guide
- Local setup instructions

#### 7.2 User Documentation
- Platform connection guides (one per platform)
- Permission explanations
- Troubleshooting common issues
- Data privacy and security FAQs

## Success Criteria

### Technical
- [ ] All 12 platforms fully connected via OAuth
- [ ] Master agent can orchestrate all workers
- [ ] Data sync works for all platforms
- [ ] 85%+ test coverage
- [ ] All endpoints respond < 500ms (p95)
- [ ] Zero token leaks in logs/errors

### User Experience
- [ ] Users can connect any platform in < 3 clicks
- [ ] Sync status visible in real-time
- [ ] Errors are actionable with clear messages
- [ ] Unified inbox shows data from all sources
- [ ] Health indicators accurate and responsive

### Business
- [ ] All integrations ready for production use
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Deployment guide written

## Timeline (End of Day 2026-08-03)

### Phase 1: Foundation (2 hours)
- Create base agent class
- Implement master agent service
- Extend data models
- Add new API endpoints

### Phase 2: Worker Agents (4 hours)
- Implement GoogleWorkspaceAgent
- Implement MicrosoftAgent
- Implement DevToolsAgent
- Implement CommunicationAgent
- Implement ProductivityAgent

### Phase 3: Frontend Integration (1.5 hours)
- Create useIntegrationAgents hook
- Enhance IntegrationsPage component
- Add health indicators and sync buttons

### Phase 4: Testing (1.5 hours)
- Write unit tests for each agent
- Create integration test suite
- Setup mock data factory

### Phase 5: Final Polish (1 hour)
- Update documentation
- Test end-to-end flows
- Deploy to staging
- Final verification

**Total Estimated Time**: 10 hours

## Dependencies

### External Services Required
1. OAuth credentials for all 12 platforms (documented in setup guide)
2. Redis for rate limiting (already configured)
3. Firebase Firestore for data storage (already configured)

### Python Libraries to Install
```bash
pip install google-api-python-client  # Google Workspace APIs
pip install msal                       # Microsoft Graph (already installed)
pip install PyGithub                   # GitHub API wrapper
pip install slack-sdk                  # Slack API
pip install zoom-api-python            # Zoom API
pip install notion-client              # Notion API
pip install py-trello                  # Trello API
pip install atlassian-python-api       # Jira API
```

### Frontend Libraries (if needed)
```bash
npm install date-fns  # Date formatting for unified views
```

## Risk Mitigation

### Risk 1: OAuth Token Expiry During Sync
**Mitigation**: Implement token refresh with retry logic before each API call

### Risk 2: Rate Limiting from External APIs
**Mitigation**: Implement exponential backoff, respect rate limit headers, queue requests

### Risk 3: Platform API Changes
**Mitigation**: Version lock API client libraries, monitor API changelogs, implement graceful degradation

### Risk 4: Concurrent Sync Conflicts
**Mitigation**: Master agent uses distributed locks (Redis), serializes syncs per user

### Risk 5: Large Data Volumes
**Mitigation**: Implement pagination, incremental sync, data retention policies

## Notes

- This spec follows design-first approach as requested
- All implementations must use 100% Python for backend (requirement confirmed)
- Build must be clean before completion (frontend verification)
- OAuth setup guides exist for Gmail (reference: `GMAIL_INTEGRATION_SETUP.md`)
- Existing architecture patterns (Service → Repository → Model) must be maintained
- No `.md` files created unless requested (this spec is an exception as explicitly requested)
