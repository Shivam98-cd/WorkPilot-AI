# 🚀 WorkPilot AI

**Your AI-Powered Chief of Staff** - An enterprise-grade AI assistant that connects Gmail, Google Calendar, Notion, and more to automate your workflow and boost productivity.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Setup](#-environment-setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🤖 AI-Powered Assistant
- **Interactive Q&A** - AI asks clarifying questions before taking actions
- **Natural Language** - Chat naturally to manage emails, calendar, and tasks
- **Context-Aware** - Remembers your preferences and conversation history
- **Smart Suggestions** - Proactively surfaces insights and recommendations

### 📧 Email Management
- **Gmail Integration** - Read, send, and manage emails
- **Smart Search** - Find emails across date ranges and senders
- **Auto-Summarize** - Get AI-generated summaries of email threads
- **Quick Compose** - Draft emails with AI assistance

### 📅 Calendar & Meetings
- **Google Calendar Sync** - View and create events
- **Smart Scheduling** - Find optimal meeting times automatically
- **Google Meet Links** - Create video meetings with one command
- **Multi-Platform Support** - Google Meet, Zoom, Teams (coming soon)

### 📓 Knowledge Management
- **Notion Integration** - Sync notes, databases, and wikis
- **Cross-Platform Search** - Search across Gmail, Calendar, and Notion
- **Unified Dashboard** - All your data in one place

### 🔒 Enterprise-Grade Security
- **OAuth 2.0** - Secure authentication with Firebase
- **Encrypted Tokens** - AES-256 encryption for API keys
- **Role-Based Access** - User permissions and access control
- **Audit Logging** - Track all AI actions and integrations

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Core language |
| **FastAPI** | 0.115.0 | REST API framework |
| **Uvicorn** | 0.32.0 | ASGI web server |
| **Firebase Admin** | 6.4.0 | Authentication & Firestore |
| **Pydantic** | 2.10.0 | Data validation |
| **Redis** | 5.0.1 | Caching & rate limiting |
| **HTTPX** | 0.26.0 | Async HTTP client |
| **Passlib** | Latest | Password hashing (Argon2) |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.0+ | UI framework |
| **Vite** | 8.1.1 | Build tool & dev server |
| **Firebase JS SDK** | 12.16.0 | Client-side auth |
| **React Icons** | 5.7.0 | Icon library |
| **Oxlint** | 1.71.0 | Fast linter |

### Database & Services
| Service | Purpose |
|---------|---------|
| **Firebase Firestore** | NoSQL database for users & integrations |
| **Firebase Authentication** | User authentication (Email, Google, Microsoft) |
| **Redis** | Session caching & rate limiting |
| **Gmail API** | Email integration |
| **Google Calendar API** | Calendar integration |
| **Notion API** | Knowledge base integration |
| **Groq AI** | LLM inference (Llama 3) |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** - [Download here](https://www.python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **Redis** (optional) - [Download here](https://redis.io/download)
- **Firebase Account** - [Create here](https://firebase.google.com/)
- **Google Cloud Console Account** - [For OAuth credentials](https://console.cloud.google.com/)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Shivam98-cd/WorkPilot-AI.git
cd WorkPilot-AI
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your credentials (see Environment Setup section below)
```

### 3. Frontend Setup

```bash
# Navigate to frontend (from project root)
cd Frontend

# Install dependencies
npm install

# Create environment file
# Create a file named .env.local and add your Firebase config (see below)
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
# Backend runs at http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
# Frontend runs at http://localhost:5173
```

### 5. Open Your Browser

Navigate to **http://localhost:5173** and create your account!

---

## 🔐 Environment Setup

### Backend Environment (`backend/.env`)

Create `backend/.env` file with the following variables:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Firebase Database
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# JWT Settings
JWT_SECRET_KEY=your-super-secret-jwt-key-here-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google OAuth (for Gmail & Calendar)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/integrations/google_calendar/callback

# Notion Integration
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret
NOTION_REDIRECT_URI=http://localhost:8000/api/v1/integrations/notion/callback

# Groq AI API
GROQ_API_KEY=your-groq-api-key

# Redis (Optional - for caching)
REDIS_URL=redis://localhost:6379/0

# Frontend URL
FRONTEND_URL=http://localhost:5173
FRONTEND_OAUTH_REDIRECT=http://localhost:5173

# Encryption Key (32 bytes, base64 encoded)
ENCRYPTION_KEY=your-32-byte-base64-encryption-key

# CORS Settings
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Environment
ENVIRONMENT=development
```

#### How to Get Credentials:

1. **Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a project → Settings → Service Accounts
   - Generate private key → Copy values to `.env`

2. **Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Gmail API and Google Calendar API
   - Create OAuth 2.0 credentials → Copy Client ID & Secret

3. **Notion:**
   - Go to [Notion Integrations](https://www.notion.so/my-integrations)
   - Create integration → Copy Client ID & Secret

4. **Groq AI:**
   - Go to [Groq Console](https://console.groq.com/)
   - Generate API key

5. **Encryption Key:**
   ```bash
   # Generate a secure encryption key:
   python -c "import base64, os; print(base64.urlsafe_b64encode(os.urandom(32)).decode())"
   ```

---

### Frontend Environment (`Frontend/.env.local`)

Create `Frontend/.env.local` file:

```env
# Firebase Client SDK
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API Base URL
VITE_API_BASE_URL=http://localhost:8000
```

Get Firebase client config from Firebase Console → Project Settings → General → Your apps → Web app config.

---

## 🏃 Running the Application

### Development Mode

**Backend:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd Frontend
npm run dev
```

### Production Mode

**Backend:**
```bash
cd backend
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Frontend:**
```bash
cd Frontend
npm run build
npm run preview
```

### Using Docker (Optional)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access at http://localhost:5173
```

---

## 📁 Project Structure

```
WorkPilot-AI/
├── backend/                      # FastAPI Backend
│   ├── api/                      # API endpoints
│   │   └── v1/                   # API version 1
│   │       ├── endpoints/        # Route handlers
│   │       │   ├── ai_chat.py    # AI chat & SuperBrain
│   │       │   ├── auth.py       # Authentication
│   │       │   ├── integrations.py # OAuth integrations
│   │       │   ├── emails.py     # Email management
│   │       │   └── calendar.py   # Calendar operations
│   │       └── router.py         # API router
│   ├── core/                     # Core configuration
│   │   ├── config.py             # Settings (Pydantic)
│   │   ├── security.py           # JWT & encryption
│   │   └── exceptions.py         # Custom exceptions
│   ├── firebase/                 # Firebase integration
│   │   ├── admin_config.py       # Admin SDK init
│   │   ├── auth.py               # Auth helpers
│   │   └── firestore.py          # Firestore helpers
│   ├── middleware/               # Custom middleware
│   │   ├── auth.py               # JWT verification
│   │   ├── logging.py            # Request logging
│   │   └── rate_limit.py         # Rate limiting
│   ├── models/                   # Domain models
│   │   ├── user.py               # User model
│   │   └── integration.py        # Integration model
│   ├── repositories/             # Data access layer
│   │   ├── user_repository.py    # User data access
│   │   └── integration_repository.py # Integration data access
│   ├── schemas/                  # Pydantic schemas
│   │   ├── auth.py               # Auth schemas
│   │   └── user.py               # User schemas
│   ├── services/                 # Business logic
│   │   ├── auth_service.py       # Authentication logic
│   │   ├── integration_service.py # Integration logic
│   │   └── superbrain/           # AI orchestration
│   │       ├── orchestrator.py   # Main orchestrator
│   │       ├── intent_classifier.py # Intent detection
│   │       ├── memory.py         # Conversation memory
│   │       └── critic.py         # Error analysis
│   ├── main.py                   # FastAPI app entry
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment template
│
├── Frontend/                     # React Frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── AICockpit.jsx     # AI chat interface
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   └── Pages.jsx         # All pages (Integrations, etc.)
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── useIntegrationAgents.js # Integration state
│   │   ├── services/             # API services
│   │   │   └── firebase.js       # Firebase client
│   │   ├── api.js                # API client
│   │   ├── App.jsx               # Main app component
│   │   └── main.jsx              # Entry point
│   ├── public/                   # Static assets
│   ├── index.html                # HTML template
│   ├── package.json              # NPM dependencies
│   ├── vite.config.js            # Vite configuration
│   └── .env.local                # Environment variables
│
├── .gitignore                    # Git ignore rules
├── README.md                     # This file
└── LICENSE                       # MIT License
```

---

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/integrations` | GET | List all integrations |
| `/api/v1/integrations/{platform}/authorize` | GET | Start OAuth flow |
| `/api/v1/ai/superchat` | POST | Chat with AI assistant |
| `/api/v1/emails` | GET | Get emails from Gmail |
| `/api/v1/calendar/events` | GET | Get calendar events |

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd Frontend
npm run test
```

### Integration Tests

See `AI_COCKPIT_INTEGRATION_TESTS.md` for 26 comprehensive test cases.

---

## 🚢 Deployment

### Backend Deployment

**Options:**
- **Heroku:** `git push heroku main`
- **AWS ECS:** Use Docker container
- **Google Cloud Run:** Deploy container
- **Vercel:** Deploy with Vercel CLI

**Environment Variables:** Set all `.env` variables in your hosting platform.

### Frontend Deployment

**Options:**
- **Vercel:** `vercel --prod`
- **Netlify:** `netlify deploy --prod`
- **Firebase Hosting:** `firebase deploy`
- **AWS S3 + CloudFront:** Static hosting

**Build Command:**
```bash
npm run build
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Python:** Follow PEP 8, use `black` for formatting
- **JavaScript:** Use ES6+, follow Airbnb style guide
- **Commits:** Use conventional commits format

---

## 🐛 Troubleshooting

### Common Issues

**1. Backend won't start:**
```bash
# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

**2. Frontend won't start:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**3. OAuth redirect issues:**
- Make sure `GOOGLE_REDIRECT_URI` in `.env` matches Google Cloud Console
- Check `FRONTEND_OAUTH_REDIRECT` points to your frontend URL

**4. Firebase connection errors:**
- Verify Firebase service account credentials
- Check Firebase project ID matches
- Ensure Firestore is enabled in Firebase Console

**5. Redis connection errors:**
- Start Redis: `redis-server`
- Or set `REDIS_URL=` (empty) to disable Redis

---

## 📖 Documentation

- [AGENTS.md](AGENTS.md) - Agent system documentation
- [COMPREHENSIVE_INTEGRATION_TESTS.md](COMPREHENSIVE_INTEGRATION_TESTS.md) - Test cases
- [AGENTS.md](AGENTS.md) - Development guidelines for AI agents

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://reactjs.org/) - UI library
- [Firebase](https://firebase.google.com/) - Backend services
- [Groq](https://groq.com/) - Fast AI inference
- [Vite](https://vitejs.dev/) - Lightning-fast build tool

---

## 📧 Support

- **Email:** support@workpilot-ai.com
- **GitHub Issues:** [Report a bug](https://github.com/Shivam98-cd/WorkPilot-AI/issues)
- **Discussions:** [Join the conversation](https://github.com/Shivam98-cd/WorkPilot-AI/discussions)

---

## 🌟 Star History

If you find this project useful, please give it a star! ⭐

---

<div align="center">
  <p>Made with ❤️ by the WorkPilot AI Team</p>
  <p>© 2026 WorkPilot AI. All rights reserved.</p>
</div>
