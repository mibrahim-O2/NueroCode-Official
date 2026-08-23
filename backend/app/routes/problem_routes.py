from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth_middleware import get_current_user
from app.services.problem_service import generate_problem
from app.services.piston_service import PistonRuntimeUnavailableError, PistonExecutionError
from app.ai.gemini_provider import GeminiQuotaExceededError
from app.utils.provider_access import validate_provider_request

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("/generate")
async def generate(
    topic: str = Query(..., min_length=1),
    difficulty: str = Query("medium", pattern="^(easy|medium|hard)$"),
    provider: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
):
    validate_provider_request(current_user, provider)

    try:
        return generate_problem(current_user["id"], topic, difficulty, provider_override=provider)
    except GeminiQuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except PistonRuntimeUnavailableError as exc:
        raise HTTPException(status_code=503, detail=f"Code execution service has no runtimes loaded: {exc}")
    except PistonExecutionError as exc:
        raise HTTPException(status_code=503, detail=f"Code execution service unreachable: {exc}")
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))