from fastapi import APIRouter, Depends

from app.middleware.auth_middleware import get_current_user
from app.schemas.proctoring_schemas import (
    CameraCheckRequest,
    CameraCheckResponse,
    KeystrokeCheckRequest,
    KeystrokeCheckResponse,
)
from app.services.proctoring_service import check_camera_frame, check_keystroke_rhythm

router = APIRouter(prefix="/proctoring", tags=["proctoring"])


@router.post("/camera-check", response_model=CameraCheckResponse)
async def camera_check(payload: CameraCheckRequest, current_user: dict = Depends(get_current_user)):
    return check_camera_frame(payload.frame)


@router.post("/keystroke-check", response_model=KeystrokeCheckResponse)
async def keystroke_check(payload: KeystrokeCheckRequest, current_user: dict = Depends(get_current_user)):
    return check_keystroke_rhythm(payload.intervals_ms)