from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import get_current_user
from app.database.repositories import get_credentials_for_user, get_credential_with_owner

router = APIRouter(tags=["credentials"])


@router.get("/credentials/mine")
async def my_credentials(current_user: dict = Depends(get_current_user)):
    return get_credentials_for_user(current_user["id"])


@router.get("/verify/{verify_uuid}")
async def verify_credential(verify_uuid: str):
    # Intentionally public — no auth dependency. A recruiter with just the
    # link or QR code can verify a credential, no NeuroCode account needed.
    result = get_credential_with_owner(verify_uuid)
    if not result:
        raise HTTPException(status_code=404, detail="Credential not found")
    return result