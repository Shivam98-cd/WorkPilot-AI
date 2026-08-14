from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from services.workspace_service import workspace_service

router = APIRouter(prefix='/analytics', tags=['analytics'])

@router.get('/summary')
async def get_summary(current_user=Depends(get_current_user)):
    return {'success': True, 'data': await workspace_service.analytics_summary(current_user['uid'])}
