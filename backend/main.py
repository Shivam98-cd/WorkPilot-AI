"""
WorkPilot AI - FastAPI Backend
Enterprise-grade authentication system
"""
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    initialize_firebase()
    print(f"🚀 {settings.PROJECT_NAME} v{settings.VERSION} started")
    print(f"📝 API Documentation: http://localhost:8000/docs")
    yield
    print(f"👋 {settings.PROJECT_NAME} shutting down")


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
