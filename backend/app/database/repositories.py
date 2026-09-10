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


def get_recent_submissions(user_id: str, limit: int = 10) -> list[dict]:
    """Used by the admin/educator student-timeline view — smaller default
    limit than get_submissions_for_user, which powers the student's own
    'My Submissions' page further below."""
    result = (
        supabase.table("submissions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


def get_credentials_for_user(user_id: str) -> list[dict]:
    result = (
        supabase.table("credentials")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def get_user_by_id(user_id: str) -> dict | None:
    result = supabase.table("users").select("id,name,role").eq("id", user_id).execute()
    return result.data[0] if result.data else None


def get_full_user_by_id(user_id: str) -> dict | None:
    """Full-field user fetch for the authenticated /auth/me endpoint.

    Deliberately separate from get_user_by_id (which selects only
    id/name/role for the public, minimal-disclosure credential
    verification page) — this one is only ever called for a user
    fetching their OWN record, so returning every field is safe and,
    critically, always reflects the current database state rather than
    a snapshot taken at login time.
    """
    result = supabase.table("users").select("*").eq("id", user_id).execute()
    return result.data[0] if result.data else None


def get_credential_with_owner(verify_uuid: str) -> dict | None:
    """Public-facing lookup for the /verify/:uuid page. Deliberately
    returns only the credential and the owner's name — no email or other
    account details — since this endpoint has no auth requirement by
    design (a recruiter with just the link should be able to verify it).
    """
    credential = get_credential_by_verify_uuid(verify_uuid)
    if not credential:
        return None
    owner = get_user_by_id(credential["user_id"])
    return {"credential": credential, "owner_name": owner["name"] if owner else "NeuroCode Student"}


def get_leaderboard(limit: int = 20) -> list[dict]:
    result = (
        supabase.table("users")
        .select("id,name,avatar_url,xp,level,role")
        .order("xp", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


# --- Admin / Educator -------------------------------------------------

def get_all_users(role: str | None = None) -> list[dict]:
    query = supabase.table("users").select("id,name,email,role,xp,level,streak,created_at")
    if role:
        query = query.eq("role", role)
    return query.order("created_at", desc=True).execute().data


def update_user_role(user_id: str, new_role: str) -> dict:
    return supabase.table("users").update({"role": new_role}).eq("id", user_id).execute().data[0]


# Human-readable labels for proctoring_logs.event_type — display-layer
# mapping only, does not touch the values actually written by Phase 11's
# frontend hooks or Phase 12's persisted rows.
VIOLATION_TYPE_LABELS = {
    "tab_switch": "Tab Switching",
    "paste": "Large Paste Detected",
    "camera_alert": "Camera Disabled / No Face Detected",
    "keystroke_alert": "Unusual Typing Rhythm",
}


def _summarize_violation_types(logs: list[dict]) -> list[dict]:
    counts: dict[str, int] = {}
    for log in logs:
        counts[log["event_type"]] = counts.get(log["event_type"], 0) + 1
    return [
        {"event_type": event_type, "label": VIOLATION_TYPE_LABELS.get(event_type, event_type), "count": count}
        for event_type, count in sorted(counts.items(), key=lambda x: -x[1])
    ]


def get_cohort_overview() -> list[dict]:
    students = get_all_users(role="student")
    if not students:
        return []
    student_ids = [s["id"] for s in students]

    nodes = supabase.table("roadmap_nodes").select("user_id,status").in_("user_id", student_ids).execute().data
    assessments = (
        supabase.table("assessments").select("id,user_id,status").in_("user_id", student_ids).execute().data
    )

    completed_counts: dict[str, int] = {}
    for n in nodes:
        if n["status"] == "completed":
            completed_counts[n["user_id"]] = completed_counts.get(n["user_id"], 0) + 1

    flagged_counts: dict[str, int] = {}
    flagged_ids_by_user: dict[str, list[str]] = {}
    for a in assessments:
        if a["status"] == "flagged":
            flagged_counts[a["user_id"]] = flagged_counts.get(a["user_id"], 0) + 1
            flagged_ids_by_user.setdefault(a["user_id"], []).append(a["id"])

    # Batch-fetch proctoring_logs for every flagged assessment across the
    # whole cohort in a single query, then group by student — avoids N+1
    # queries as the cohort grows.
    all_flagged_ids = [aid for ids in flagged_ids_by_user.values() for aid in ids]
    logs_by_assessment: dict[str, list[dict]] = {}
    if all_flagged_ids:
        logs_result = (
            supabase.table("proctoring_logs")
            .select("assessment_id,event_type")
            .in_("assessment_id", all_flagged_ids)
            .execute()
        )
        for log in logs_result.data:
            logs_by_assessment.setdefault(log["assessment_id"], []).append(log)

    for s in students:
        s["topics_completed"] = completed_counts.get(s["id"], 0)
        s["integrity_flags"] = flagged_counts.get(s["id"], 0)
        student_logs = [
            log for aid in flagged_ids_by_user.get(s["id"], []) for log in logs_by_assessment.get(aid, [])
        ]
        s["violation_types"] = _summarize_violation_types(student_logs)

    return students


def get_student_timeline(user_id: str) -> dict:
    roadmap = get_roadmap_for_user(user_id)
    submissions = get_recent_submissions(user_id, limit=20)
    assessments_result = (
        supabase.table("assessments").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    )
    assessments = assessments_result.data

    assessment_ids = [a["id"] for a in assessments]
    logs_by_assessment: dict[str, list[dict]] = {}
    if assessment_ids:
        logs_result = (
            supabase.table("proctoring_logs").select("*").in_("assessment_id", assessment_ids).execute()
        )
        for log in logs_result.data:
            logs_by_assessment.setdefault(log["assessment_id"], []).append(log)

    for a in assessments:
        a["violation_types"] = _summarize_violation_types(logs_by_assessment.get(a["id"], []))

    credentials_result = (
        supabase.table("credentials").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    )
    return {
        "roadmap": roadmap,
        "submissions": submissions,
        "assessments": assessments,
        "credentials": credentials_result.data,
    }


def get_skill_gap_summary() -> list[dict]:
    """Aggregates weak_topics across all students' learning_analytics rows
    into a frequency count, for the 'common error patterns' chart."""
    rows = supabase.table("learning_analytics").select("weak_topics").execute().data
    counts: dict[str, int] = {}
    for row in rows:
        for topic in row.get("weak_topics") or []:
            counts[topic] = counts.get(topic, 0) + 1
    return [{"topic": topic, "count": count} for topic, count in sorted(counts.items(), key=lambda x: -x[1])]


def get_flagged_assessments() -> list[dict]:
    result = (
        supabase.table("assessments")
        .select("id,user_id,topic_cluster,assessment_score,integrity_score,created_at,status")
        .eq("status", "flagged")
        .order("created_at", desc=True)
        .execute()
    )
    flagged = result.data
    if not flagged:
        return []
    user_ids = list({row["user_id"] for row in flagged})
    users = supabase.table("users").select("id,name").in_("id", user_ids).execute().data
    name_map = {u["id"]: u["name"] for u in users}
    for row in flagged:
        row["student_name"] = name_map.get(row["user_id"], "Unknown")
    return flagged


def get_all_credentials_admin() -> list[dict]:
    result = supabase.table("credentials").select("*").order("created_at", desc=True).execute()
    credentials = result.data
    if not credentials:
        return []
    user_ids = list({c["user_id"] for c in credentials})
    users = supabase.table("users").select("id,name").in_("id", user_ids).execute().data
    name_map = {u["id"]: u["name"] for u in users}
    for c in credentials:
        c["student_name"] = name_map.get(c["user_id"], "Unknown")
    return credentials


def reset_student_roadmap(user_id: str) -> list[dict]:
    """Deletes a student's current roadmap and reseeds it fresh from
    position 0 — used by admins (Phase 14) to give a student a clean
    restart, reused unchanged by Test Mode's roadmap reset, and reused
    unchanged by the modular admin Reset Roadmap action below."""
    supabase.table("roadmap_nodes").delete().eq("user_id", user_id).execute()
    return seed_default_roadmap(user_id)


# --- Admin: role safety + architecture-aware student resets ---------------

def count_admins() -> int:
    result = supabase.table("users").select("id").eq("role", "admin").execute()
    return len(result.data)


def get_user_role(user_id: str) -> str | None:
    result = supabase.table("users").select("role").eq("id", user_id).execute()
    return result.data[0]["role"] if result.data else None


def reset_user_dashboard_stats(user_id: str) -> dict:
    return (
        supabase.table("users")
        .update({"xp": 0, "level": 1, "streak": 0, "last_active_at": None})
        .eq("id", user_id)
        .execute()
        .data[0]
    )


def clear_learning_analytics_recommendation(user_id: str) -> None:
    """Owned by Roadmap — the 'Recommended next topic' badge specifically."""
    supabase.table("learning_analytics").update({"recommended_next_topic": None}).eq(
        "user_id", user_id
    ).execute()


def clear_learning_analytics_practice_fields(user_id: str) -> None:
    """Owned by Practice — weak/strong topics and consistency, distinct
    from the roadmap's recommended_next_topic field above."""
    supabase.table("learning_analytics").update({
        "weak_topics": [],
        "strong_topics": [],
        "learning_speed": None,
        "consistency_score": None,
    }).eq("user_id", user_id).execute()


def delete_user_submissions(user_id: str) -> int:
    existing = supabase.table("submissions").select("id").eq("user_id", user_id).execute().data
    if existing:
        supabase.table("submissions").delete().eq("user_id", user_id).execute()
    return len(existing)


def delete_user_generated_problems(user_id: str) -> int:
    """Also clears this user's generated-problem history, so the
    'avoid recent titles' uniqueness check in problem_service.py doesn't
    keep referencing pre-reset titles after a Practice or Full Reset."""
    existing = supabase.table("problems").select("id").eq("user_id", user_id).execute().data
    if existing:
        supabase.table("problems").delete().eq("user_id", user_id).execute()
    return len(existing)


def delete_user_submission_embeddings(user_id: str) -> None:
    from app.database.chroma_client import submissions_collection

    try:
        submissions_collection().delete(where={"user_id": user_id})
    except Exception:
        pass  # Embeddings are supplementary — never block a reset on Chroma errors.


def delete_resettable_assessments(user_id: str) -> int:
    """Deletes assessment attempts that have NOT produced a credential.
    Assessments backing an issued credential are intentionally preserved:
    credentials.assessment_id is a NOT NULL foreign key with
    ON DELETE CASCADE, so deleting a credentialed assessment would
    silently delete its credential too — directly violating the
    'do not automatically delete credentials' requirement. proctoring_logs
    cascade-delete automatically for whichever assessments ARE removed
    here (same FK behavior already in place since Phase 4)."""
    credentialed = supabase.table("credentials").select("assessment_id").eq("user_id", user_id).execute().data
    credentialed_ids = {c["assessment_id"] for c in credentialed}

    all_assessments = supabase.table("assessments").select("id").eq("user_id", user_id).execute().data
    to_delete = [a["id"] for a in all_assessments if a["id"] not in credentialed_ids]
    if to_delete:
        supabase.table("assessments").delete().in_("id", to_delete).execute()
    return len(to_delete)


def delete_all_user_assessments(user_id: str) -> int:
    """Used only by Full Student Reset, where credentials are being wiped
    in the same operation — no FK conflict, since both go together."""
    existing = supabase.table("assessments").select("id").eq("user_id", user_id).execute().data
    if existing:
        supabase.table("assessments").delete().eq("user_id", user_id).execute()
    return len(existing)


def delete_user_credentials(user_id: str) -> int:
    existing = supabase.table("credentials").select("id").eq("user_id", user_id).execute().data
    if existing:
        supabase.table("credentials").delete().eq("user_id", user_id).execute()
    return len(existing)


def create_audit_log(
    admin_id: str, admin_name: str, target_user_id: str, target_user_name: str, action: str, reason: str | None
) -> dict:
    return (
        supabase.table("admin_audit_logs")
        .insert({
            "admin_id": admin_id,
            "admin_name": admin_name,
            "target_user_id": target_user_id,
            "target_user_name": target_user_name,
            "action": action,
            "reason": reason,
        })
        .execute()
        .data[0]
    )


def get_recent_audit_logs(limit: int = 100) -> list[dict]:
    return (
        supabase.table("admin_audit_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
        .data
    )


# --- Test Mode ---------------------------------------------------------
# Everything below is only ever called from routes gated by
# settings.TEST_MODE (see test_mode_routes.py) — these functions have no
# gating of their own, by design, so they stay simple and reusable; the
# safety boundary lives entirely at the route layer.

def set_roadmap_node_status(node_id: str, user_id: str, status: str) -> dict | None:
    existing = supabase.table("roadmap_nodes").select("id").eq("id", node_id).eq("user_id", user_id).execute()
    if not existing.data:
        return None
    now = datetime.now(timezone.utc).isoformat()
    update_data = {"status": status}
    if status == "unlocked":
        update_data["unlocked_at"] = now
    if status == "completed":
        update_data["completed_at"] = now
    return supabase.table("roadmap_nodes").update(update_data).eq("id", node_id).execute().data[0]


def unlock_all_roadmap_nodes(user_id: str) -> list[dict]:
    now = datetime.now(timezone.utc).isoformat()
    supabase.table("roadmap_nodes").update({"status": "unlocked", "unlocked_at": now}).eq(
        "user_id", user_id
    ).neq("status", "completed").execute()
    return get_roadmap_for_user(user_id)


def complete_roadmap_through_position(user_id: str, position: int) -> list[dict]:
    now = datetime.now(timezone.utc).isoformat()
    nodes = get_roadmap_for_user(user_id)
    for n in nodes:
        if n["position"] <= position:
            supabase.table("roadmap_nodes").update({
                "status": "completed",
                "completed_at": now,
                "xp_earned": XP_REWARDS.get(n["difficulty"], 50),
            }).eq("id", n["id"]).execute()
        elif n["position"] == position + 1:
            supabase.table("roadmap_nodes").update({"status": "unlocked", "unlocked_at": now}).eq(
                "id", n["id"]
            ).execute()
    return get_roadmap_for_user(user_id)


def set_user_stats(user_id: str, xp: int | None, level: int | None, streak: int | None) -> dict:
    update_data = {k: v for k, v in {"xp": xp, "level": level, "streak": streak}.items() if v is not None}
    if not update_data:
        return supabase.table("users").select("*").eq("id", user_id).execute().data[0]
    return supabase.table("users").update(update_data).eq("id", user_id).execute().data[0]


def create_test_assessment_and_credential(
    user_id: str, badge_level: str, cluster_name: str, topics: list[str], score: float, integrity: float
) -> dict:
    """Creates a companion assessment row (required by credentials'
    assessment_id NOT NULL FK — same constraint the real flow satisfies)
    and a real credential row via the SAME create_credential() function
    the production assessment-pass path uses. cluster_name is prefixed
    with '[TEST MODE]' so these rows are identifiable and safely
    cleanable via clear_simulated_credentials, without changing schema.
    """
    assessment = supabase.table("assessments").insert({
        "user_id": user_id,
        "topic_cluster": cluster_name,
        "generated_question": {
            "title": f"{cluster_name} Demo Assessment",
            "description": "Simulated assessment generated via NeuroCode Test Mode for demonstration purposes.",
        },
        "assessment_score": score,
        "integrity_score": integrity,
        "duration": 600,
        "status": "completed",
    }).execute().data[0]

    return create_credential(
        user_id=user_id,
        assessment_id=assessment["id"],
        badge_level=badge_level,
        topics_mastered=topics,
        assessment_score=score,
        integrity_score=integrity,
    )


def clear_simulated_credentials(user_id: str) -> dict:
    """Deletes every credential (and its companion assessment) created
    via the Test Mode simulator for this user — identified purely by the
    '[TEST MODE]' prefix on the linked assessment's topic_cluster.
    Leaves every real credential completely untouched."""
    credentials = supabase.table("credentials").select("id,assessment_id").eq("user_id", user_id).execute().data
    if not credentials:
        return {"deleted": 0}

    assessment_ids = [c["assessment_id"] for c in credentials]
    assessments = supabase.table("assessments").select("id,topic_cluster").in_("id", assessment_ids).execute().data
    test_assessment_ids = {a["id"] for a in assessments if (a.get("topic_cluster") or "").startswith("[TEST MODE]")}

    to_delete = [c["id"] for c in credentials if c["assessment_id"] in test_assessment_ids]
    if not to_delete:
        return {"deleted": 0}

    supabase.table("credentials").delete().in_("id", to_delete).execute()
    supabase.table("assessments").delete().in_("id", list(test_assessment_ids)).execute()
    return {"deleted": len(to_delete)}


# --- Submissions ---------------------------------------------------------

def create_submission(
    user_id: str, language: str, topic: str, difficulty: str, source_code: str,
    execution_result: dict, complexity: str, detected_patterns: dict, ai_feedback: str,
    problem_id: str | None = None,
) -> dict:
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
        "problem_id": problem_id,
    }
    return supabase.table("submissions").insert(data).execute().data[0]


def get_submission_by_id(submission_id: str) -> dict | None:
    result = supabase.table("submissions").select("*").eq("id", submission_id).execute()
    return result.data[0] if result.data else None


def get_submissions_for_user(user_id: str, limit: int = 50) -> list[dict]:
    """Powers the student-facing 'My Submissions' page — distinct from
    get_recent_submissions above, which serves the admin/educator
    timeline view with a smaller default limit."""
    return (
        supabase.table("submissions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
        .data
    )


def has_passing_submission(user_id: str, problem_id: str) -> bool:
    """Used by Official Solutions to confirm the student actually
    completed THIS specific generated problem before revealing its
    canonical solution."""
    rows = (
        supabase.table("submissions")
        .select("execution_result")
        .eq("user_id", user_id)
        .eq("problem_id", problem_id)
        .execute()
        .data
    )
    return any((r.get("execution_result") or {}).get("all_passed") for r in rows)


def count_passing_submissions(user_id: str) -> int:
    """Total number of a user's fully-passing submissions, derived from
    execution_result->>'all_passed' — the same truth source as
    has_passing_submission (the submissions table has no status column).
    Used by the challenge gate's practice-readiness indicator."""
    rows = (
        supabase.table("submissions")
        .select("execution_result")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    return sum(1 for r in rows if (r.get("execution_result") or {}).get("all_passed"))


# --- Profile & Preferences -------------------------------------------------

def update_user_profile(user_id: str, updates: dict) -> dict:
    """Only 'name' and 'avatar_url' are user-editable from Profile — email
    is tied to Firebase auth (changing it means re-verifying identity, out
    of scope here), and role/xp/level/streak are system-managed elsewhere
    (roadmap completion, admin actions), never directly editable by the
    student themselves."""
    allowed = {k: v for k, v in updates.items() if k in ("name", "avatar_url") and v is not None}
    if not allowed:
        return get_full_user_by_id(user_id)
    return supabase.table("users").update(allowed).eq("id", user_id).execute().data[0]


def update_user_preferences(user_id: str, preferences: dict) -> dict:
    """Merges into the existing preferences JSONB blob rather than
    replacing it outright, so saving one setting (e.g. show_review_reminders)
    never silently wipes out any other preference already stored."""
    current = supabase.table("users").select("preferences").eq("id", user_id).execute().data[0]
    merged = {**(current.get("preferences") or {}), **preferences}
    return supabase.table("users").update({"preferences": merged}).eq("id", user_id).execute().data[0]


def get_last_submission_date_for_topic(user_id: str, topic: str) -> datetime | None:
    """Used by Spaced Review to check whether a student has practiced a
    given topic recently, independent of whether they've completed it."""
    rows = (
        supabase.table("submissions")
        .select("created_at")
        .eq("user_id", user_id)
        .eq("topic", topic)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        return None
    return _parse_timestamp(rows[0]["created_at"])


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


# --- Mock Interview Mode ----------------------------------------------

def create_interview_session(user_id: str, topic: str, difficulty: str, question: dict, time_limit_seconds: int) -> dict:
    # Stores the full question — including test_cases, stripped from the
    # client-visible response by interview_routes.py — under _test_cases,
    # since grading (submit_interview) needs them later.
    stored_question = {**question, "_test_cases": question.get("test_cases", [])}
    return (
        supabase.table("interview_sessions")
        .insert({
            "user_id": user_id,
            "topic": topic,
            "difficulty": difficulty,
            "question": stored_question,
            "time_limit_seconds": time_limit_seconds,
        })
        .execute()
        .data[0]
    )


def get_interview_session(session_id: str) -> dict | None:
    result = supabase.table("interview_sessions").select("*").eq("id", session_id).execute()
    return result.data[0] if result.data else None


def update_interview_session(session_id: str, updates: dict) -> dict:
    """Always computes submitted_at and time_taken_seconds itself from the
    session's own started_at, regardless of what (if anything) the caller
    passed for submitted_at — keeps this the single source of truth for
    interview timing rather than trusting a caller-supplied timestamp."""
    session = get_interview_session(session_id)
    started = _parse_timestamp(session["started_at"])
    now = datetime.now(timezone.utc)

    updates["submitted_at"] = now.isoformat()
    result = supabase.table("interview_sessions").update(updates).eq("id", session_id).execute().data[0]
    result["time_taken_seconds"] = int((now - started).total_seconds())
    return result


def get_interview_history(user_id: str) -> list[dict]:
    return (
        supabase.table("interview_sessions")
        .select("id, topic, difficulty, status, execution_result, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
        .data
    )


# --- Teacher Comments on Submissions ------------------------------------

def add_submission_comment(submission_id: str, educator_id: str, educator_name: str, comment: str) -> dict:
    result = (
        supabase.table("submission_comments")
        .insert({"submission_id": submission_id, "educator_id": educator_id, "comment": comment})
        .execute()
        .data[0]
    )
    result["educator_name"] = educator_name
    return result


def get_comments_for_submission(submission_id: str) -> list[dict]:
    comments = (
        supabase.table("submission_comments")
        .select("*")
        .eq("submission_id", submission_id)
        .order("created_at")
        .execute()
        .data
    )
    if not comments:
        return []
    educator_ids = list({c["educator_id"] for c in comments})
    educators = supabase.table("users").select("id, name").in_("id", educator_ids).execute().data
    name_map = {e["id"]: e["name"] for e in educators}
    for c in comments:
        c["educator_name"] = name_map.get(c["educator_id"], "Educator")
    return comments


# --- Peer Discussion (practice problems only — see discussion_routes.py) --

def add_discussion_comment(problem_id: str, user_id: str, user_name: str, comment: str) -> dict:
    result = (
        supabase.table("problem_discussions")
        .insert({"problem_id": problem_id, "user_id": user_id, "comment": comment})
        .execute()
        .data[0]
    )
    result["user_name"] = user_name
    return result


def get_discussions_for_problem(problem_id: str) -> list[dict]:
    rows = (
        supabase.table("problem_discussions")
        .select("*")
        .eq("problem_id", problem_id)
        .eq("is_hidden", False)
        .order("created_at")
        .execute()
        .data
    )
    if not rows:
        return []
    user_ids = list({r["user_id"] for r in rows})
    users = supabase.table("users").select("id, name").in_("id", user_ids).execute().data
    name_map = {u["id"]: u["name"] for u in users}
    for r in rows:
        r["user_name"] = name_map.get(r["user_id"], "Student")
    return rows


def hide_discussion_comment(comment_id: str) -> None:
    supabase.table("problem_discussions").update({"is_hidden": True}).eq("id", comment_id).execute()