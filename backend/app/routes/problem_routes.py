from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth_middleware import get_current_user
from app.services.problem_service import generate_problem
from app.services.piston_service import PistonRuntimeUnavailableError, PistonExecutionError

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("/generate")
async def generate(
    topic: str = Query(..., min_length=1),
    difficulty: str = Query("medium", pattern="^(easy|medium|hard)$"),
    current_user: dict = Depends(get_current_user),
):
    try:
        return generate_problem(current_user["id"], topic, difficulty)
    except PistonRuntimeUnavailableError as exc:
        # Piston reachable but has no runtimes loaded — infrastructure issue
        # with a known, actionable fix, distinct from an AI/validation failure.
        raise HTTPException(status_code=503, detail=f"Code execution service has no runtimes loaded: {exc}")
    except PistonExecutionError as exc:
        # Piston unreachable entirely (connection/timeout).
        raise HTTPException(status_code=503, detail=f"Code execution service unreachable: {exc}")
    except RuntimeError as exc:
        # Piston was confirmed healthy — this is a genuine AI generation/validation failure.
        raise HTTPException(status_code=502, detail=str(exc))