from fastapi import APIRouter, Depends

from app.schemas.auth_schemas import LoginRequest, LoginResponse, UserOut
from app.services.firebase_service import verify_id_token
from app.services.supabase_service import get_or_create_user
from app.utils.jwt_utils import create_access_token
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    decoded = verify_id_token(payload.id_token)

    firebase_uid = decoded["uid"]
    email = decoded.get("email", "")
    name = decoded.get("name") or (email.split("@")[0] if email else "NeuroCode User")
    avatar_url = decoded.get("picture")

    user = get_or_create_user(firebase_uid, email, name, avatar_url)

    token_payload = {
        "id": user["id"],
        "firebase_uid": user["firebase_uid"],
        "name": user["name"],
        "email": user["email"],
        "avatar_url": user.get("avatar_url"),
        "role": user["role"],
        "xp": user["xp"],
        "level": user["level"],
        "streak": user["streak"],
    }
    access_token = create_access_token(token_payload)

    return LoginResponse(access_token=access_token, user=UserOut(**user))


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return UserOut(**current_user)