"""Every mutating endpoint in this router is hard-gated behind
settings.TEST_MODE via require_test_mode(): when TEST_MODE=false, these
routes return 404 — genuinely unreachable, not just hidden client-side.
Every endpoint still requires a valid logged-in user (get_current_user)
and operates only on that user's own account; nothing here bypasses
authentication or touches other users' data.

Reuses existing production repository functions wherever the underlying
operation already exists (create_credential, promote_roadmap_topic,
upsert_learning_analytics, seed_default_roadmap via reset) rather than
duplicating their logic.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.config.settings import settings
from app.middleware.auth_middleware import get_current_user
from app.schemas.test_mode_schemas import (
    SetNodeStatusRequest,
    CompleteThroughRequest,
    AdjustStatsRequest,
    SimulateSubmissionRequest,
    SimulateCredentialRequest,
)
from app.database.repositories import (
    set_roadmap_node_status,
    unlock_all_roadmap_nodes,
    complete_roadmap_through_position,
    reset_student_roadmap,
    set_user_stats,
    create_submission,
    promote_roadmap_topic,
    upsert_learning_analytics,
    create_test_assessment_and_credential,
    clear_simulated_credentials,
)

router = APIRouter(prefix="/test-mode", tags=["test-mode"])


def require_test_mode():
    if not settings.TEST_MODE:
        raise HTTPException(status_code=404, detail="Not found")


@router.get("/status")
async def status():
    # Deliberately NOT gated — the frontend needs this single boolean to
    # know whether to render any test-mode UI at all. Reveals nothing else.
    return {"enabled": settings.TEST_MODE}


# --- Roadmap -----------------------------------------------------------

@router.post("/roadmap/set-node-status", dependencies=[Depends(require_test_mode)])
async def set_node_status(payload: SetNodeStatusRequest, current_user: dict = Depends(get_current_user)):
    valid = {"locked", "unlocked", "in_progress", "completed"}
    if payload.status not in valid:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(valid)}")
    node = set_roadmap_node_status(payload.node_id, current_user["id"], payload.status)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.post("/roadmap/unlock-all", dependencies=[Depends(require_test_mode)])
async def unlock_all(current_user: dict = Depends(get_current_user)):
    return unlock_all_roadmap_nodes(current_user["id"])


@router.post("/roadmap/complete-through", dependencies=[Depends(require_test_mode)])
async def complete_through(payload: CompleteThroughRequest, current_user: dict = Depends(get_current_user)):
    return complete_roadmap_through_position(current_user["id"], payload.position)


@router.post("/roadmap/reset", dependencies=[Depends(require_test_mode)])
async def reset_roadmap_test_mode(current_user: dict = Depends(get_current_user)):
    return reset_student_roadmap(current_user["id"])  # reuses Phase 14's admin reset function


@router.post("/user/adjust-stats", dependencies=[Depends(require_test_mode)])
async def adjust_stats(payload: AdjustStatsRequest, current_user: dict = Depends(get_current_user)):
    return set_user_stats(current_user["id"], payload.xp, payload.level, payload.streak)


# --- Practice ------------------------------------------------------------
# Fully canned/deterministic — zero dependency on Piston or the AI
# provider, so demos remain reliable even offline or if either service
# is briefly down. This is a deliberate reliability choice, not a
# shortcut: a live presentation should never depend on external uptime.

_INSTANT_PROBLEM_TEMPLATE = {
    "description": "Given an array of integers, return the sum of all elements. (Simulated for demonstration.)",
    "examples": [
        {"input": "[1, 2, 3]", "output": "6"},
        {"input": "[10, -5, 5]", "output": "10"},
        {"input": "[]", "output": "0"},
    ],
    "constraints": ["0 <= array length <= 1000", "-1000 <= each element <= 1000"],
    "expected_complexity": "O(n)",
}


@router.get("/practice/instant-problem", dependencies=[Depends(require_test_mode)])
async def instant_problem(topic: str, difficulty: str = "medium", current_user: dict = Depends(get_current_user)):
    return {
        "id": f"test-mode-{uuid.uuid4()}",
        "topic": topic,
        "difficulty": difficulty,
        "title": f"[TEST MODE] {topic} Demo Problem",
        **_INSTANT_PROBLEM_TEMPLATE,
    }


@router.post("/practice/simulate-submission", dependencies=[Depends(require_test_mode)])
async def simulate_submission(payload: SimulateSubmissionRequest, current_user: dict = Depends(get_current_user)):
    if payload.outcome not in ("pass", "fail"):
        raise HTTPException(status_code=400, detail="outcome must be 'pass' or 'fail'")

    if payload.outcome == "pass":
        results = [
            {"case": i + 1, "input": [i], "expected": str(i * 2), "actual": str(i * 2), "passed": True}
            for i in range(5)
        ]
        analysis = {
            "complexity": "O(n)",
            "anti_patterns": [],
            "feedback": (
                "Solid, efficient solution — a single pass through the input with no unnecessary "
                "repeated work. This is exactly the kind of approach that scales well."
            ),
            "reordered_topic": None,
        }
    else:
        results = [
            {"case": i + 1, "input": [i], "expected": str(i * 2), "actual": str(i), "passed": i >= 3}
            for i in range(5)
        ]
        reordered_topic = "Hash Maps" if payload.topic != "Hash Maps" else None
        analysis = {
            "complexity": "O(n^2)",
            "anti_patterns": [{
                "key": "linear_membership_check",
                "message": (
                    "Checking membership with 'in' against a list inside a loop is an O(n) scan per "
                    "check. If you only need to test presence, a set or dict gives O(1) average-case "
                    "lookups instead."
                ),
            }],
            "feedback": (
                "The logic is close, but there's a repeated linear scan happening inside your main "
                "loop that pushes this to O(n^2). Consider a set or dict for the lookup instead."
            ),
            "reordered_topic": reordered_topic,
        }

    if payload.persist:
        create_submission(
            user_id=current_user["id"],
            language=payload.language,
            topic=payload.topic,
            difficulty=payload.difficulty,
            source_code="# [TEST MODE] simulated submission",
            execution_result={
                "results": results,
                "passed_count": sum(1 for r in results if r["passed"]),
                "total_count": len(results),
                "all_passed": all(r["passed"] for r in results),
            },
            complexity=analysis["complexity"],
            detected_patterns={
                "anti_patterns": analysis["anti_patterns"],
                "max_loop_depth": 2 if payload.outcome == "fail" else 1,
            },
            ai_feedback=analysis["feedback"],
        )
        if analysis["reordered_topic"]:
            promote_roadmap_topic(current_user["id"], current_topic=payload.topic, target_topic=analysis["reordered_topic"])
            upsert_learning_analytics(current_user["id"], {
                "weak_topics": [analysis["reordered_topic"]],
                "recommended_next_topic": analysis["reordered_topic"],
                "consistency_score": 45,
            })

    return {
        "results": results,
        "passed_count": sum(1 for r in results if r["passed"]),
        "total_count": len(results),
        "all_passed": all(r["passed"] for r in results),
        "analysis": analysis,
    }


# --- Credentials -----------------------------------------------------------

BADGE_PRESETS = {
    "bronze": {"cluster": "Fundamentals", "topics": ["Arrays", "Strings"], "score": 72, "integrity": 85},
    "silver": {"cluster": "Lookups & Efficiency", "topics": ["Hash Maps", "Two Pointers"], "score": 82, "integrity": 90},
    "gold": {"cluster": "Windows & Structures", "topics": ["Sliding Window", "Stacks & Queues"], "score": 91, "integrity": 95},
    "platinum": {"cluster": "Advanced Structures", "topics": ["Graphs", "Dynamic Programming"], "score": 98, "integrity": 99},
}


@router.post("/credentials/simulate", dependencies=[Depends(require_test_mode)])
async def simulate_credential(payload: SimulateCredentialRequest, current_user: dict = Depends(get_current_user)):
    preset = BADGE_PRESETS.get(payload.badge_level)
    if not preset:
        raise HTTPException(status_code=400, detail=f"badge_level must be one of {sorted(BADGE_PRESETS)}")

    return create_test_assessment_and_credential(
        user_id=current_user["id"],
        badge_level=payload.badge_level,
        cluster_name=f"[TEST MODE] {preset['cluster']}",
        topics=preset["topics"],
        score=preset["score"],
        integrity=preset["integrity"],
    )


@router.post("/credentials/clear-simulated", dependencies=[Depends(require_test_mode)])
async def clear_simulated(current_user: dict = Depends(get_current_user)):
    return clear_simulated_credentials(current_user["id"])