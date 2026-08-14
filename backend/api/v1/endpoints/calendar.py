from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from services.integration_service import integration_service
from services.workspace_service import workspace_service

router = APIRouter(prefix='/calendar', tags=['calendar'])

@router.get('/events')
async def get_events(current_user=Depends(get_current_user)):
    uid = current_user['uid']
    provider_events = await integration_service.list_user_events(uid)
    workspace_events = await workspace_service.list_calendar_events(uid)
    return {'success': True, 'data': [*provider_events, *workspace_events]}

@router.post('/events')
async def add_event(body: dict, current_user=Depends(get_current_user)):
    uid = current_user['uid']
    event = await integration_service.create_user_event(uid, body)
    if event is None:
        event = await workspace_service.create_calendar_event(uid, body)
    return {'success': True, 'data': event}
