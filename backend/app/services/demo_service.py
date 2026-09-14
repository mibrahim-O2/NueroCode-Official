"""Demo Mode orchestration.

Separation from real data
-------------------------
Demo Mode must never read or write real student data. Everything a demo run
produces is stored in separate demo_* tables (migrations 027-035), and every
function here scopes those tables to the owner's own user_id. The single
deliberate exception is the three demo cohort accounts (Demo Student A/B/C):
they are real users rows flagged is_demo_cohort = true, so the REAL admin
role-change and reset actions work on them unmodified, while the real
repositories exclude them from every real-facing view unconditionally
(migration 026).

What stays real, on purpose
---------------------------
* XP / level / streak. Completing a demo roadmap topic awards XP to the
  owner's real users row through the real complete_roadmap_node ->
  update_user_progress path. The XP Demo Mode awards is tallied in the
  owner's preferences (demo_xp_awarded), so the Dashboard reset reverses
  exactly that amount and never touches XP earned outside Demo Mode.
* Every grading and scoring step: execution_service.run_submission, the
  Tree-sitter analyzer, the adaptive reorder rule, integrity scoring, and the
  pass / flag / credential-tier rules are the real functions, called as-is.
Only "which problem or question exists" comes from app/demo/demo_content.py.

Security
--------
is_owner() is the primary security boundary of the whole feature.
demo_routes enforces it before anything else on every gated route; functions
below assume their caller has already passed it.
"""

import hmac
import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.ai.code_analysis import analyze_code
from app.config.settings import settings
from app.database import repositories as repo
from app.demo import demo_content as content
from app.services import admin_service
from app.services.analysis_service import reorder_roadmap_for_anti_patterns
from app.services.assessment_service import (
    GRACE_PERIOD_SECONDS as ASSESSMENT_GRACE_SECONDS,
    _identify_weak_topic,
    badge_level_for_score,
    integrity_score_from_events,
    is_assessment_passed,
    is_integrity_flagged,
)
from app.services.challenge_service import PRACTICE_READINESS_THRESHOLD
from app.services.execution_service import run_submission
from app.services.interview_service import GRACE_PERIOD_SECONDS as INTERVIEW_GRACE_SECONDS
from app.services.supabase_service import supabase
from app.services.user_charts_service import CHARTS_ROW_LIMIT, build_user_charts, charts_window_start

logger = logging.getLogger(__name__)

DEMO_ROADMAP_TABLE = "demo_roadmap_progress"

# Keys inside the owner's users.preferences JSONB. Demo Mode's on/off state
# lives there (merged, never overwritten — see update_user_preferences), so
# it needs no table of its own and survives logouts.
PREF_ENABLED = "demo_mode_enabled"
PREF_PERSONA = "demo_persona"
PREF_PASSCODE_VERIFIED_AT = "demo_passcode_verified_at"
PREF_XP_AWARDED = "demo_xp_awarded"

# How long one successful passcode entry keeps "switch Demo Mode on" allowed.
# Covers a full presentation day; after that the passcode is asked again.
PASSCODE_SESSION_HOURS = 12

RESET_SCOPES = (
    "dashboard", "roadmap", "practice", "challenge", "interview",
    "submissions", "assessment", "credentials", "cohort",
)

_NOT_FOUND = "Not found."


# ============================================================================
# Access: owner check, passcode, on/off state
# ============================================================================

def is_owner(user: dict) -> bool:
    """THE security boundary for Demo Mode: true only for the single account
    whose email matches settings.OWNER_EMAIL (case-insensitive).

    An unset OWNER_EMAIL matches nobody — including an account whose own
    email is empty (possible with some OAuth logins), which is why the
    emptiness check comes first rather than relying on string equality."""
    owner_email = settings.OWNER_EMAIL.strip().lower()
    user_email = (user.get("email") or "").strip().lower()
    return bool(owner_email) and user_email == owner_email


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _preferences(user_id: str) -> dict:
    row = repo.get_full_user_by_id(user_id) or {}
    return row.get("preferences") or {}


def _passcode_recently_verified(prefs: dict) -> bool:
    verified_at = prefs.get(PREF_PASSCODE_VERIFIED_AT)
    if not verified_at:
        return False
    try:
        return _now() - repo._parse_timestamp(verified_at) < timedelta(hours=PASSCODE_SESSION_HOURS)
    except ValueError:
        return False


def _persona(prefs: dict) -> dict:
    return prefs.get(PREF_PERSONA) or content.DEMO_PERSONA


def get_status(user: dict) -> dict:
    """Current Demo Mode state for the owner — read by the frontend's
    DemoModeContext on load, and after every toggle."""
    prefs = _preferences(user["id"])
    return {
        "demo_mode_enabled": bool(prefs.get(PREF_ENABLED)),
        "persona": _persona(prefs),
        "passcode_verified": _passcode_recently_verified(prefs),
    }


def verify_passcode(user: dict, passcode: str) -> dict:
    """Checks DEMO_MODE_PASSCODE — same request/response shape as the real
    POST /admin/verify-provider-passcode.

    Unlike the provider passcode (pure UX friction), this one is also
    enforced server-side: a successful check is recorded with a timestamp,
    and set_enabled(True) refuses to switch Demo Mode on without a recent
    one. So Demo Mode genuinely needs BOTH the owner's account and the
    passcode, not just a frontend prompt."""
    configured = settings.DEMO_MODE_PASSCODE
    if not configured.strip():
        # Never let an unconfigured server accept an empty passcode.
        raise HTTPException(status_code=503, detail="Demo Mode passcode is not configured on the server.")
    # compare_digest: constant-time comparison, so response timing can't leak
    # how much of a guess was correct.
    if not hmac.compare_digest(passcode.encode("utf-8"), configured.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Incorrect passcode.")
    repo.update_user_preferences(user["id"], {PREF_PASSCODE_VERIFIED_AT: _now().isoformat()})
    return {"verified": True}


def set_enabled(user: dict, enabled: bool) -> dict:
    """Flips demo_mode_enabled in the owner's preferences.

    Switching ON requires a recent passcode verification, then runs the
    idempotent first-activation seeding. Switching OFF never requires the
    passcode — exiting a demo must always be one click — and changes nothing
    except the flag, so the owner's real account is exactly as it was."""
    user_id = user["id"]
    if enabled:
        if not _passcode_recently_verified(_preferences(user_id)):
            raise HTTPException(status_code=403, detail="Enter the Demo Mode passcode to switch Demo Mode on.")
        _ensure_seeded(user)
        repo.update_user_preferences(user_id, {PREF_ENABLED: True, PREF_PERSONA: content.DEMO_PERSONA})
    else:
        repo.update_user_preferences(user_id, {PREF_ENABLED: False})
    return get_status(user)


def demo_verification_notice() -> dict:
    """Body for the PUBLIC GET /demo/verify/{uuid}. It never looks anything
    up — not the real credentials table, and not demo_credentials either — so
    it can't be used to confirm or probe any credential's existence. Every
    demo credential link lands on this same notice."""
    return {
        "is_demo_credential": True,
        "title": "This is a demo credential",
        "message": (
            "This credential was issued from NeuroCode's Demo Mode for evaluation purposes and does not "
            "certify real achievement. Join NeuroCode with a real account to earn a genuine, verifiable "
            "credential."
        ),
    }


# ============================================================================
# First-activation seeding (idempotent — safe on every switch-on)
# ============================================================================

def _ensure_seeded(user: dict) -> None:
    """Creates whatever demo state is missing. Every step checks before it
    writes, so switching Demo Mode on repeatedly never duplicates anything."""
    user_id = user["id"]
    _ensure_demo_roadmap(user_id)
    cohort = _ensure_cohort_users()
    _seed_example_discussions({member["key"]: row for member, row, _ in cohort})
    _seed_example_submission(user_id)


def _ensure_demo_roadmap(user_id: str) -> list[dict]:
    """Seeds the 5-topic demo roadmap with the real seed_default_roadmap
    (position 0 unlocked, the rest locked) into demo_roadmap_progress —
    never into the real roadmap_nodes."""
    nodes = repo.get_roadmap_for_user(user_id, table=DEMO_ROADMAP_TABLE)
    if nodes:
        return nodes
    return repo.seed_default_roadmap(user_id, topics=content.DEMO_ROADMAP_TOPICS, table=DEMO_ROADMAP_TABLE)


def _ensure_cohort_users() -> list[tuple[dict, dict, bool]]:
    """Get-or-create Demo Student A/B/C by firebase_uid — the same idempotent
    pattern real login uses (supabase_service.get_or_create_user).

    The pattern is mirrored rather than get_or_create_user being called
    directly, because that function inserts the row first and would leave it
    unflagged until a second update. Inserting with is_demo_cohort = true in
    the same statement means there is never a moment when a demo account is
    visible in a real leaderboard or user list.

    Returns (content member, users row, created_now) per account. A newly
    created account also gets its starting roadmap progress seeded."""
    results = []
    for member in content.DEMO_COHORT:
        existing = supabase.table("users").select("*").eq("firebase_uid", member["firebase_uid"]).execute().data
        if existing:
            row = existing[0]
            if not row.get("is_demo_cohort"):
                # Self-heal a row that somehow lost its flag, so it drops out
                # of real views again immediately.
                row = supabase.table("users").update({"is_demo_cohort": True}).eq("id", row["id"]).execute().data[0]
            results.append((member, row, False))
            continue

        row = (
            supabase.table("users")
            .insert({
                "firebase_uid": member["firebase_uid"],
                "name": member["name"],
                "email": member["email"],
                "avatar_url": None,
                "role": "student",
                "xp": 0,
                "level": 1,
                "streak": 0,
                "is_demo_cohort": True,
            })
            .execute()
            .data[0]
        )
        _seed_cohort_progress(row["id"], member["seed_completed_topics"])
        results.append((member, row, True))
    return results


def _seed_cohort_progress(student_id: str, target_completed: int) -> None:
    """Completes a demo cohort account's first N REAL roadmap topics through
    the real complete_roadmap_node, so their XP and level are genuinely
    earned, not written directly. Stops early if nothing is left to unlock."""
    nodes = repo.get_roadmap_for_user(student_id) or repo.seed_default_roadmap(student_id)
    completed = sum(1 for n in nodes if n["status"] == "completed")
    while completed < target_completed:
        next_node = next(
            (n for n in repo.get_roadmap_for_user(student_id) if n["status"] in ("unlocked", "in_progress")),
            None,
        )
        if next_node is None:
            break
        repo.complete_roadmap_node(next_node["id"], student_id)
        completed += 1


def _seed_example_discussions(cohort_by_key: dict) -> None:
    """One example discussion comment per practice problem that has none yet,
    authored by a demo cohort account. Only ever touches
    demo_discussion_comments."""
    existing_keys = {
        row["problem_key"] for row in supabase.table("demo_discussion_comments").select("problem_key").execute().data
    }
    rows = []
    for problem_key, (member_key, comment) in content.EXAMPLE_DISCUSSION_COMMENTS.items():
        author = cohort_by_key.get(member_key)
        if problem_key in existing_keys or author is None:
            continue
        rows.append({"problem_key": problem_key, "user_id": author["id"], "user_name": author["name"], "comment": comment})
    if rows:
        supabase.table("demo_discussion_comments").insert(rows).execute()


def _seed_example_submission(user_id: str) -> None:
    """Gives the owner one example My Submissions entry with a teacher
    comment, if they have no demo submissions yet.

    The submission is graded for real: its correct solution is run through
    run_submission. If Piston is unreachable right now, seeding is skipped
    and retried on the next activation — a fake execution result is never
    written."""
    if supabase.table("demo_submissions").select("id").eq("user_id", user_id).limit(1).execute().data:
        return

    example = content.EXAMPLE_TEACHER_COMMENT
    problem = content.get_practice_problem(example["problem_key"])
    code = problem["solutions"][example["language"]]["correct"]
    outcome = run_submission(problem, example["language"], code)
    if "error" in outcome:
        logger.warning("Demo Mode: skipped example submission seeding (%s)", outcome["error"])
        return

    submission = (
        supabase.table("demo_submissions")
        .insert({
            "user_id": user_id,
            "problem_key": problem["key"],
            "language": example["language"],
            "source_code": code,
            "execution_result": outcome,
            "complexity": analyze_code(code, example["language"])["complexity"],
        })
        .execute()
        .data[0]
    )
    supabase.table("demo_submission_comments").insert({
        "demo_submission_id": submission["id"],
        "educator_name": content.DEMO_EDUCATOR_NAME,
        "comment": example["comment"],
    }).execute()


# ============================================================================
# Shared helpers
# ============================================================================

def _require_uuid(value: str) -> str:
    """Demo row ids are UUIDs. Rejecting anything else up front returns a
    clean 404 instead of a database type error."""
    try:
        uuid.UUID(str(value))
    except ValueError:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    return value


def _raise_for_execution_error(outcome: dict) -> None:
    """Same status mapping as the real submission route: Piston being down is
    a 503, anything else (e.g. an unsupported return type) is a 400."""
    if "error" in outcome:
        status = 503 if outcome.get("error_type") == "infrastructure" else 400
        raise HTTPException(status_code=status, detail=outcome["error"])


def _delete_rows(table: str, column: str, value: str) -> int:
    """Deletes rows matching one column and returns how many there were —
    the same select-then-delete shape the real admin reset functions use."""
    existing = supabase.table(table).select("id").eq(column, value).execute().data
    if existing:
        supabase.table(table).delete().eq(column, value).execute()
    return len(existing)


def _record_demo_xp(user_id: str, xp_awarded: int) -> None:
    """Tallies XP awarded by Demo Mode, so the Dashboard reset can reverse
    exactly that amount from the owner's real XP."""
    prefs = _preferences(user_id)
    repo.update_user_preferences(user_id, {PREF_XP_AWARDED: int(prefs.get(PREF_XP_AWARDED) or 0) + int(xp_awarded)})


def _problem_topic(problem_key: str) -> str:
    problem = content.get_practice_problem(problem_key)
    return problem["topic"] if problem else "General"


def _passing_demo_submission_count(user_id: str) -> int:
    rows = supabase.table("demo_submissions").select("execution_result").eq("user_id", user_id).execute().data
    return sum(1 for r in rows if (r.get("execution_result") or {}).get("all_passed"))


# ============================================================================
# Dashboard
# ============================================================================

def get_dashboard_charts(user: dict) -> dict:
    """Same payload as the real GET /profile/analytics/user-charts, built by
    the same user_charts_service — but fed from demo_submissions and
    demo_roadmap_progress. XP and level come from the owner's real users row,
    because XP is real in Demo Mode."""
    user_id = user["id"]
    user_row = supabase.table("users").select("xp, level, streak, created_at").eq("id", user_id).execute().data[0]
    submissions = (
        supabase.table("demo_submissions")
        .select("created_at, problem_key, execution_result")
        .eq("user_id", user_id)
        .gte("created_at", charts_window_start())
        .order("created_at")
        .limit(CHARTS_ROW_LIMIT)
        .execute()
        .data
    )
    completed_nodes = (
        supabase.table(DEMO_ROADMAP_TABLE)
        .select("completed_at, xp_earned")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .order("completed_at")
        .execute()
        .data
    )
    for submission in submissions:
        submission["topic"] = _problem_topic(submission["problem_key"])
    return build_user_charts(user_row, submissions, completed_nodes)


# ============================================================================
# Roadmap
# ============================================================================

def get_roadmap(user: dict) -> list[dict]:
    """Mirrors GET /roadmap/: returns the demo roadmap, seeding it on first
    read. Reads only demo_roadmap_progress."""
    return _ensure_demo_roadmap(user["id"])


def _demo_node(user_id: str, topic: str) -> dict:
    wanted = (topic or "").strip().lower()
    node = next((n for n in _ensure_demo_roadmap(user_id) if n["topic"].lower() == wanted), None)
    if node is None:
        raise HTTPException(status_code=404, detail=f"'{topic}' is not one of the demo roadmap topics.")
    return node


def start_topic(user: dict, topic: str) -> dict:
    """Mirrors POST /roadmap/{node_id}/start with the real
    mark_node_in_progress, against demo_roadmap_progress."""
    node = _demo_node(user["id"], topic)
    updated = repo.mark_node_in_progress(node["id"], user["id"], table=DEMO_ROADMAP_TABLE)
    if not updated:
        raise HTTPException(status_code=404, detail="Topic not found or not eligible to start")
    return updated


def complete_topic(user: dict, topic: str) -> dict:
    """Mirrors POST /roadmap/{node_id}/complete with the real
    complete_roadmap_node: unlocks the next demo topic and awards REAL XP to
    the owner's account. The award is also tallied for the Dashboard reset."""
    node = _demo_node(user["id"], topic)
    result = repo.complete_roadmap_node(node["id"], user["id"], table=DEMO_ROADMAP_TABLE)
    if not result:
        raise HTTPException(status_code=404, detail="Topic not found or already completed")
    _record_demo_xp(user["id"], result["xp_awarded"])
    return result


def get_topic_progress(user: dict) -> dict:
    """Mirrors GET /roadmap/topic-progress (passing submissions per topic,
    used by the Challenge Gate readiness bar), counted from demo_submissions."""
    rows = supabase.table("demo_submissions").select("problem_key, execution_result").eq("user_id", user["id"]).execute().data
    progress: dict[str, int] = {}
    for row in rows:
        if (row.get("execution_result") or {}).get("all_passed"):
            topic = _problem_topic(row["problem_key"])
            progress[topic] = progress.get(topic, 0) + 1
    return {"topic_progress": progress}


# ============================================================================
# Practice + discussions
# ============================================================================

_PUBLIC_PROBLEM_FIELDS = (
    "key", "topic", "difficulty", "title", "description", "examples", "constraints", "expected_complexity",
)


def _public_problem(problem: dict) -> dict:
    """What the client may see: never test cases, never solutions (same rule
    as real generated problems). `id` is set to the problem_key so existing
    components keyed on problem.id work unchanged. `provider_used` drives the
    real "Generated with Gemini" badge for UI consistency — the content itself
    is fixed and hand-authored, never generated live."""
    return {**{field: problem[field] for field in _PUBLIC_PROBLEM_FIELDS}, "id": problem["key"], "provider_used": "gemini"}


def get_practice_catalog() -> list[dict]:
    """Lightweight list of the fixed practice problems so the Practice page
    can pick one by difficulty and topic without hardcoding any keys."""
    return [
        {"key": p["key"], "topic": p["topic"], "difficulty": p["difficulty"], "title": p["title"]}
        for p in content.PRACTICE_PROBLEMS
    ]


def get_practice_problem(problem_key: str) -> dict:
    problem = content.get_practice_problem(problem_key)
    if problem is None:
        raise HTTPException(status_code=404, detail="Demo problem not found")
    return _public_problem(problem)


def _deterministic_feedback(outcome: dict, analysis: dict) -> str:
    """Real Practice feedback is written by the AI provider. Demo Mode never
    calls an AI at runtime, so this is fixed template text built only from
    the REAL test results and the REAL analyzer output."""
    passed, total = outcome["passed_count"], outcome["total_count"]
    flagged = bool(analysis["anti_patterns"])
    if outcome["all_passed"] and not flagged:
        return f"All {total} test cases passed with {analysis['complexity']} complexity and no inefficiencies detected."
    if outcome["all_passed"]:
        return f"All {total} test cases passed, but the analyzer flagged an inefficiency below — see the suggested fix."
    if flagged:
        return (
            f"{passed}/{total} test cases passed, and the analyzer flagged an inefficiency below. Compare the "
            "failing cases' expected and actual output, then address the flagged pattern."
        )
    return f"{passed}/{total} test cases passed. Compare the expected and actual output of the failing cases to find the bug."


def submit_practice(user: dict, problem_key: str, language: str, source_code: str) -> dict:
    """Grades a demo practice submission exactly like POST /submissions/execute:
    real run_submission, real Tree-sitter analysis, real adaptive-reorder rule.
    Differences are only where things are stored — demo_submissions and
    demo_roadmap_progress — and that feedback text is templated, not AI."""
    user_id = user["id"]
    problem = content.get_practice_problem(problem_key)
    if problem is None:
        raise HTTPException(status_code=404, detail="Demo problem not found")

    outcome = run_submission(problem, language, source_code)
    _raise_for_execution_error(outcome)

    analysis = analyze_code(source_code, language)
    saved = (
        supabase.table("demo_submissions")
        .insert({
            "user_id": user_id,
            "problem_key": problem_key,
            "language": language,
            "source_code": source_code,
            "execution_result": outcome,
            "complexity": analysis["complexity"],
        })
        .execute()
        .data[0]
    )

    # The demo roadmap must exist for the reorder to have anything to move.
    _ensure_demo_roadmap(user_id)
    reordered_topic = reorder_roadmap_for_anti_patterns(
        user_id, problem["topic"], analysis["anti_patterns"], table=DEMO_ROADMAP_TABLE
    )

    return {
        **outcome,
        "submission_id": saved["id"],
        "analysis": {
            "complexity": analysis["complexity"],
            "anti_patterns": analysis["anti_patterns"],
            "feedback": _deterministic_feedback(outcome, analysis),
            "reordered_topic": reordered_topic,
        },
    }


def list_discussions(problem_key: str) -> list[dict]:
    """Mirrors GET /problems/{id}/discussions, reading demo_discussion_comments."""
    if content.get_practice_problem(problem_key) is None:
        raise HTTPException(status_code=404, detail="Demo problem not found")
    return (
        supabase.table("demo_discussion_comments")
        .select("*")
        .eq("problem_key", problem_key)
        .order("created_at")
        .execute()
        .data
    )


def add_discussion(user: dict, problem_key: str, comment: str) -> dict:
    """Mirrors POST /problems/{id}/discussions. The author name stored is the
    demo persona, so the owner's real name never appears in a demo thread."""
    if content.get_practice_problem(problem_key) is None:
        raise HTTPException(status_code=404, detail="Demo problem not found")
    return (
        supabase.table("demo_discussion_comments")
        .insert({
            "problem_key": problem_key,
            "user_id": user["id"],
            "user_name": _persona(_preferences(user["id"]))["display_name"],
            "comment": comment,
        })
        .execute()
        .data[0]
    )


# ============================================================================
# Challenge Gate
# ============================================================================

def _challenge_node_key(node_key: str) -> str:
    if (node_key or "").strip().lower() != content.CHALLENGE_NODE_KEY.lower():
        raise HTTPException(
            status_code=404,
            detail=f"The demo Challenge Gate is on the {content.CHALLENGE_NODE_KEY} topic.",
        )
    return content.CHALLENGE_NODE_KEY


def _challenge_row(user_id: str) -> dict | None:
    rows = (
        supabase.table("demo_challenge_progress")
        .select("*")
        .eq("user_id", user_id)
        .eq("node_key", content.CHALLENGE_NODE_KEY)
        .limit(1)
        .execute()
        .data
    )
    return rows[0] if rows else None


def _challenge_response(user_id: str, row: dict) -> dict:
    """Same response shape as the real challenge_service, so the real
    Challenge page renders it unchanged. Test cases are never included."""
    total = len(content.CHALLENGE_PROBLEMS)
    solved = sorted(set(row.get("solved_indices") or []))
    questions = [
        {
            "index": i,
            "difficulty": q["difficulty"],
            "title": q["title"],
            "description": q["description"],
            "examples": q["examples"],
            "constraints": q["constraints"],
            "expected_complexity": q["expected_complexity"],
            "starter_code": "def solve(*args):\n    # Write your solution here\n    pass\n",
        }
        for i, q in enumerate(content.CHALLENGE_PROBLEMS)
    ]
    practice_count = _passing_demo_submission_count(user_id)
    return {
        "challenge": {
            "id": row["id"],
            "node_key": row["node_key"],
            "questions": questions,
            "solved_indices": solved,
            "current_index": 0,
            "status": row["status"],
            "score": round(len(solved) / total * 100, 2),
        },
        "practice_count": practice_count,
        "practice_threshold": PRACTICE_READINESS_THRESHOLD,
        "is_capable": practice_count >= PRACTICE_READINESS_THRESHOLD,
    }


def get_or_start_challenge(user: dict, node_key: str) -> dict:
    """Mirrors GET /challenges/{node_id}: returns the owner's gate session,
    creating it on first visit. Like the real gate, a still-locked roadmap
    topic can't be attempted."""
    user_id = user["id"]
    key = _challenge_node_key(node_key)
    if _demo_node(user_id, key)["status"] == "locked":
        raise HTTPException(status_code=403, detail="Complete the earlier topics before attempting this challenge gate.")
    row = _challenge_row(user_id)
    if row is None:
        row = (
            supabase.table("demo_challenge_progress")
            .insert({"user_id": user_id, "node_key": key, "solved_indices": [], "status": "in_progress"})
            .execute()
            .data[0]
        )
    return _challenge_response(user_id, row)


def submit_challenge_question(user: dict, node_key: str, question_index: int, code: str, language: str) -> dict:
    """Mirrors challenge_service.submit_challenge_question: grades one
    question with the real run_submission and, once every question is solved,
    completes the demo roadmap node through the real complete_roadmap_node
    (real XP). That completion is also what unlocks Assessment 2."""
    user_id = user["id"]
    _challenge_node_key(node_key)
    row = _challenge_row(user_id)
    if row is None:
        raise HTTPException(status_code=404, detail="No active challenge session was found for this node.")
    if not 0 <= question_index < len(content.CHALLENGE_PROBLEMS):
        raise HTTPException(status_code=400, detail="That question does not exist in this challenge.")

    question = content.CHALLENGE_PROBLEMS[question_index]
    outcome = run_submission({"test_cases": question["test_cases"]}, language, code)
    _raise_for_execution_error(outcome)

    total_questions = len(content.CHALLENGE_PROBLEMS)
    passed = bool(outcome["all_passed"])
    status = row["status"]
    solved = set(row.get("solved_indices") or [])
    if passed and status == "in_progress":
        solved.add(question_index)
    all_completed = len(solved) >= total_questions

    update = {"solved_indices": sorted(solved)}
    node_completion = None
    if all_completed and status == "in_progress":
        update["status"] = status = "passed"
        node = _demo_node(user_id, content.CHALLENGE_NODE_KEY)
        node_completion = repo.complete_roadmap_node(node["id"], user_id, table=DEMO_ROADMAP_TABLE)
        if node_completion:
            _record_demo_xp(user_id, node_completion["xp_awarded"])
    supabase.table("demo_challenge_progress").update(update).eq("id", row["id"]).execute()

    return {
        "passed": passed,
        "passed_count": outcome["passed_count"],
        "total_count": outcome["total_count"],
        "results": outcome["results"],
        "question_index": question_index,
        "solved_count": len(solved),
        "total_questions": total_questions,
        "all_completed": all_completed,
        "score": round(len(solved) / total_questions * 100, 2),
        "status": status,
        "node_completion": node_completion,
    }


# ============================================================================
# Mock Interview
# ============================================================================

def start_interview(user: dict, topic: str) -> dict:
    """Mirrors POST /interviews/start with one of the 3 fixed topics, stored
    in demo_interview_sessions (never the real interview history)."""
    interview = content.get_interview_topic(topic)
    if interview is None:
        names = ", ".join(t["topic"] for t in content.MOCK_INTERVIEW_TOPICS)
        raise HTTPException(status_code=400, detail=f"Demo interview topics are: {names}.")
    session = (
        supabase.table("demo_interview_sessions")
        .insert({"user_id": user["id"], "topic": interview["topic"], "status": "in_progress"})
        .execute()
        .data[0]
    )
    return {
        "id": session["id"],
        "topic": interview["topic"],
        "difficulty": interview["difficulty"],
        "title": interview["title"],
        "description": interview["description"],
        "examples": interview["examples"],
        "constraints": interview["constraints"],
        "expected_complexity": interview["expected_complexity"],
        "time_limit_seconds": settings.INTERVIEW_DURATION_SECONDS,
        "started_at": session["created_at"],
    }


def submit_interview(user: dict, session_id: str, language: str, source_code: str) -> dict:
    """Mirrors interview_service.submit_interview: same server-authoritative
    time limit and grace period, real run_submission, real analyzer."""
    _require_uuid(session_id)
    rows = (
        supabase.table("demo_interview_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", user["id"])
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=400, detail="Interview session not found.")
    session = rows[0]
    if session["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="This interview session has already been completed.")

    elapsed = (_now() - repo._parse_timestamp(session["created_at"])).total_seconds()
    if elapsed > settings.INTERVIEW_DURATION_SECONDS + INTERVIEW_GRACE_SECONDS:
        raise HTTPException(status_code=408, detail="Interview time limit exceeded — this submission is too late to be graded.")

    interview = content.get_interview_topic(session["topic"])
    execution_result = run_submission({"test_cases": interview["test_cases"]}, language, source_code)
    _raise_for_execution_error(execution_result)
    analysis = analyze_code(source_code, language) if language == "python" else None

    supabase.table("demo_interview_sessions").update({
        "status": "completed",
        "execution_result": execution_result,
        "time_taken_seconds": int(elapsed),
    }).eq("id", session_id).execute()

    return {
        "results": execution_result,
        "complexity": analysis["complexity"] if analysis else None,
        "anti_patterns": analysis["anti_patterns"] if analysis else [],
        "time_taken_seconds": int(elapsed),
        "all_passed": execution_result.get("all_passed", False),
    }


# ============================================================================
# Assessments + proctoring
# ============================================================================

def _attempts(user_id: str, assessment_key: str | None = None) -> list[dict]:
    query = supabase.table("demo_assessment_attempts").select("*").eq("user_id", user_id)
    if assessment_key:
        query = query.eq("assessment_key", assessment_key)
    return query.order("started_at", desc=True).execute().data


def _attempt_passed(attempt: dict) -> bool:
    # A flagged attempt can never count as passed — same as the real system,
    # where "passed" requires status = 'completed'.
    return attempt["status"] == "completed" and is_assessment_passed(
        float(attempt["assessment_score"] or 0), float(attempt["integrity_score"] or 0)
    )


def _unlock_state(user_id: str, assessment: dict) -> bool:
    """Evaluates an assessment's unlock_rule (see demo_content.ASSESSMENTS)."""
    rule = assessment["unlock_rule"]
    if rule["type"] == "roadmap_topics_completed":
        completed = {n["topic"] for n in _ensure_demo_roadmap(user_id) if n["status"] == "completed"}
        return all(topic in completed for topic in rule["topics"])
    if rule["type"] == "challenge_gate_passed":
        row = _challenge_row(user_id)
        return bool(row and row["status"] == "passed")
    return False


def list_assessments(user: dict) -> dict:
    """Mirrors GET /assessments/available-clusters (name, topics, unlocked,
    passed), plus the human-readable unlock requirement for the locked-state
    UI, the tier any passing attempt earned, and the inline integrity guide."""
    user_id = user["id"]
    assessments = []
    for assessment in content.ASSESSMENTS:
        attempts = _attempts(user_id, assessment["key"])
        passing = [a for a in attempts if _attempt_passed(a)]
        best = max(passing, key=lambda a: float(a["assessment_score"]), default=None)
        assessments.append({
            "key": assessment["key"],
            "name": assessment["name"],
            "topics": assessment["topics"],
            "unlocked": _unlock_state(user_id, assessment),
            "passed": best is not None,
            "unlock_requirement": assessment["unlock_rule"]["description"],
            "earned_badge_level": badge_level_for_score(float(best["assessment_score"])) if best else None,
        })
    return {"assessments": assessments, "integrity_testing_guide": content.INTEGRITY_TESTING_GUIDE}


def start_assessment(user: dict, assessment_key: str) -> dict:
    """Mirrors POST /assessments/start, including the 403 for a locked
    assessment — enforced here on the server, not just hidden in the UI."""
    assessment = content.get_assessment(assessment_key)
    if assessment is None:
        raise HTTPException(status_code=404, detail="Demo assessment not found")
    if not _unlock_state(user["id"], assessment):
        raise HTTPException(status_code=403, detail=f"This assessment is locked. {assessment['unlock_rule']['description']}")

    attempt = (
        supabase.table("demo_assessment_attempts")
        .insert({"user_id": user["id"], "assessment_key": assessment_key, "unlocked": True, "status": "in_progress"})
        .execute()
        .data[0]
    )
    return {
        "id": attempt["id"],
        "key": assessment_key,
        "cluster": assessment["name"],
        "title": assessment["name"],
        "topics": assessment["topics"],
        "questions": [
            {
                "index": i,
                "title": q["title"],
                "description": q["description"],
                "examples": q["examples"],
                "constraints": q["constraints"],
                "expected_complexity": q["expected_complexity"],
            }
            for i, q in enumerate(assessment["questions"])
        ],
        "duration_seconds": settings.ASSESSMENT_DURATION_SECONDS,
        "test_mode": False,
    }


def _owned_attempt(user_id: str, attempt_id: str) -> dict:
    _require_uuid(attempt_id)
    rows = supabase.table("demo_assessment_attempts").select("*").eq("id", attempt_id).eq("user_id", user_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return rows[0]


def log_proctoring_event(user: dict, attempt_id: str, event_type: str, severity: str) -> dict:
    """Mirrors POST /assessments/{id}/proctoring-log: persists one detector
    event for an in-progress attempt, in demo_proctoring_logs."""
    attempt = _owned_attempt(user["id"], attempt_id)
    if attempt["status"] != "in_progress":
        raise HTTPException(status_code=409, detail="Assessment is not in progress")
    supabase.table("demo_proctoring_logs").insert(
        {"attempt_id": attempt_id, "event_type": event_type, "severity": severity}
    ).execute()
    return {"logged": True}


def submit_assessment(user: dict, attempt_id: str, language: str, solutions: list[str]) -> dict:
    """Mirrors assessment_service.submit_assessment.

    The integrity score is recomputed HERE from demo_proctoring_logs with the
    real integrity_score_from_events — the client never supplies it. Every
    question is graded by the real run_submission; the score is passed test
    cases over total test cases (the real formula, across all questions), and
    flagging / pass / tier use the real shared rules.

    Credentials are not auto-issued: issuing is presenter-triggered in Demo
    Mode. The tier this attempt earned is returned so the presenter can issue
    the matching one."""
    user_id = user["id"]
    attempt = _owned_attempt(user_id, attempt_id)
    if attempt["status"] != "in_progress":
        raise HTTPException(status_code=409, detail="Assessment already completed")

    elapsed = (_now() - repo._parse_timestamp(attempt["started_at"])).total_seconds()
    if elapsed > settings.ASSESSMENT_DURATION_SECONDS + ASSESSMENT_GRACE_SECONDS:
        raise HTTPException(status_code=408, detail="Assessment time limit exceeded")

    assessment = content.get_assessment(attempt["assessment_key"])
    questions = assessment["questions"]
    if len(solutions) != len(questions):
        raise HTTPException(status_code=400, detail=f"Expected {len(questions)} solutions, one per question.")

    logs = supabase.table("demo_proctoring_logs").select("event_type").eq("attempt_id", attempt_id).execute().data
    integrity_score = integrity_score_from_events([log["event_type"] for log in logs])

    question_results = []
    passed_cases = total_cases = 0
    weak_topic_source = None
    for index, (question, code) in enumerate(zip(questions, solutions)):
        outcome = run_submission({"test_cases": question["test_cases"]}, language, code)
        _raise_for_execution_error(outcome)
        passed_cases += outcome["passed_count"]
        total_cases += outcome["total_count"]
        question_results.append({"index": index, "title": question["title"], **outcome})
        if weak_topic_source is None and not outcome["all_passed"]:
            weak_topic_source = code

    assessment_score = round(100 * passed_cases / total_cases, 2)
    flagged = is_integrity_flagged(integrity_score)
    passed = is_assessment_passed(assessment_score, integrity_score)

    supabase.table("demo_assessment_attempts").update({
        "status": "flagged" if flagged else "completed",
        "assessment_score": assessment_score,
        "integrity_score": integrity_score,
        "completed_at": _now().isoformat(),
    }).eq("id", attempt_id).execute()

    weak_topic = None
    if not passed:
        # Real weak-topic identification from the first question that didn't
        # fully pass. Unlike the real submit, nothing is written to the real
        # learning_analytics table.
        analysis = analyze_code(weak_topic_source or solutions[0], language)
        weak_topic = _identify_weak_topic({"topics": assessment["topics"]}, analysis["complexity"], analysis["anti_patterns"])

    return {
        "passed": passed,
        "flagged": flagged,
        "assessment_score": assessment_score,
        "integrity_score": integrity_score,
        "question_results": question_results,
        "credential": None,
        "earned_badge_level": badge_level_for_score(assessment_score) if passed else None,
        "weak_topic": weak_topic,
    }


# ============================================================================
# Credentials
# ============================================================================

def list_credentials(user: dict) -> list[dict]:
    """Mirrors GET /credentials/mine, reading demo_credentials only."""
    return (
        supabase.table("demo_credentials")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
        .data
    )


def issue_credential(user: dict, badge_level: str, assessment_key: str) -> dict:
    """Presenter-triggered issuing (any tier, per the agreed demo design).
    Topics come from the chosen demo assessment, and scores from the owner's
    latest finished attempt at it, when there is one. A real random
    verify_uuid is generated by the table default, but it only ever resolves
    through the demo verify notice — never the real /verify/{uuid}."""
    assessment = content.get_assessment(assessment_key)
    if assessment is None:
        raise HTTPException(status_code=404, detail="Demo assessment not found")
    finished = [a for a in _attempts(user["id"], assessment_key) if a["status"] in ("completed", "flagged")]
    latest = finished[0] if finished else None
    return (
        supabase.table("demo_credentials")
        .insert({
            "user_id": user["id"],
            "badge_level": badge_level,
            "topics_mastered": assessment["topics"],
            "assessment_score": latest["assessment_score"] if latest else None,
            "integrity_score": latest["integrity_score"] if latest else None,
        })
        .execute()
        .data[0]
    )


# ============================================================================
# My Submissions + teacher comments
# ============================================================================

def _enrich_submission(row: dict) -> dict:
    """Adds the fields the real My Submissions / timeline UIs display (topic,
    difficulty, title), looked up from the fixed content by problem_key."""
    problem = content.get_practice_problem(row["problem_key"]) or {}
    return {
        **row,
        "topic": problem.get("topic", "General"),
        "difficulty": problem.get("difficulty", ""),
        "title": problem.get("title", row["problem_key"]),
        "is_demo": True,
    }


def list_my_submissions(user: dict, limit: int = 50) -> list[dict]:
    """Mirrors GET /submissions/mine, reading demo_submissions only."""
    rows = (
        supabase.table("demo_submissions")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
        .data
    )
    return [_enrich_submission(row) for row in rows]


def _owned_submission(user_id: str, submission_id: str) -> dict:
    _require_uuid(submission_id)
    rows = supabase.table("demo_submissions").select("id").eq("id", submission_id).eq("user_id", user_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Submission not found")
    return rows[0]


def list_submission_comments(user: dict, submission_id: str) -> list[dict]:
    """Mirrors GET /submissions/{id}/comments for a demo submission."""
    _owned_submission(user["id"], submission_id)
    return (
        supabase.table("demo_submission_comments")
        .select("*")
        .eq("demo_submission_id", submission_id)
        .order("created_at")
        .execute()
        .data
    )


def add_submission_comment(user: dict, submission_id: str, comment: str) -> dict:
    """Mirrors POST /submissions/{id}/comments. Stored under the fictional
    demo educator name, never a real educator account."""
    _owned_submission(user["id"], submission_id)
    return (
        supabase.table("demo_submission_comments")
        .insert({"demo_submission_id": submission_id, "educator_name": content.DEMO_EDUCATOR_NAME, "comment": comment})
        .execute()
        .data[0]
    )


# ============================================================================
# Demo cohort (educator / admin view)
# ============================================================================

def _cohort_users() -> list[dict]:
    """The three is_demo_cohort accounts — the only query in the codebase
    that selects demo cohort rows positively."""
    return (
        supabase.table("users")
        .select("id,name,email,role,xp,level,streak,created_at,avatar_url")
        .eq("is_demo_cohort", True)
        .order("name")
        .execute()
        .data
    )


def _persona_overview_row(user: dict) -> dict:
    """The owner's own row in the demo cohort, shown under the demo persona.
    XP / level / streak are the owner's real values; topics and integrity
    flags come from the owner's demo tables."""
    user_id = user["id"]
    prefs = _preferences(user_id)
    real = repo.get_full_user_by_id(user_id) or {}
    nodes = repo.get_roadmap_for_user(user_id, table=DEMO_ROADMAP_TABLE)
    flagged_ids = [a["id"] for a in _attempts(user_id) if a["status"] == "flagged"]
    logs = (
        supabase.table("demo_proctoring_logs").select("event_type").in_("attempt_id", flagged_ids).execute().data
        if flagged_ids
        else []
    )
    return {
        "id": user_id,
        "name": _persona(prefs)["display_name"],
        "email": None,
        "role": real.get("role"),
        "xp": real.get("xp", 0),
        "level": real.get("level", 1),
        "streak": real.get("streak", 0),
        "created_at": real.get("created_at"),
        "topics_completed": sum(1 for n in nodes if n["status"] == "completed"),
        "integrity_flags": len(flagged_ids),
        "violation_types": repo._summarize_violation_types(logs),
        "is_persona": True,
    }


def get_cohort_overview(user: dict) -> list[dict]:
    """Demo Student A/B/C through the real build_cohort_overview aggregation,
    plus the owner's live demo row as a 4th row."""
    rows = repo.build_cohort_overview(_cohort_users())
    for row in rows:
        row["is_persona"] = False
    return rows + [_persona_overview_row(user)]


def get_cohort_leaderboard(user: dict) -> list[dict]:
    """Same entry shape as the real leaderboard, over the demo cohort plus
    the owner's persona row, ranked by XP."""
    persona = _persona_overview_row(user)
    entries = [
        {"id": u["id"], "name": u["name"], "avatar_url": u.get("avatar_url"), "xp": u["xp"], "level": u["level"],
         "role": u["role"], "is_persona": False}
        for u in _cohort_users()
    ]
    entries.append({
        "id": persona["id"], "name": persona["name"], "avatar_url": None, "xp": persona["xp"],
        "level": persona["level"], "role": persona["role"], "is_persona": True,
    })
    return sorted(entries, key=lambda e: e["xp"], reverse=True)


def get_cohort_student_timeline(user: dict, student_id: str) -> dict:
    """Timeline for one demo cohort row, in the same shape as the real
    GET /admin/students/{id}/timeline.

    * The owner's persona row: built from the owner's demo tables.
    * Demo Student A/B/C: the real get_student_timeline, since they are real
      rows whose progress lives in the real tables.
    * Any other id: 404. This endpoint can never be used to read a real
      student's timeline."""
    _require_uuid(student_id)
    if student_id == user["id"]:
        return _persona_timeline(user["id"])
    if student_id in {u["id"] for u in _cohort_users()}:
        return repo.get_student_timeline(student_id)
    raise HTTPException(status_code=404, detail="Student not found in the demo cohort")


def _persona_timeline(user_id: str) -> dict:
    assessment_names = {a["key"]: a["name"] for a in content.ASSESSMENTS}
    attempts = _attempts(user_id)
    attempt_ids = [a["id"] for a in attempts]
    logs_by_attempt: dict[str, list[dict]] = {}
    if attempt_ids:
        for log in supabase.table("demo_proctoring_logs").select("*").in_("attempt_id", attempt_ids).execute().data:
            logs_by_attempt.setdefault(log["attempt_id"], []).append(log)
    return {
        "roadmap": _ensure_demo_roadmap(user_id),
        "submissions": list_my_submissions({"id": user_id}, limit=20),
        "assessments": [
            {
                "id": a["id"],
                "topic_cluster": assessment_names.get(a["assessment_key"], a["assessment_key"]),
                "assessment_score": a["assessment_score"],
                "integrity_score": a["integrity_score"],
                "status": a["status"],
                "created_at": a["started_at"],
                "violation_types": repo._summarize_violation_types(logs_by_attempt.get(a["id"], [])),
            }
            for a in attempts
        ],
        "credentials": list_credentials({"id": user_id}),
    }


# ============================================================================
# Resets — nine independent scopes
# ============================================================================
# Mirrors the real admin reset architecture: each scope clears ONLY the data
# its own module owns, and returns that module to its first-activation state.
# Every scope acts on the owner's demo rows, except "cohort", which acts on
# Demo Student A/B/C through the REAL admin_service reset functions (they are
# genuine users rows). None of these can reach a real student's data.

def reset_scope(user: dict, scope: str) -> dict:
    handlers = {
        "dashboard": _reset_dashboard,
        "roadmap": _reset_roadmap,
        "practice": _reset_practice,
        "challenge": _reset_challenge,
        "interview": _reset_interview,
        "submissions": _reset_submissions,
        "assessment": _reset_assessment,
        "credentials": _reset_credentials,
        "cohort": _reset_cohort,
    }
    handler = handlers.get(scope)
    if handler is None:
        raise HTTPException(status_code=404, detail=f"Unknown reset scope. Valid scopes: {', '.join(RESET_SCOPES)}.")
    return {"scope": scope, **handler(user)}


def _reset_dashboard(user: dict) -> dict:
    """Dashboard owns XP / level. Reverses exactly the XP Demo Mode awarded
    (the demo_xp_awarded tally) from the owner's real XP and recomputes the
    level with the real level_for_xp. XP earned outside Demo Mode, and the
    real streak, are left alone."""
    user_id = user["id"]
    awarded = int(_preferences(user_id).get(PREF_XP_AWARDED) or 0)
    reversed_xp = 0
    if awarded > 0:
        current_xp = int((repo.get_full_user_by_id(user_id) or {}).get("xp") or 0)
        new_xp = max(0, current_xp - awarded)
        reversed_xp = current_xp - new_xp
        supabase.table("users").update({"xp": new_xp, "level": repo.level_for_xp(new_xp)}).eq("id", user_id).execute()
    repo.update_user_preferences(user_id, {PREF_XP_AWARDED: 0})
    return {"xp_reversed": reversed_xp}


def _reset_roadmap(user: dict) -> dict:
    """Roadmap owns demo_roadmap_progress: deleted and reseeded fresh (Arrays
    unlocked, Hash Maps back in last place) — the demo equivalent of the real
    reset_student_roadmap."""
    deleted = _delete_rows(DEMO_ROADMAP_TABLE, "user_id", user["id"])
    _ensure_demo_roadmap(user["id"])
    return {"topics_reset": deleted}


def _reset_practice(user: dict) -> dict:
    """Practice owns the peer-discussion activity on demo problems: the
    owner's own posted comments are removed, leaving each thread with its
    seeded example. (Graded submissions belong to the separate
    "submissions" scope.)"""
    return {"discussion_comments_deleted": _delete_rows("demo_discussion_comments", "user_id", user["id"])}


def _reset_challenge(user: dict) -> dict:
    """Challenge Gate owns demo_challenge_progress."""
    return {"challenge_sessions_deleted": _delete_rows("demo_challenge_progress", "user_id", user["id"])}


def _reset_interview(user: dict) -> dict:
    """Mock Interview owns demo_interview_sessions."""
    return {"interview_sessions_deleted": _delete_rows("demo_interview_sessions", "user_id", user["id"])}


def _reset_submissions(user: dict) -> dict:
    """My Submissions owns demo_submissions (its teacher comments cascade
    with them). The example submission and comment are then reseeded."""
    deleted = _delete_rows("demo_submissions", "user_id", user["id"])
    _seed_example_submission(user["id"])
    return {"submissions_deleted": deleted}


def _reset_assessment(user: dict) -> dict:
    """Assessment owns demo_assessment_attempts (proctoring logs cascade)."""
    return {"assessment_attempts_deleted": _delete_rows("demo_assessment_attempts", "user_id", user["id"])}


def _reset_credentials(user: dict) -> dict:
    """Credentials owns demo_credentials."""
    return {"credentials_deleted": _delete_rows("demo_credentials", "user_id", user["id"])}


def _reset_cohort(user: dict) -> dict:
    """Runs the REAL admin_service.reset_full_student on each of Demo Student
    A/B/C (real rows, real audit-log entries), then restores their starting
    progress through the real complete_roadmap_node."""
    reset = []
    for member, row, _ in _ensure_cohort_users():
        admin_service.reset_full_student(user, row["id"], reason="Demo Mode cohort reset")
        _seed_cohort_progress(row["id"], member["seed_completed_topics"])
        reset.append(row["name"])
    return {"students_reset": reset}
