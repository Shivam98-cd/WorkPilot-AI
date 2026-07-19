"""
User API Endpoints
"""
from fastapi import APIRouter, Depends
from schemas.user import UserResponse, UpdateProfileRequest
from schemas.responses import ApiResponse
from services.user_service import user_service
from middleware.auth import get_current_user


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=ApiResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    uid = current_user.get('uid')
    user = await user_service.get_user_profile(uid)
    
    return {
        "success": True,
        "data": user,
    }


@router.put("/profile", response_model=ApiResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update current user profile"""
    uid = current_user.get('uid')
    
    update_data = {}
    if request.name:
        update_data['name'] = request.name
    if request.photo:
        update_data['photo'] = request.photo
    if request.preferences:
        update_data['preferences'] = request.preferences.dict()
    
    user = await user_service.update_user_profile(uid, update_data)
    
    return {
        "success": True,
        "data": user,
        "message": "Profile updated successfully",
    }


@router.delete("/profile", response_model=ApiResponse)
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Delete user account"""
    uid = current_user.get('uid')
    await user_service.delete_user(uid)
    
    return {
        "success": True,
        "message": "Account deleted successfully",
    }
