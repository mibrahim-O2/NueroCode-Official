from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import get_current_user, require_role
from app.schemas.submission_comment_schemas import AddCommentRequest
from app.database.repositories import (
    get_submission_by_id,
    add_submission_comment,
    get_comments_for_submission,
    get_submissions_for_user,
)

router = APIRouter(prefix="/submissions", tags=["submission-comments"])


@router.get("/mine")
async def my_submissions(current_user: dict = Depends(get_current_user)):
    return get_submissions_for_user(current_user["id"])


@router.get("/{submission_id}/comments")
async def list_comments(submission_id: str, current_user: dict = Depends(get_current_user)):
    submission = get_submission_by_id(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    # A student may only read comments on their OWN submissions; educators/admins may read any.
    if submission["user_id"] != current_user["id"] and current_user["role"] not in ("educator", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to view these comments")
    return get_comments_for_submission(submission_id)


@router.post("/{submission_id}/comments")
async def add_comment(
    submission_id: str, payload: AddCommentRequest, current_user: dict = Depends(require_role("educator", "admin"))
):
    if not get_submission_by_id(submission_id):
        raise HTTPException(status_code=404, detail="Submission not found")
    return add_submission_comment(submission_id, current_user["id"], current_user["name"], payload.comment)