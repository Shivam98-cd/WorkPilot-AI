"""
Application Configuration using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    PROJECT_NAME: str = "WorkPilot AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    
    # Firebase
    FIREBASE_PROJECT_ID: str
    FIREBASE_PRIVATE_KEY_ID: str
    FIREBASE_PRIVATE_KEY: str
    FIREBASE_CLIENT_EMAIL: str
    FIREBASE_CLIENT_ID: str
    FIREBASE_AUTH_URI: str = "https://accounts.google.com/o/oauth2/auth"
    FIREBASE_TOKEN_URI: str = "https://oauth2.googleapis.com/token"
    FIREBASE_AUTH_PROVIDER_CERT_URL: str = "https://www.googleapis.com/oauth2/v1/certs"
    FIREBASE_CLIENT_CERT_URL: str
    
    # JWT
    JWT_SECRET_KEY: str
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
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
