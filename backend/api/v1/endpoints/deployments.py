"""Deployment data endpoints."""
from fastapi import APIRouter, Depends

from middleware.auth import get_current_user
from services.integration_service import integration_service
from services.workspace_service import workspace_service


router = APIRouter(prefix="/deployments", tags=["deployments"])


@router.get("")
async def get_deployments(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    github = await integration_service.list_user_deployments(uid)
    workspace = await workspace_service.list_records(workspace_service.DEPLOYMENTS, uid)
    return {"success": True, "data": [*github, *workspace]}


@router.get("/{pipeline_id}/logs")
async def get_logs(pipeline_id: str, current_user=Depends(get_current_user)):
    deployment = await workspace_service.get_record(workspace_service.DEPLOYMENTS, current_user["uid"], pipeline_id)
    return {"success": True, "data": deployment.get("logs", [])}
