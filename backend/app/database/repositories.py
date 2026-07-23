import re
from datetime import datetime, timezone

from app.services.supabase_service import supabase


def _parse_timestamp(value: str) -> datetime:
    """Parses Supabase timestamptz strings safely.

    Postgres/PostgREST strips trailing zeros from fractional seconds and
    may omit the colon in the UTC offset, but Python's fromisoformat (on
    versions before 3.11) requires exactly 0, 3, or 6 fractional digits
    and a colon in the offset. This normalizes both before parsing.
    """
    value = value.strip().replace("Z", "+00:00")
    value = re.sub(r"\.(\d+)", lambda m: "." + (m.group(1) + "000000")[:6], value, count=1)
    value = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", value)
    return datetime.fromisoformat(value)

DEFAULT_TOPICS = [
    ("Arrays", "beginner"),
    ("Strings", "beginner"),
    ("Hash Maps", "beginner"),
    ("Two Pointers", "intermediate"),
    ("Sliding Window", "intermediate"),
    ("Stacks & Queues", "intermediate"),
    ("Recursion & Backtracking", "intermediate"),
    ("Trees", "advanced"),
    ("Graphs", "advanced"),
    ("Dynamic Programming", "advanced"),
]

XP_REWARDS = {"beginner": 50, "intermediate": 100, "advanced": 150}


# --- Roadmap -----------------------------------------------------------

def create_roadmap_node(user_id: str, topic: str, difficulty: str, position: int) -> dict:
    data = {
        "user_id": user_id,
        "topic": topic,
        "difficulty": difficulty,
        "status": "locked",
        "position": position,
        "xp_earned": 0,
    }
    return supabase.table("roadmap_nodes").insert(data).execute().data[0]


def get_roadmap_for_user(user_id: str) -> list[dict]:
    return (
        supabase.table("roadmap_nodes")
        .select("*")
        .eq("user_id", user_id)
        .order("position")
        .execute()
        .data
    )


def seed_default_roadmap(user_id: str) -> list[dict]:
    now = datetime.now(timezone.utc).isoformat()
    rows = []
    for i, (topic, difficulty) in enumerate(DEFAULT_TOPICS):
        status = "unlocked" if i == 0 else "locked"
        rows.append({
            "user_id": user_id,
            "topic": topic,
            "difficulty": difficulty,
            "status": status,
            "position": i,
            "xp_earned": 0,
            "unlocked_at": now if status == "unlocked" else None,
        })
    return supabase.table("roadmap_nodes").insert(rows).execute().data


def mark_node_in_progress(node_id: str, user_id: str) -> dict | None:
    existing = supabase.table("roadmap_nodes").select("*").eq("id", node_id).eq("user_id", user_id).execute()
    if not existing.data:
        return None
    node = existing.data[0]
    if node["status"] not in ("unlocked", "in_progress"):
        return None
    return (
        supabase.table("roadmap_nodes")
        .update({"status": "in_progress"})
        .eq("id", node_id)
        .execute()
        .data[0]
    )


def complete_roadmap_node(node_id: str, user_id: str) -> dict | None:
    existing = supabase.table("roadmap_nodes").select("*").eq("id", node_id).eq("user_id", user_id).execute()
    if not existing.data:
        return None
    node = existing.data[0]
    if node["status"] not in ("unlocked", "in_progress"):
        return None

    xp_reward = XP_REWARDS.get(node["difficulty"], 50)
    now = datetime.now(timezone.utc).isoformat()

    updated_node = (
        supabase.table("roadmap_nodes")
        .update({"status": "completed", "xp_earned": xp_reward, "completed_at": now})
        .eq("id", node_id)
        .execute()
        .data[0]
    )

    # Unlock the next node BEFORE touching XP/streak bookkeeping, so that a
    # failure in gamification math can never block roadmap progression that
    # has already been earned.
    next_position = node["position"] + 1
    next_node = (
        supabase.table("roadmap_nodes")
        .select("*")
        .eq("user_id", user_id)
        .eq("position", next_position)
        .execute()
    )
    if next_node.data and next_node.data[0]["status"] == "locked":
        supabase.table("roadmap_nodes").update(
            {"status": "unlocked", "unlocked_at": now}
        ).eq("id", next_node.data[0]["id"]).execute()

    updated_user, leveled_up = update_user_progress(user_id, xp_reward)

    return {
        "node": updated_node,
        "user": updated_user,
        "xp_awarded": xp_reward,
        "leveled_up": leveled_up,
    }


def update_user_progress(user_id: str, xp_delta: int) -> tuple[dict, bool]:
    user = supabase.table("users").select("*").eq("id", user_id).execute().data[0]
    old_level = user["level"]
    new_xp = user["xp"] + xp_delta
    new_level = (new_xp // 500) + 1
    leveled_up = new_level > old_level

    now = datetime.now(timezone.utc)
    last_active = user.get("last_active_at")
    new_streak = user["streak"]

    if last_active:
        last_date = _parse_timestamp(last_active).date()
        today = now.date()
        if last_date == today:
            pass
        elif (today - last_date).days == 1:
            new_streak += 1
        else:
            new_streak = 1
    else:
        new_streak = 1

    update_data = {
        "xp": new_xp,
        "level": new_level,
        "streak": new_streak,
        "last_active_at": now.isoformat(),
    }
    updated = supabase.table("users").update(update_data).eq("id", user_id).execute().data[0]
    return updated, leveled_up


def get_problem_by_id(problem_id: str) -> dict | None:
    result = supabase.table("problems").select("*").eq("id", problem_id).execute()
    return result.data[0] if result.data else None


def update_submission_analysis(
    submission_id: str, complexity: str, detected_patterns: dict, ai_feedback: str
) -> dict:
    return (
        supabase.table("submissions")
        .update({"complexity": complexity, "detected_patterns": detected_patterns, "ai_feedback": ai_feedback})
        .eq("id", submission_id)
        .execute()
        .data[0]
    )


def promote_roadmap_topic(user_id: str, current_topic: str, target_topic: str) -> bool:
    """Moves target_topic's roadmap node to just after current_topic's node.

    Only reorders nodes that are still 'locked' (untouched, upcoming) —
    reordering something the student has already started or finished
    wouldn't make sense. Positions are unique per user, so the target is
    parked at a temporary out-of-range position first and intervening
    nodes are shifted in descending order to avoid a collision window.

    Returns True only if a reorder actually happened, so callers can tell
    a real promotion apart from a silent no-op (e.g. target already
    completed, or already earlier in the sequence).
    """
    nodes = get_roadmap_for_user(user_id)
    current_node = next((n for n in nodes if n["topic"] == current_topic), None)
    target_node = next((n for n in nodes if n["topic"] == target_topic), None)

    if not current_node or not target_node or target_node["status"] != "locked":
        return False

    new_position = current_node["position"] + 1
    old_position = target_node["position"]
    if old_position <= new_position:
        return False

    supabase.table("roadmap_nodes").update({"position": -1}).eq("id", target_node["id"]).execute()

    shifting = sorted(
        [n for n in nodes if new_position <= n["position"] < old_position],
        key=lambda n: n["position"],
        reverse=True,
    )
    for n in shifting:
        supabase.table("roadmap_nodes").update({"position": n["position"] + 1}).eq("id", n["id"]).execute()

    supabase.table("roadmap_nodes").update({"position": new_position}).eq("id", target_node["id"]).execute()
    return True


def get_recent_problem_titles(user_id: str, topic: str, limit: int = 5) -> list[str]:
    result = (
        supabase.table("problems")
        .select("title")
        .eq("user_id", user_id)
        .eq("topic", topic)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return [row["title"] for row in result.data]


def save_generated_problem(user_id: str, topic: str, difficulty: str, problem: dict) -> dict:
    data = {
        "user_id": user_id,
        "topic": topic,
        "difficulty": difficulty,
        "title": problem["title"],
        "description": problem["description"],
        "examples": problem["examples"],
        "constraints": problem["constraints"],
        "expected_complexity": problem["expected_complexity"],
        "canonical_solution": problem["canonical_solution"],
        "test_cases": problem["test_cases"],
        "validated": True,
    }
    return supabase.table("problems").insert(data).execute().data[0]


def get_leaderboard(limit: int = 20) -> list[dict]:
    result = (
        supabase.table("users")
        .select("id,name,avatar_url,xp,level,role")
        .order("xp", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


# --- Submissions ---------------------------------------------------------

def create_submission(user_id: str, language: str, topic: str, difficulty: str, source_code: str,
                       execution_result: dict | None = None, complexity: str | None = None,
                       detected_patterns: dict | None = None, ai_feedback: str | None = None) -> dict:
    data = {
        "user_id": user_id,
        "language": language,
        "topic": topic,
        "difficulty": difficulty,
        "source_code": source_code,
        "execution_result": execution_result,
        "complexity": complexity,
        "detected_patterns": detected_patterns,
        "ai_feedback": ai_feedback,
    }
    return supabase.table("submissions").insert(data).execute().data[0]


# --- Assessments -----------------------------------------------------------

def create_assessment(user_id: str, topic_cluster: str, generated_question: dict) -> dict:
    data = {
        "user_id": user_id,
        "topic_cluster": topic_cluster,
        "generated_question": generated_question,
        "status": "in_progress",
    }
    return supabase.table("assessments").insert(data).execute().data[0]


def complete_assessment(assessment_id: str, submitted_code: str, execution_result: dict,
                         assessment_score: float, integrity_score: float, duration: int) -> dict:
    data = {
        "submitted_code": submitted_code,
        "execution_result": execution_result,
        "assessment_score": assessment_score,
        "integrity_score": integrity_score,
        "duration": duration,
        "status": "completed",
    }
    return supabase.table("assessments").update(data).eq("id", assessment_id).execute().data[0]


# --- Credentials -----------------------------------------------------------

def create_credential(user_id: str, assessment_id: str, badge_level: str, topics_mastered: list,
                       assessment_score: float, integrity_score: float, qr_code: str | None = None) -> dict:
    data = {
        "user_id": user_id,
        "assessment_id": assessment_id,
        "badge_level": badge_level,
        "topics_mastered": topics_mastered,
        "assessment_score": assessment_score,
        "integrity_score": integrity_score,
        "qr_code": qr_code,
    }
    return supabase.table("credentials").insert(data).execute().data[0]


def get_credential_by_verify_uuid(verify_uuid: str) -> dict | None:
    result = supabase.table("credentials").select("*").eq("verify_uuid", verify_uuid).execute()
    return result.data[0] if result.data else None


# --- Proctoring -----------------------------------------------------------

def log_proctoring_event(assessment_id: str, event_type: str, severity: str = "low",
                          metadata: dict | None = None) -> dict:
    data = {
        "assessment_id": assessment_id,
        "event_type": event_type,
        "severity": severity,
        "metadata": metadata,
    }
    return supabase.table("proctoring_logs").insert(data).execute().data[0]


# --- Learning Analytics -----------------------------------------------------

def upsert_learning_analytics(user_id: str, insights: dict) -> dict:
    data = {"user_id": user_id, **insights}
    return (
        supabase.table("learning_analytics")
        .upsert(data, on_conflict="user_id")
        .execute()
        .data[0]
    )