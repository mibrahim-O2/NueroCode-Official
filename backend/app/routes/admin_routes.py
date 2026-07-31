from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import require_role
from app.schemas.admin_schemas import UpdateRoleRequest
from app.database.repositories import (
    get_all_users,
    update_user_role,
    get_cohort_overview,
    get_student_timeline,
    get_skill_gap_summary,
    get_flagged_assessments,
    get_all_credentials_admin,
    reset_student_roadmap,
    get_leaderboard,
)

router = APIRouter(prefix="/admin", tags=["admin"])

VALID_ROLES = {"student", "educator", "admin"}


# --- Educator + Admin (read-only cohort views) -----------------------------

@router.get("/cohort-overview")
async def cohort_overview(current_user: dict = Depends(require_role("educator", "admin"))):
    return get_cohort_overview()


@router.get("/students/{user_id}/timeline")
async def student_timeline(user_id: str, current_user: dict = Depends(require_role("educator", "admin"))):
    return get_student_timeline(user_id)


@router.get("/analytics/skill-gaps")
async def skill_gaps(current_user: dict = Depends(require_role("educator", "admin"))):
    return get_skill_gap_summary()


@router.get("/analytics/integrity-flags")
async def integrity_flags(current_user: dict = Depends(require_role("educator", "admin"))):
    return get_flagged_assessments()


@router.get("/analytics/leaderboard")
async def class_leaderboard(current_user: dict = Depends(require_role("educator", "admin"))):
    return get_leaderboard(limit=50)


# --- Admin only (user management, destructive actions) --------------------

@router.get("/users")
async def list_users(current_user: dict = Depends(require_role("admin"))):
    return get_all_users()


@router.patch("/users/{user_id}/role")
async def change_user_role(
    user_id: str, payload: UpdateRoleRequest, current_user: dict = Depends(require_role("admin"))
):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Role must be one of {sorted(VALID_ROLES)}")
    return update_user_role(user_id, payload.role)


@router.get("/credentials")
async def all_credentials(current_user: dict = Depends(require_role("admin"))):
    return get_all_credentials_admin()


@router.post("/students/{user_id}/reset-roadmap")
async def reset_roadmap(user_id: str, current_user: dict = Depends(require_role("admin"))):
    return reset_student_roadmap(user_id)