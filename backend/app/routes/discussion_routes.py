from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import get_current_user, require_role
from app.schemas.discussion_schemas import AddDiscussionRequest
from app.database.repositories import (
    add_discussion_comment,
    get_discussions_for_problem,
    get_problem_by_id,
    hide_discussion_comment,
)

router = APIRouter(tags=["discussions"])


@router.get("/problems/{problem_id}/discussions")
async def list_discussions(problem_id: str, current_user: dict = Depends(get_current_user)):
    # Assessment questions are structurally unreachable here — they are
    # never rows in the `problems` table (see assessment_service.py,
    # which stores generated_question directly on `assessments`), so
    # there is no separate filter that could accidentally be bypassed.
    if not get_problem_by_id(problem_id):
        raise HTTPException(status_code=404, detail="Problem not found")
    return get_discussions_for_problem(problem_id)


@router.post("/problems/{problem_id}/discussions")
async def add_discussion(problem_id: str, payload: AddDiscussionRequest, current_user: dict = Depends(get_current_user)):
    if not get_problem_by_id(problem_id):
        raise HTTPException(status_code=404, detail="Problem not found")
    return add_discussion_comment(problem_id, current_user["id"], current_user["name"], payload.comment)


@router.post("/admin/discussions/{comment_id}/hide")
async def hide_discussion(comment_id: str, current_user: dict = Depends(require_role("admin", "educator"))):
    hide_discussion_comment(comment_id)
    return {"hidden": True}