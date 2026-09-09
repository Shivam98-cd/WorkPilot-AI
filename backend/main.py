"""
WorkPilot AI - FastAPI Backend
Enterprise-grade authentication system
"""
# ── SSL fix (Windows) ──────────────────────────────────────────────────────────
# Python on Windows often lacks the system CA bundle that Google APIs require.
# Patching the default SSL context to use certifi's trusted CA bundle BEFORE
# any other import eliminates the CERTIFICATE_VERIFY_FAILED errors that caused
# Firebase token verification to hang for 287+ seconds.
import ssl, os
try:
    import certifi
    _ca = certifi.where()
    os.environ.setdefault("SSL_CERT_FILE", _ca)
    os.environ.setdefault("REQUESTS_CA_BUNDLE", _ca)
    # Patch the default HTTPS context used by httpx, requests, urllib3, grpc
    ssl._create_default_https_context = lambda: ssl.create_default_context(cafile=_ca)
except ImportError:
    pass  # certifi not installed — proceed without patch
# ──────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from core.config import settings
from core.exceptions import AppException
from middleware.logging import LoggingMiddleware
from middleware.rate_limit import RateLimitMiddleware
from api.v1.router import api_router
from firebase.admin_config import initialize_firebase


from services.automation_runner import start_automation_scheduler, stop_automation_scheduler
from services.integration_service import startup_http_client, shutdown_http_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    initialize_firebase()
    await startup_http_client()          # pre-warm shared HTTP connection pool
    start_automation_scheduler()
    print(f"{settings.PROJECT_NAME} v{settings.VERSION} started")
    print(f"API Documentation: http://localhost:8000/docs")
    yield
    stop_automation_scheduler()
    await shutdown_http_client()         # close shared HTTP client cleanly
    print(f"{settings.PROJECT_NAME} shutting down")



app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade AI Workplace Automation Authentication API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Trusted Host Middleware
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.allowed_hosts_list,
    )

# Custom Middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

# Global Exception Handler
@app.exception_handler(AppException)
async def app_exception_handler(request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        },
    )

# API Router
app.include_router(api_router, prefix=settings.API_PREFIX)

# Health Check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }

# Root Endpoint
@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": settings.VERSION,
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
