"""
API V1 Router - Combines all endpoint routers
"""
from fastapi import APIRouter
from api.v1.endpoints import auth, users, emails, calendar, team, deployments, documents, analytics, integrations, ai_chat, microsoft, github, dashboard, notifications, search

api_router = APIRouter()

for r in [auth.router, users.router, emails.router, calendar.router, team.router, deployments.router, documents.router, analytics.router, integrations.router, ai_chat.router, dashboard.router, notifications.router, search.router]:
    api_router.include_router(r)
api_router.include_router(microsoft.router, prefix="/auth", tags=["Microsoft OAuth"])
api_router.include_router(github.router, prefix="/auth", tags=["GitHub OAuth"])
