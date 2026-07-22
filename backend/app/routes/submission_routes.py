from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import get_current_user
from app.schemas.submission_schemas import SubmitRequest, SubmitResponse
from app.database.repositories import get_problem_by_id, create_submission
from app.services.execution_service import run_submission

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("/execute", response_model=SubmitResponse)
async def execute_submission(payload: SubmitRequest, current_user: dict = Depends(get_current_user)):
    problem = get_problem_by_id(payload.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    if payload.language not in ("python", "javascript", "cpp"):
        raise HTTPException(status_code=400, detail="Unsupported language")

    outcome = run_submission(problem, payload.language, payload.source_code)

    if "error" in outcome:
        raise HTTPException(status_code=400, detail=outcome["error"])

    create_submission(
        user_id=current_user["id"],
        language=payload.language,
        topic=problem["topic"],
        difficulty=problem["difficulty"],
        source_code=payload.source_code,
        execution_result=outcome,
    )

    return outcome