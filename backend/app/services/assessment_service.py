"""Cluster-based proctored assessment generation and grading.

Reuses Phase 7's JSON-parsing/validation helpers (same schema, same
canonical-solution-must-pass-its-own-tests guarantee) and Phase 8's
execution grading, scoped to a topic cluster instead of a single topic,
and Phase 9's static analysis to identify a specific weak concept on
failure.

"Passed" is deliberately NOT a stored status value — it's computed at
query time from status='completed' AND assessment_score >= threshold,
using only the status values already permitted by the Phase 4 schema.
"""

import datetime
import json
import logging

from app.config.settings import settings
from app.constants import TOPIC_FIX_MAP
from app.ai.provider_factory import get_ai_provider
from app.ai.code_analysis import analyze_code
from app.services.problem_service import _extract_json, _validate_canonical_solution
from app.services.execution_service import run_submission
from app.services.piston_service import ensure_runtime_available, PistonExecutionError, PistonRuntimeUnavailableError

logger = logging.getLogger(__name__)
from app.database.repositories import (
    get_roadmap_for_user,
    create_assessment,
    complete_assessment,
    create_credential,
    upsert_learning_analytics,
    supabase,
    _parse_timestamp,
)

CLUSTERS = [
    {"name": "Fundamentals", "topics": ["Arrays", "Strings"]},
    {"name": "Lookups & Efficiency", "topics": ["Hash Maps", "Two Pointers"]},
    {"name": "Windows & Structures", "topics": ["Sliding Window", "Stacks & Queues"]},
    {"name": "Recursive Thinking", "topics": ["Recursion & Backtracking", "Trees"]},
    {"name": "Advanced Structures", "topics": ["Graphs", "Dynamic Programming"]},
]

GRACE_PERIOD_SECONDS = 60  # tolerate minor client/server clock drift

PASS_ASSESSMENT_SCORE = 70

# Fixed, known-correct question used only when settings.TEST_MODE is true.
# Manually verified — canonical solution is trivially correct, so it is
# NOT re-validated through Piston on every use (that would just burn
# Piston round trips checking something already known to be right).
TEST_MODE_QUESTION = {
    "title": "Sum of Two Numbers",
    "description": (
        "Given two integers a and b, return their sum. This is a fixed, deterministic "
        "question used only in TEST_MODE for development testing of the assessment pipeline."
    ),
    "examples": [
        {"input": "2, 3", "output": "5", "explanation": "2 + 3 = 5"},
        {"input": "-1, 1", "output": "0"},
        {"input": "10, 15", "output": "25"},
    ],
    "constraints": ["-1000 <= a, b <= 1000"],
    "expected_complexity": "O(1)",
    "canonical_solution": "def solve(a, b):\n    return a + b\n",
    "test_cases": [
        {"input": [2, 3], "expected_output": 5},
        {"input": [-1, 1], "expected_output": 0},
        {"input": [10, 15], "expected_output": 25},
        {"input": [0, 0], "expected_output": 0},
        {"input": [100, -50], "expected_output": 50},
    ],
}

ASSESSMENT_SYSTEM_PROMPT = """You are NeuroCode's assessment question generator. You create a single, \
original, comprehensive coding problem that requires combining concepts from MULTIPLE topics together \
— not a simple single-concept exercise.

Rules:
- Never reuse a well-known LeetCode, HackerRank, or Codeforces problem verbatim.
- The problem must genuinely require applying ALL of the given topics together to solve efficiently, \
not just one of them.
- The problem must be solvable in Python.
- Respond with ONLY a single valid JSON object. No markdown fences, no commentary before or after.
- The JSON object must have exactly these keys:
  "title" (string), "description" (string, 3-5 sentences), "examples" (array of exactly 3 objects each \
with "input", "output", and optional "explanation" string fields), "constraints" (array of 3-5 short \
strings), "expected_complexity" (string, e.g. "O(n)"), "canonical_solution" (string, a complete Python \
function named solve(*args) that solves the problem), "test_cases" (array of 4-6 objects each with \
"input" (a JSON array of arguments to pass to solve) and "expected_output")."""


def _get_cluster(cluster_name: str) -> dict | None:
    return next((c for c in CLUSTERS if c["name"] == cluster_name), None)


def get_available_clusters(user_id: str) -> list[dict]:
    """Returns every cluster with whether its topics are all completed
    (unlocked) and whether the student has already passed it."""
    nodes = get_roadmap_for_user(user_id)
    completed_topics = {n["topic"] for n in nodes if n["status"] == "completed"}

    passed_result = (
        supabase.table("assessments")
        .select("topic_cluster, assessment_score")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .gte("assessment_score", PASS_ASSESSMENT_SCORE)
        .execute()
    )
    passed_clusters = {row["topic_cluster"] for row in passed_result.data}

    return [
        {
            "name": cluster["name"],
            "topics": cluster["topics"],
            "unlocked": all(t in completed_topics for t in cluster["topics"]),
            "passed": cluster["name"] in passed_clusters,
        }
        for cluster in CLUSTERS
    ]


def start_assessment(user_id: str, cluster_name: str, provider_override: str | None = None) -> dict:
    cluster = _get_cluster(cluster_name)
    if not cluster:
        raise ValueError("Unknown cluster")

    nodes = get_roadmap_for_user(user_id)
    completed_topics = {n["topic"] for n in nodes if n["status"] == "completed"}
    if not all(topic in completed_topics for topic in cluster["topics"]):
        raise PermissionError("Cluster is not fully completed yet")

    duration = settings.ASSESSMENT_DURATION_SECONDS

    # TEST_MODE skips the AI generation call, but grading (submit_assessment)
    # still calls Piston to run the submitted solution — so Piston health is
    # checked either way. Failing here also means a broken Piston is caught
    # immediately, before the student even starts, rather than at submit time.
    ensure_runtime_available("python")

    if settings.TEST_MODE:
        logger.warning(
            "TEST_MODE active — using fixed deterministic question (user=%s, cluster=%s)", user_id, cluster_name
        )
        saved = create_assessment(user_id, cluster_name, TEST_MODE_QUESTION)
        return {
            "id": saved["id"],
            "cluster": cluster_name,
            "title": TEST_MODE_QUESTION["title"],
            "description": TEST_MODE_QUESTION["description"],
            "examples": TEST_MODE_QUESTION["examples"],
            "constraints": TEST_MODE_QUESTION["constraints"],
            "expected_complexity": TEST_MODE_QUESTION["expected_complexity"],
            "duration_seconds": duration,
            "test_mode": True,
            "provider_used": provider_override or settings.AI_PROVIDER,
        }

    provider = get_ai_provider(provider_override)
    topics_text = " and ".join(cluster["topics"])
    user_prompt = f"Generate one comprehensive assessment problem combining: {topics_text}."

    attempt_summaries: list[str] = []

    for attempt in range(1, 4):
        raw = None
        try:
            raw = provider.generate(ASSESSMENT_SYSTEM_PROMPT, user_prompt, max_tokens=1800)
            question = _extract_json(raw)

            required_keys = {
                "title", "description", "examples", "constraints",
                "expected_complexity", "canonical_solution", "test_cases",
            }
            if not required_keys.issubset(question.keys()):
                logger.warning(
                    "[attempt %d/3] AI response missing required fields | cluster=%s\nraw:\n%s",
                    attempt, cluster_name, raw,
                )
                attempt_summaries.append(f"attempt {attempt}: malformed response (missing fields)")
                continue

            validation = _validate_canonical_solution(question)
            if not validation["valid"]:
                logger.warning(
                    "[attempt %d/3] validation failed | cluster=%s title=%r reason=%s failing_case=%s "
                    "expected=%r actual=%r\ncanonical_solution:\n%s\ntest_cases:\n%s",
                    attempt, cluster_name, question.get("title"), validation["reason"],
                    validation["failing_case_index"], validation["expected"], validation["actual"],
                    question.get("canonical_solution"), question.get("test_cases"),
                )
                attempt_summaries.append(
                    f"attempt {attempt}: validation failed on test case {validation['failing_case_index']} "
                    f"({validation['reason']})"
                )
                continue

            saved = create_assessment(user_id, cluster_name, question)
            logger.info("[attempt %d/3] assessment question generated and validated | title=%r", attempt, question["title"])
            return {
                "id": saved["id"],
                "cluster": cluster_name,
                "title": question["title"],
                "description": question["description"],
                "examples": question["examples"],
                "constraints": question["constraints"],
                "expected_complexity": question["expected_complexity"],
                "duration_seconds": duration,
                "test_mode": False,
                "provider_used": provider_override or settings.AI_PROVIDER,
            }

        except PistonExecutionError as exc:
            logger.warning("[attempt %d/3] infrastructure error (Piston unreachable): %s", attempt, exc)
            attempt_summaries.append(f"attempt {attempt}: infrastructure error — {exc}")
            continue
        except json.JSONDecodeError as exc:
            logger.warning("[attempt %d/3] invalid JSON from AI provider: %s\nraw:\n%s", attempt, exc, raw)
            attempt_summaries.append(f"attempt {attempt}: malformed JSON response")
            continue
        except Exception as exc:  # noqa: BLE001 - final safety net, still logged with full context
            logger.exception("[attempt %d/3] unexpected error during assessment generation", attempt)
            attempt_summaries.append(f"attempt {attempt}: unexpected error — {exc}")
            continue

    raise RuntimeError("Assessment generation failed after 3 attempts. " + "; ".join(attempt_summaries))


def _identify_weak_topic(cluster: dict, complexity: str, anti_patterns: list[dict]) -> str:
    """Best-effort: if a known anti-pattern maps to a topic in this
    cluster, that's the weak concept. Otherwise falls back to a
    complexity-based guess rather than leaving the student with no
    guidance at all."""
    for pattern in anti_patterns:
        fix_topic = TOPIC_FIX_MAP.get(pattern["key"])
        if fix_topic and fix_topic in cluster["topics"]:
            return fix_topic

    if any(marker in complexity for marker in ("^2", "^3", "2^n")):
        return cluster["topics"][-1]

    return cluster["topics"][0]


# Server-authoritative integrity scoring. THIS dict is the single source
# of truth for the per-event penalty weights (tab_switch -5, paste -8,
# camera_alert -10, keystroke_alert -6; score starts at 100, floored at 0).
# The frontend keeps its own hardcoded copy of these same values in
# frontend/src/hooks/useProctoringSocket.js purely for live client-side
# UX feedback during the session — there is no shared or imported constant
# between the two, so if these weights ever change here, that frontend
# copy must be updated by hand to match.
INTEGRITY_EVENT_PENALTIES = {
    "tab_switch": 5,
    "paste": 8,
    "camera_alert": 10,
    "keystroke_alert": 6,
}


def get_owned_assessment(user_id: str, assessment_id: str) -> dict | None:
    """Returns the assessment row only if it belongs to `user_id`, else None.
    Used to authorize per-assessment sub-actions (e.g. proctoring logs)."""
    result = (
        supabase.table("assessments")
        .select("id,status")
        .eq("id", assessment_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else None


def compute_integrity_score(assessment_id: str) -> float:
    """Recomputes the integrity score from the persisted proctoring_logs
    rows for an assessment. This is the ONLY value trusted for pass/fail
    and credential issuance — the client-supplied integrity_score is
    ignored (kept on the request schema only for payload compatibility)."""
    logs = (
        supabase.table("proctoring_logs")
        .select("event_type")
        .eq("assessment_id", assessment_id)
        .execute()
        .data
    )
    penalty = sum(INTEGRITY_EVENT_PENALTIES.get(row["event_type"], 0) for row in logs)
    return float(max(0, 100 - penalty))


def submit_assessment(
    user_id: str, assessment_id: str, language: str, source_code: str, client_integrity_score: float = 100
) -> dict:
    assessment_result = (
        supabase.table("assessments").select("*").eq("id", assessment_id).eq("user_id", user_id).execute()
    )
    if not assessment_result.data:
        raise ValueError("Assessment not found")
    assessment = assessment_result.data[0]

    if assessment["status"] != "in_progress":
        raise PermissionError("Assessment already completed")

    created_at = _parse_timestamp(assessment["created_at"])
    elapsed = (datetime.datetime.now(datetime.timezone.utc) - created_at).total_seconds()
    if elapsed > settings.ASSESSMENT_DURATION_SECONDS + GRACE_PERIOD_SECONDS:
        raise TimeoutError("Assessment time limit exceeded")

    # The client value (client_integrity_score) is deliberately discarded —
    # the authoritative score is recomputed from proctoring_logs here.
    integrity_score = compute_integrity_score(assessment_id)

    question = assessment["generated_question"]
    outcome = run_submission(question, language, source_code)
    if "error" in outcome:
        raise ValueError(outcome["error"])

    assessment_score = round(100 * outcome["passed_count"] / outcome["total_count"], 2)
    analysis = analyze_code(source_code, language)
    cluster = _get_cluster(assessment["topic_cluster"]) or {"topics": []}

    complete_assessment(
        assessment_id=assessment_id,
        submitted_code=source_code,
        execution_result=outcome,
        assessment_score=assessment_score,
        integrity_score=integrity_score,
        duration=int(elapsed),
    )

    if integrity_score < settings.INTEGRITY_PASS_THRESHOLD:
        supabase.table("assessments").update({"status": "flagged"}).eq("id", assessment_id).execute()

    passed = assessment_score >= PASS_ASSESSMENT_SCORE and integrity_score >= settings.INTEGRITY_PASS_THRESHOLD
    if passed:
        if assessment_score >= 90:
            badge_level = "platinum"
        elif assessment_score >= 80:
            badge_level = "gold"
        else:
            badge_level = "silver"

        credential = create_credential(
            user_id=user_id,
            assessment_id=assessment_id,
            badge_level=badge_level,
            topics_mastered=cluster["topics"],
            assessment_score=assessment_score,
            integrity_score=integrity_score,
        )
        return {
            "passed": True,
            "assessment_score": assessment_score,
            "integrity_score": integrity_score,
            "results": outcome["results"],
            "credential": credential,
            "weak_topic": None,
        }

    weak_topic = _identify_weak_topic(cluster, analysis["complexity"], analysis["anti_patterns"])
    upsert_learning_analytics(user_id, {
        "weak_topics": [weak_topic],
        "recommended_next_topic": weak_topic,
        "consistency_score": assessment_score,
    })

    return {
        "passed": False,
        "assessment_score": assessment_score,
        "integrity_score": integrity_score,
        "results": outcome["results"],
        "credential": None,
        "weak_topic": weak_topic,
    }