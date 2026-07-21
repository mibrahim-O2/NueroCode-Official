from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth_middleware import get_current_user
from app.services.problem_service import generate_problem

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("/generate")
async def generate(
    topic: str = Query(..., min_length=1),
    difficulty: str = Query("medium", pattern="^(easy|medium|hard)$"),
    current_user: dict = Depends(get_current_user),
):
    try:
        return generate_problem(current_user["id"], topic, difficulty)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))