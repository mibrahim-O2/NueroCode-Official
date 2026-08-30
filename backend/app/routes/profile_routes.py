from fastapi import APIRouter, Depends

from app.middleware.auth_middleware import get_current_user
from app.schemas.profile_schemas import UpdateProfileRequest, UpdatePreferencesRequest
from app.database.repositories import update_user_profile, update_user_preferences

router = APIRouter(prefix="/profile", tags=["profile"])


@router.patch("/me")
async def update_profile(payload: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    return update_user_profile(current_user["id"], payload.dict(exclude_unset=True))


@router.patch("/me/preferences")
async def update_preferences(payload: UpdatePreferencesRequest, current_user: dict = Depends(get_current_user)):
    return update_user_preferences(current_user["id"], payload.preferences)