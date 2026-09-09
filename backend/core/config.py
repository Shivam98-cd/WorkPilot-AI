"""
Application Configuration using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List, Optional
import os



class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    PROJECT_NAME: str = "WorkPilot AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    
    # Firebase (default placeholder values for testing)
    FIREBASE_PROJECT_ID: str = "test-project"
    FIREBASE_PRIVATE_KEY_ID: str = "test-key-id"
    FIREBASE_PRIVATE_KEY: str = "test-private-key"
    FIREBASE_CLIENT_EMAIL: str = "test@example.com"
    FIREBASE_CLIENT_ID: str = "test-client-id"
    FIREBASE_AUTH_URI: str = "https://accounts.google.com/o/oauth2/auth"
    FIREBASE_TOKEN_URI: str = "https://oauth2.googleapis.com/token"
    FIREBASE_AUTH_PROVIDER_CERT_URL: str = "https://www.googleapis.com/oauth2/v1/certs"
    FIREBASE_CLIENT_CERT_URL: str = "https://www.googleapis.com/oauth2/v1/certs"
    
    # JWT
    JWT_SECRET_KEY: str = "test-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    ALLOWED_HOSTS: str = "*"
    
    # Redis (optional)
    REDIS_URL: str = "redis://localhost:6379"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Email (optional)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@workpilot.ai"

    # Microsoft OAuth settings
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""
    MICROSOFT_TENANT_ID: str = ""

    # GitHub OAuth settings
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    # Slack OAuth settings
    SLACK_CLIENT_ID: str = ""
    SLACK_CLIENT_SECRET: str = ""

    # Zoom OAuth settings
    ZOOM_CLIENT_ID: str = ""
    ZOOM_CLIENT_SECRET: str = ""
    # Zoom rejects 'localhost' — must use http://127.0.0.1 for local dev
    ZOOM_REDIRECT_URI: str = "http://127.0.0.1:8000/api/v1/integrations/zoom/callback"

    # Groq LLM
    GROQ_API_KEY: str = ""

    # Notion OAuth settings
    NOTION_CLIENT_ID: str = ""
    NOTION_CLIENT_SECRET: str = ""

    # Jira OAuth settings
    JIRA_CLIENT_ID: str = ""
    JIRA_CLIENT_SECRET: str = ""

    # Google OAuth (Gmail, Calendar, Drive, Meet integrations)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Trello OAuth settings
    TRELLO_API_KEY: str = ""
    TRELLO_API_SECRET: str = ""

    # Integration OAuth redirects
    BACKEND_PUBLIC_URL: str = "http://localhost:8000"
    FRONTEND_OAUTH_REDIRECT: str = "http://localhost:5173/dashboard"
    INTEGRATION_TOKEN_ENCRYPTION_KEY: str = ""

    # Agent configuration
    SYNC_INTERVAL_MINUTES: int = 15
    MAX_CONCURRENT_SYNCS: int = 5
    AGENT_TIMEOUT_SECONDS: int = 30
    EXTERNAL_REQUEST_TIMEOUT_SECONDS: float = 10.0
    RETRY_ATTEMPTS: int = 3
    RETRY_BACKOFF_SECONDS: int = 5

    # Firestore database name — Enterprise edition uses 'default', Standard uses '(default)'
    FIRESTORE_DATABASE: str = "default"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert ALLOWED_ORIGINS string to list"""
        if isinstance(self.ALLOWED_ORIGINS, str):
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
        return self.ALLOWED_ORIGINS
    
    @property
    def allowed_hosts_list(self) -> List[str]:
        """Convert ALLOWED_HOSTS string to list"""
        if isinstance(self.ALLOWED_HOSTS, str):
            return [host.strip() for host in self.ALLOWED_HOSTS.split(",")]
        return self.ALLOWED_HOSTS
    
    # AI LLM Provider keys
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    class Config:
        env_file = Path(__file__).resolve().parent.parent / ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()

