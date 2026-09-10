from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from app.utils.jwt_utils import decode_access_token
from app.database.repositories import get_full_user_by_id

bearer_scheme = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    token = credentials.credentials
    try:
        claims = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")

    # The `role` claim in the JWT is a snapshot from login time and can be
    # stale for hours (e.g. an admin demoted mid-session). RBAC must use
    # the CURRENT role, so it is re-read from the database on every
    # authenticated request. The extra DB read is a deliberate, accepted
    # tradeoff for correctness.
    fresh_user = get_full_user_by_id(claims.get("id"))
    if not fresh_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account no longer exists")
    claims["role"] = fresh_user["role"]
    return claims


def require_role(*allowed_roles: str):
    """Dependency factory for Role-Based Access Control (Permission Matrix, §6)."""

    def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return dependency