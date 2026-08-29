from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import get_current_user
from app.services.solution_service import get_official_solution
from app.ai.gemini_provider import GeminiQuotaExceededError

router = APIRouter(prefix="/problems", tags=["solutions"])


@router.get("/{problem_id}/solution")
async def solution(problem_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return get_official_solution(current_user["id"], problem_id)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except GeminiQuotaExceededError as exc:
        # Was previously uncaught here, unlike problem_routes.py and
        # interview_routes.py — turned an expected, already-handled
        # condition into an unhandled 500 instead of a clean 429.
        raise HTTPException(status_code=429, detail=str(exc))