# WorkPilot AI - Agent Guidance

This document provides essential information for AI coding agents working on the WorkPilot AI project. It covers project structure, technology stack, build/test procedures, coding conventions, and deployment.

## Project Overview
WorkPilot AI is an enterprise-grade authentication and workplace automation platform with a FastAPI backend and React/Vite frontend. It uses Firebase for authentication and data storage, with Redis for caching/rate limiting.

## Technology Stack

### Backend
- **Framework**: FastAPI 0.115.0
- **Server**: Uvicorn 0.32.0
- **Authentication**: Firebase Admin SDK 6.4.0, JWT (HS256)
- **Password Hashing**: Passlib with Argon2
- **Validation**: Pydantic 2.10.0
- **HTTP Client**: HTTPX 0.26.0
- **Rate Limiting**: SlowAPI 0.1.9 + Redis 5.0.1
- **Environment**: Python-dotenv 1.0.1
- **OAuth**: MSAL 1.28.0, Requests-OAuthLib 2.0.0
- **Email**: Python-Multipart 0.0.9, Email-Validator 2.1.0
- **Utilities**: Python-Dateutil 2.8.2, Pytz 2024.1

### Frontend
- **Framework**: React 19.2.7
- **Build Tool**: Vite 8.1.1
- **Styling**: Standard CSS/CSS Modules
- **Icons**: React-Icons 5.7.0
- **State**: React Hooks (useState, useEffect, Context)
- **Firebase**: Firebase JS SDK 12.16.0
- **Linting**: Oxlint 1.71.0

### Database & Infrastructure
- **Primary Database**: Firebase Firestore (NoSQL)
- **Caching/Rate Limiting**: Redis
- **Authentication Providers**: Email/Password, Google OAuth, Microsoft OAuth
- **Email Service**: SMTP (configured via environment)

## Project Structure

```
/ (root)
├── backend/                 # FastAPI backend
│   ├── api/                 # API routes and endpoints
│   │   └── v1/              # API version 1
│   │       ├── endpoints/   # Route handlers (auth, users, integrations, etc.)
│   │       └── router.py    # API router assembly
│   ├── core/                # Core configuration and exceptions
│   │   ├── config.py        # Pydantic settings
│   │   └── exceptions.py    # Custom exception classes
│   ├── firebase/            # Firebase initialization and services
│   │   ├── admin_config.py  # Firebase Admin SDK initialization
│   │   ├── auth.py          # Firebase auth helpers
│   │   └── firestore.py     # Firestore helpers
│   ├── middleware/          # Custom middleware/rate limiting)
│   │   ├── auth.py          # JWT auth middleware
│   │   ├── logging.py       # Request logging middleware
│   │   └── rate_limit.py    # SlowAPI Redis rate limiter
│   ├── models/              # Pydantic models (data schemas)
│   ├── repositories/        # Data access layer (Firestore wrappers)
│   ├── schemas/             # Pydantic schemas (request/response validation)
│   ├── services/            # Business logic layer
│   │   ├── auth_service.py  # Authentication business logic
│   │   ├── user_service.py  # User management
│   │   └── audit_service.py # Audit logging
│   ├── tests/               # Pytest test suite
│   │   ├── conftest.py      # Pytest fixtures
│   │   └── test_auth.py     # Authentication service tests
│   ├── main.py              # FastAPI application entrypoint
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
│
├── Frontend/                # React/Vite frontend
│   ├── src/                 # Source code
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # Firebase/API service wrappers
│   │   ├── utils/           # Utility functions
│   │   ├── context/         # React context providers
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # React entry point
│   ├── public/              # Static assets
│   ├── index.html           # HTML template
│   ├── package.json         # NPM dependencies and scripts
│   ├── .env.local           # Environment variables (gitignored)
│   └── .oxlintrc.json       # Oxlint configuration
│
├── DEPLOYMENT_GUIDE.py      # Deployment instructions (script)
├── PROJECT_SUMMARY.py       # Project summary (script)
├── QUICK_START.py           # Quick start guide (script)
└── SETUP_INSTRUCTIONS.py    # Setup instructions (script)
```

## Build & Run Commands

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload          # Development with auto-reload
# OR for production:
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd Frontend
npm install
npm run dev                      # Vite dev server (http://localhost:5173)
npm run build                    # Production build (output to dist/)
npm run preview                  # Preview production build
```

### Environment Setup
1. Copy `backend/.env.example` to `backend/.env` and fill in values
2. For frontend, create `Frontend/.env.local` with Firebase config:
   ```
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Code Organization

### Backend Layers
1. **API Layer** (`api/v1/endpoints/*`): HTTP route handlers, request/response formatting
2. **Service Layer** (`services/*`): Business logic, orchestrates repositories and external services
3. **Repository Layer** (`repositories/*`): Data access abstraction over Firebase/Firestore
4. **Model/Schema Layer** (`models/*`, `schemas/*`): Pydantic models for data validation and serialization
5. **Middleware** (`middleware/*`): Custom ASGI middleware (auth, logging, rate limiting)
6. **Core** (`core/*`): Application configuration, exception handling
7. **Firebase Integration** (`firebase/*`): Firebase Admin SDK initialization and helpers

### Frontend Structure
- **Components**: Reusable UI elements (buttons, forms, modals)
- **Pages**: Route-specific views (login, dashboard, settings)
- **Services**: Firebase initialization, API service wrappers
- **Hooks**: Custom React hooks for auth, data fetching, etc.
- **Context**: React context for global state (auth, user preferences)
- **Utils**: Helper functions, constants, formatters

## Testing Strategy

### Backend
- **Framework**: Pytest (version inferred from test files)
- **Test Location**: `backend/tests/`
- **Mocking**: `unittest.mock` (AsyncMock, MagicMock, patch)
- **Fixtures**: Defined in `conftest.py` for reusable mock objects
- **Test Types**: Unit tests for services with mocked dependencies
- **Running Tests**:
  ```bash
  cd backend
  pytest                    # Runs all tests
  pytest -v                 # Verbose output
  pytest tests/test_auth.py # Specific test file
```

### Frontend
- **Testing Framework**: Not configured in current setup (no test files visible)
- **Recommendation**: Consider adding Vitest or Jest for component testing

## Code Style Guidelines

### Backend (Python)
- **Formatter**: Not explicitly configured (consider Black or Ruff)
- **Linter**: Not explicitly configured (consider Ruff or Flake8)
- **Type Hints**: Use Pydantic for data validation, type hints for functions
- **Imports**: Standard -> Third-party -> Local
- **Naming**: 
  - Classes: PascalCase
  - Functions/variables: snake_case
  - Constants: UPPER_SNAKE_CASE
- **Docstrings**: Triple-quoted strings for modules, classes, functions
- **Async**: Use `async/await` for I/O-bound operations (Firebase, HTTP)

### Frontend (JavaScript/React)
- **Linter**: Oxlint (configured via `.oxlintrc.json`)
- **Formatting**: Prefer Prettier (not explicitly configured but recommended)
- **Naming**: 
  - Components: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE
- **Hooks**: Use `use` prefix for custom hooks
- **Firebase**: Initialize once in a service module
- **State**: Prefer React hooks (useState, useEffect, useContext) over prop drilling
- **Error Handling**: Use try/catch for async operations, error boundaries for UI

## Security Considerations

### Authentication & Authorization
- Firebase Auth handles user authentication (email/password, OAuth)
- Backend verifies Firebase ID tokens via middleware (`middleware/auth.py`)
- JWT tokens used for session management (access token: 15 min, refresh token: 7 days)
- Passwords hashed with Argon2 via Passlib
- Role-based access control (RBAC) implemented in services

### Data Protection
- Firebase Firestore security rules should restrict data access
- Sensitive data (API keys, secrets) stored in environment variables
- HTTPS enforced in production
- CORS configured via environment variables (`ALLOWED_ORIGINS`)

### Rate Limiting & Abuse Prevention
- Redis-backed rate limiting via SlowAPI (`middleware/rate_limit.py`)
- Configurable limits per endpoint/IP
- Brute-force protection on auth endpoints

### Dependencies
- Regular dependency updates recommended (`pip list --outdated`, `npm outdated`)
- Security scanning via tools like `safety` (Python) and `npm audit`

## Deployment

### Backend
- **Platforms**: Any service that runs Python/FastAPI (Heroku, AWS ECS, Docker, Vercel, etc.)
- **Process**: 
  1. Install dependencies: `pip install -r requirements.txt`
  2. Set environment variables (see `.env.example`)
  3. Run: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Docker**: Consider multi-stage build with `python:3.11-slim` base

### Frontend
- **Build**: `npm run build` produces static assets in `dist/`
- **Deployment**: Any static site host (Netlify, Vercel, AWS S3+CloudFront, Firebase Hosting)
- **Environment**: Runtime configuration via public env vars (VITE_* prefix)

### Infrastructure
- **Firebase Project**: Required for Auth and Firestore
- **Redis**: Required for rate limiting (can be Redis Labs, AWS Elasticache, etc.)
- **Email**: SMTP service required for transactional emails (Gmail, SendGrid, etc.)

> **Note**: For detailed step-by-step deployment instructions, see [DEPLOYMENT_GUIDE.py](d:\workpilot-ai\DEPLOYMENT_GUIDE.py). For a quick start guide, see [QUICK_START.py](d:\workpilot-ai\QUICK_START.py). For comprehensive setup instructions, see [SETUP_INSTRUCTIONS.py](d:\workpilot-ai\SETUP_INSTRUCTIONS.py).

## Development Workflow

1. **Feature Branch**: Create branch from `main`
2. **Development**: Write code with corresponding tests
3. **Testing**: Run backend tests (`pytest`), manually test frontend
4. **Linting**: Run `oxlint` on frontend, consider adding Python linter
5. **Commit**: Use conventional commits format
6. **Pull Request**: Request review, ensure CI passes
7. **Merge**: Squash merge into `main`
8. **Deploy**: Trigger CI/CD pipeline or manual deployment

## Known Limitations & Future Work

### Current Limitations
1. Frontend lacks automated testing setup
2. No CI/CD pipeline configured in repository
3. Docker configuration not present
4. API versioning could be more robust (header-based)
5. Limited input validation on some endpoints (relying on Pydantic helps)

### Suggested Improvements
1. Add backend linting/formatting (Ruff/Black)
2. Implement frontend testing with Vitest/Jest
3. Add GitHub Actions CI for testing and linting
4. Create Dockerfiles for both frontend and backend
5. Implement OpenAPI/Swagger enhancements (examples, security schemes)
6. Add comprehensive API documentation with examples
7. Consider implementing WebSocket support for real-time features
8. Add comprehensive logging structure with correlation IDs

## Important Files Reference

- **Backend Entry Point**: `backend/main.py`
- **Frontend Entry Point**: `Frontend/src/main.jsx`
- **Firebase Config (Backend)**: `backend/firebase/admin_config.py`
- **Firebase Config (Frontend)**: `Frontend/src/services/firebase.js` (or similar)
- **API Routes**: `backend/api/v1/endpoints/`
- **Business Logic**: `backend/services/`
- **Data Models**: `backend/models/` and `backend/schemas/`
- **Tests**: `backend/tests/`
- **Environment Template**: `backend/.env.example`

This document should be kept up-to-date as the project evolves. When making significant changes to architecture, dependencies, or processes, update this file accordingly.