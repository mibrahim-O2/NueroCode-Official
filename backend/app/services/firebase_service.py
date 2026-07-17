import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import HTTPException, status

from app.config.settings import settings

if not firebase_admin._apps:
    cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)


def verify_id_token(id_token: str) -> dict:
    """Verifies a Firebase ID token and returns its decoded claims.

    Raises HTTP 401 if the token is missing, invalid, or expired.
    """
    try:
        return firebase_auth.verify_id_token(id_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token",
        ) from exc