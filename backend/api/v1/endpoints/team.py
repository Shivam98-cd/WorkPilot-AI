from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from services.workspace_service import workspace_service

router = APIRouter(prefix='/team', tags=['team'])

@router.get('/members')
async def get_members(current_user=Depends(get_current_user)):
    uid = current_user['uid']
    return {'success': True, 'data': await workspace_service.list_team_members(uid)}

@router.post('/members')
async def create_member(body: dict, current_user=Depends(get_current_user)):
    return {'success': True, 'data': await workspace_service.create_team_member(current_user['uid'], body)}

@router.put('/members/{member_id}')
async def update_member(member_id: str, body: dict, current_user=Depends(get_current_user)):
    uid = current_user['uid']
    return {'success': True, 'data': await workspace_service.update_team_member(current_user['uid'], member_id, body)}
