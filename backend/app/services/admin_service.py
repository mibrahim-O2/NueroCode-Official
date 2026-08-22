"""Admin orchestration layer.

Owns two responsibilities kept separate from the routes on purpose,
matching problem_service.py / assessment_service.py / analysis_service.py:

1. Role-change safety — enforced here, not just in the frontend, so a
   direct API call cannot bypass it either.
2. Architecture-aware student resets — six scoped operations that respect
   NeuroCode's actual module dependencies (see the reset architecture
   analysis) rather than deleting data indiscriminately. Every reset
   reuses existing repository functions wherever one already exists
   (e.g. reset_student_roadmap from Phase 14) instead of duplicating logic.
"""

from fastapi import HTTPException

from app.database.repositories import (
    count_admins,
    get_user_role,
    update_user_role,
    get_user_by_id,
    reset_student_roadmap,
    reset_user_dashboard_stats,
    clear_learning_analytics_recommendation,
    clear_learning_analytics_practice_fields,
    delete_user_submissions,
    delete_user_generated_problems,
    delete_user_submission_embeddings,
    delete_resettable_assessments,
    delete_all_user_assessments,
    delete_user_credentials,
    create_audit_log,
)

VALID_ROLES = {"student", "educator", "admin"}


def change_user_role(admin_user: dict, target_user_id: str, new_role: str, reason: str | None = None) -> dict:
    if new_role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Role must be one of {sorted(VALID_ROLES)}")

    current_role = get_user_role(target_user_id)
    if current_role is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Last-admin protection — enforced here regardless of who calls this
    # (frontend dropdown or a direct API request), so it cannot be bypassed.
    if current_role == "admin" and new_role != "admin" and count_admins() <= 1:
        raise HTTPException(
            status_code=400,
            detail=(
                "Operation blocked. NeuroCode must always have at least one Administrator. "
                "Assign another user as Admin before removing this role."
            ),
        )

    updated = update_user_role(target_user_id, new_role)

    target = get_user_by_id(target_user_id)
    create_audit_log(
        admin_id=admin_user["id"],
        admin_name=admin_user["name"],
        target_user_id=target_user_id,
        target_user_name=target["name"] if target else "Unknown",
        action=f"role_change:{current_role}->{new_role}",
        reason=reason,
    )
    return updated


def _log(admin_user: dict, target_user_id: str, action: str, reason: str | None) -> None:
    target = get_user_by_id(target_user_id)
    create_audit_log(
        admin_id=admin_user["id"],
        admin_name=admin_user["name"],
        target_user_id=target_user_id,
        target_user_name=target["name"] if target else "Unknown",
        action=action,
        reason=reason,
    )


def reset_dashboard(admin_user: dict, student_id: str, reason: str | None = None) -> dict:
    result = reset_user_dashboard_stats(student_id)
    _log(admin_user, student_id, "reset_dashboard", reason)
    return result


def reset_roadmap(admin_user: dict, student_id: str, reason: str | None = None) -> dict:
    nodes = reset_student_roadmap(student_id)
    clear_learning_analytics_recommendation(student_id)
    _log(admin_user, student_id, "reset_roadmap", reason)
    return {"roadmap": nodes}


def reset_practice(admin_user: dict, student_id: str, reason: str | None = None) -> dict:
    submissions_deleted = delete_user_submissions(student_id)
    problems_deleted = delete_user_generated_problems(student_id)
    delete_user_submission_embeddings(student_id)
    clear_learning_analytics_practice_fields(student_id)
    _log(admin_user, student_id, "reset_practice", reason)
    return {"submissions_deleted": submissions_deleted, "problems_deleted": problems_deleted}


def reset_assessments(admin_user: dict, student_id: str, reason: str | None = None) -> dict:
    deleted = delete_resettable_assessments(student_id)
    _log(admin_user, student_id, "reset_assessments", reason)
    return {"assessments_deleted": deleted}


def reset_credentials(admin_user: dict, student_id: str, reason: str | None = None) -> dict:
    deleted = delete_user_credentials(student_id)
    _log(admin_user, student_id, "reset_credentials", reason)
    return {"credentials_deleted": deleted}


def reset_full_student(admin_user: dict, student_id: str, reason: str | None = None) -> dict:
    """Master reset — a single audit log entry for the whole operation
    rather than five, since this is conceptually one action."""
    dashboard = reset_user_dashboard_stats(student_id)
    roadmap = reset_student_roadmap(student_id)
    submissions_deleted = delete_user_submissions(student_id)
    problems_deleted = delete_user_generated_problems(student_id)
    delete_user_submission_embeddings(student_id)
    credentials_deleted = delete_user_credentials(student_id)  # deleted first — no FK conflict this way
    assessments_deleted = delete_all_user_assessments(student_id)
    clear_learning_analytics_recommendation(student_id)
    clear_learning_analytics_practice_fields(student_id)

    _log(admin_user, student_id, "reset_full_student", reason)

    return {
        "dashboard": dashboard,
        "roadmap": roadmap,
        "submissions_deleted": submissions_deleted,
        "problems_deleted": problems_deleted,
        "assessments_deleted": assessments_deleted,
        "credentials_deleted": credentials_deleted,
    }