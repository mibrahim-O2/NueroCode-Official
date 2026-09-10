import logging

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import HTTPException, status

from app.config.settings import settings

logger = logging.getLogger(__name__)

_initialized = False


def _ensure_firebase_initialized() -> None:
    """Initializes the Firebase Admin SDK on first use rather than at
    module import time.

    Deferring this means a missing or invalid
    FIREBASE_SERVICE_ACCOUNT_PATH raises a clear, specific error only when
    a login is actually attempted — it no longer crashes the entire
    application's ability to start (health checks, docs, every other
    route).
    """
    global _initialized
    if _initialized or firebase_admin._apps:
        _initialized = True
        return
    try:
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
        _initialized = True
    except Exception as exc:
        logger.error(
            "Firebase Admin SDK initialization failed "
            "(FIREBASE_SERVICE_ACCOUNT_PATH=%r): %s",
            settings.FIREBASE_SERVICE_ACCOUNT_PATH,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Authentication is not configured on this server: the Firebase "
                "service account could not be loaded from "
                f"FIREBASE_SERVICE_ACCOUNT_PATH ({settings.FIREBASE_SERVICE_ACCOUNT_PATH})."
            ),
        ) from exc


def verify_id_token(id_token: str) -> dict:
    """Verifies a Firebase ID token and returns its decoded claims.

    Raises HTTP 401 if the token is missing, invalid, or expired.
    Raises HTTP 500 (once, on first use) if the Firebase Admin SDK is
    misconfigured.
    """
    _ensure_firebase_initialized()
    try:
        return firebase_auth.verify_id_token(id_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token",
        ) from exc
