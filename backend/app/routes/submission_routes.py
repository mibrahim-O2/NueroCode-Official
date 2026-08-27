import logging

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import get_current_user
from app.schemas.submission_schemas import SubmitRequest, SubmitResponse
from app.database.repositories import get_problem_by_id, create_submission
from app.services.execution_service import run_submission
from app.services.analysis_service import analyze_submission

logger = logging.getLogger(__name__)

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
        status = 503 if outcome.get("error_type") == "infrastructure" else 400
        raise HTTPException(status_code=status, detail=outcome["error"])

    saved_submission = create_submission(
        user_id=current_user["id"],
        language=payload.language,
        topic=problem["topic"],
        difficulty=problem["difficulty"],
        source_code=payload.source_code,
        execution_result=outcome,
        complexity=None,
        detected_patterns=None,
        ai_feedback=None,
        # This was previously missing entirely — problem_id was accepted
        # in the request payload and used to fetch the problem for
        # grading above, but never forwarded into the saved submission
        # row itself. Without this, Official Solutions and Peer
        # Discussion (Super Phase, Parts 3 and 5) would have no reliable
        # way to know which problem a submission actually answered.
        problem_id=payload.problem_id,
    )

    try:
        analysis = analyze_submission(
            submission_id=saved_submission["id"],
            user_id=current_user["id"],
            topic=problem["topic"],
            difficulty=problem["difficulty"],
            language=payload.language,
            source_code=payload.source_code,
            all_tests_passed=outcome["all_passed"],
        )
    except Exception as exc:
        # Test results are already computed at this point and must still
        # reach the student even if feedback generation (or ChromaDB, or
        # the AI provider) fails for any reason — grading and analysis
        # are independent guarantees, not one atomic operation.
        logger.warning("Analysis failed for submission %s: %s", saved_submission["id"], exc)
        analysis = None

    return {**outcome, "analysis": analysis}