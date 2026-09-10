from fastapi import APIRouter, Depends, HTTPException

from app.schemas.auth_schemas import LoginRequest, LoginResponse, UserOut
from app.services.firebase_service import verify_id_token
from app.services.supabase_service import get_or_create_user
from app.utils.jwt_utils import create_access_token
from app.middleware.auth_middleware import get_current_user
from app.database.repositories import get_full_user_by_id

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
    # Root fix for the admin-reset UI sync issue: this now queries the
    # database directly instead of returning the JWT's decoded claims.
    # The JWT's xp/level/streak are a snapshot taken at login time — if
    # an admin resets this user's data afterward, the old token would
    # otherwise keep reporting stale numbers until the user logs out and
    # back in. Fetching fresh on every /auth/me call means a simple page
    # reload is enough to see the real current state.
    fresh_user = get_full_user_by_id(current_user["id"])
    if not fresh_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(**fresh_user)