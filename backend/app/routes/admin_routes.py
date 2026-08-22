from fastapi import APIRouter, Depends

from app.middleware.auth_middleware import require_role
from app.schemas.admin_schemas import UpdateRoleRequest, ResetActionRequest
from app.services import admin_service
from app.database.repositories import (
    get_all_users,
    get_cohort_overview,
    get_student_timeline,
    get_skill_gap_summary,
    get_flagged_assessments,
    get_all_credentials_admin,
    get_leaderboard,
    get_recent_audit_logs,
)

router = APIRouter(prefix="/admin", tags=["admin"])


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


# --- Admin only -------------------------------------------------------------

@router.get("/users")
async def list_users(current_user: dict = Depends(require_role("admin"))):
    return get_all_users()


@router.patch("/users/{user_id}/role")
async def change_user_role(
    user_id: str, payload: UpdateRoleRequest, current_user: dict = Depends(require_role("admin"))
):
    return admin_service.change_user_role(current_user, user_id, payload.role, payload.reason)


@router.get("/credentials")
async def all_credentials(current_user: dict = Depends(require_role("admin"))):
    return get_all_credentials_admin()


@router.get("/audit-logs")
async def audit_logs(current_user: dict = Depends(require_role("admin"))):
    return get_recent_audit_logs(limit=100)


# --- Architecture-aware student resets --------------------------------------

@router.post("/students/{user_id}/reset/dashboard")
async def reset_dashboard(
    user_id: str, payload: ResetActionRequest, current_user: dict = Depends(require_role("admin"))
):
    return admin_service.reset_dashboard(current_user, user_id, payload.reason)


@router.post("/students/{user_id}/reset/roadmap")
async def reset_roadmap(
    user_id: str, payload: ResetActionRequest, current_user: dict = Depends(require_role("admin"))
):
    return admin_service.reset_roadmap(current_user, user_id, payload.reason)


@router.post("/students/{user_id}/reset/practice")
async def reset_practice(
    user_id: str, payload: ResetActionRequest, current_user: dict = Depends(require_role("admin"))
):
    return admin_service.reset_practice(current_user, user_id, payload.reason)


@router.post("/students/{user_id}/reset/assessments")
async def reset_assessments(
    user_id: str, payload: ResetActionRequest, current_user: dict = Depends(require_role("admin"))
):
    return admin_service.reset_assessments(current_user, user_id, payload.reason)


@router.post("/students/{user_id}/reset/credentials")
async def reset_credentials(
    user_id: str, payload: ResetActionRequest, current_user: dict = Depends(require_role("admin"))
):
    return admin_service.reset_credentials(current_user, user_id, payload.reason)


@router.post("/students/{user_id}/reset/full")
async def reset_full(
    user_id: str, payload: ResetActionRequest, current_user: dict = Depends(require_role("admin"))
):
    return admin_service.reset_full_student(current_user, user_id, payload.reason)