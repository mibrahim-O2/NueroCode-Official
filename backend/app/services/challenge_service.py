"""Topic Mastery Gate ("challenge") — a 10-problem, no-AI-assist pool a
student must fully clear to complete a roadmap node.

Everything here is built on the contracts already used elsewhere in this
codebase rather than bespoke APIs:

* Problem generation mirrors app/services/problem_service.py exactly —
  SYSTEM_PROMPT + _build_user_prompt + provider.generate() + _extract_json
  + _validate_canonical_solution (which runs the canonical solution
  through Piston and rewrites each test case's expected_output from the
  real execution output). The 10 problems are generated as 10 separate
  validated calls, one per problem, never a single "generate a pool"
  call.
* Grading reuses app/services/execution_service.run_submission — the same
  function Practice and Assessment use. Piston is never called directly
  from here.
* Node completion delegates to
  app/database/repositories.complete_roadmap_node, so a challenge-gate
  completion produces byte-for-byte identical XP / level / streak /
  next-node-unlock results to completing a node any other way. No XP or
  leveling formula is reimplemented here.
"""

import logging
from datetime import datetime, timezone

from app.ai.gemini_provider import GeminiQuotaExceededError
from app.ai.provider_factory import get_ai_provider
from app.services import problem_service
from app.services.execution_service import run_submission
from app.services.piston_service import ensure_runtime_available, PistonExecutionError
from app.database.repositories import (
    supabase,
    get_roadmap_for_user,
    complete_roadmap_node,
    count_passing_submissions,
)

logger = logging.getLogger(__name__)

# 10-problem pool: 4 Easy, 4 Medium, 2 Hard.
CHALLENGE_TIER_DISTRIBUTION = (("easy", 4), ("medium", 4), ("hard", 2))
TOTAL_CHALLENGE_QUESTIONS = sum(count for _, count in CHALLENGE_TIER_DISTRIBUTION)  # 10

# Informational only — surfaced to the client, never blocks a challenge.
PRACTICE_READINESS_THRESHOLD = 50

_STARTER_CODE = "def solve(*args):\n    # Write your solution here\n    pass\n"

_REQUIRED_PROBLEM_KEYS = {
    "title", "description", "examples", "constraints",
    "expected_complexity", "canonical_solution", "test_cases",
}


# --- Generation ----------------------------------------------------------

def _generate_one_problem(provider, topic: str, difficulty: str, avoid_titles: list[str]) -> dict:
    """Generates ONE fully execution-validated problem, mirroring the
    per-attempt loop in problem_service.generate_problem (same
    SYSTEM_PROMPT, _build_user_prompt, _extract_json and
    _validate_canonical_solution). Returns the validated problem dict —
    its test_cases already carry real expected_output values written by
    _validate_canonical_solution."""
    for attempt in range(1, 4):
        try:
            raw = provider.generate(
                problem_service.SYSTEM_PROMPT,
                problem_service._build_user_prompt(topic, difficulty, avoid_titles),
            )
            problem = problem_service._extract_json(raw)

            if not _REQUIRED_PROBLEM_KEYS.issubset(problem.keys()):
                logger.warning(
                    "challenge gen [%s/%s] attempt %d: response missing required keys",
                    topic, difficulty, attempt,
                )
                continue

            validation = problem_service._validate_canonical_solution(problem)
            if not validation["valid"]:
                logger.warning(
                    "challenge gen [%s/%s] attempt %d: canonical solution failed validation (%s)",
                    topic, difficulty, attempt, validation["reason"],
                )
                continue

            return problem

        except GeminiQuotaExceededError:
            raise  # quota exhausted — retrying is pointless
        except PistonExecutionError:
            raise  # cannot validate without Piston — abort the whole pool
        except Exception:
            logger.exception(
                "challenge gen [%s/%s] attempt %d: unexpected error", topic, difficulty, attempt
            )
            continue

    raise RuntimeError(
        f"Could not generate a valid {difficulty} problem for '{topic}' after 3 attempts"
    )


def _generate_challenge_pool(topic: str, provider_override: str | None) -> list[dict]:
    """Builds the full 10-problem pool via 10 independent validated
    generations (4 easy, 4 medium, 2 hard)."""
    ensure_runtime_available("python")  # fail fast, same as problem_service
    provider = get_ai_provider(provider_override)

    questions: list[dict] = []
    seen_titles: list[str] = []

    for tier, count in CHALLENGE_TIER_DISTRIBUTION:
        for _ in range(count):
            problem = _generate_one_problem(provider, topic, tier, seen_titles)
            seen_titles.append(problem["title"])
            index = len(questions)
            questions.append({
                "index": index,
                "difficulty": tier,
                "title": problem["title"],
                "description": problem["description"],
                "examples": problem["examples"],
                "constraints": problem["constraints"],
                "expected_complexity": problem["expected_complexity"],
                "starter_code": _STARTER_CODE,
                # Kept server-side for grading; stripped from every
                # client-facing response by _public_question().
                "test_cases": problem["test_cases"],
            })
            logger.info(
                "challenge pool for %r: generated %d/%d (%s)",
                topic, index + 1, TOTAL_CHALLENGE_QUESTIONS, tier,
            )

    return questions


# --- Client-safe serialization ----------------------------------------

def _public_question(question: dict) -> dict:
    """Question view returned to the client — never exposes test cases."""
    return {k: v for k, v in question.items() if k != "test_cases"}


def _public_challenge(row: dict) -> dict:
    row = dict(row)
    row["questions"] = [_public_question(q) for q in (row.get("questions") or [])]
    return row


def _readiness(user_id: str) -> dict:
    solved = count_passing_submissions(user_id)
    return {
        "practice_count": solved,
        "practice_threshold": PRACTICE_READINESS_THRESHOLD,
        "is_capable": solved >= PRACTICE_READINESS_THRESHOLD,
    }


# --- Persistence helpers ----------------------------------------------

def _get_challenge_row(user_id: str, node_id: str) -> dict | None:
    result = (
        supabase.table("roadmap_challenges")
        .select("*")
        .eq("user_id", user_id)
        .eq("node_id", node_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def _resolve_node(user_id: str, node_id: str) -> dict:
    node = next((n for n in get_roadmap_for_user(user_id) if n["id"] == node_id), None)
    if node is None:
        raise LookupError("That roadmap node was not found for your account.")
    if node["status"] == "locked":
        raise PermissionError("Complete the earlier topics before attempting this challenge gate.")
    return node


# --- Public service API ----------------------------------------------

def get_or_generate_challenge(user_id: str, node_id: str, provider_override: str | None = None) -> dict:
    """Returns the student's existing challenge session for this node, or
    generates a fresh 10-problem pool if none exists yet."""
    existing = _get_challenge_row(user_id, node_id)
    if existing:
        return {"challenge": _public_challenge(existing), **_readiness(user_id)}

    node = _resolve_node(user_id, node_id)
    topic = node.get("topic") or "Data Structures & Algorithms"

    questions = _generate_challenge_pool(topic, provider_override)

    now_iso = datetime.now(timezone.utc).isoformat()
    row = {
        "user_id": user_id,
        "node_id": node_id,
        "questions": questions,
        "current_index": 0,
        "solved_indices": [],
        "status": "in_progress",
        "score": 0,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    inserted = (
        supabase.table("roadmap_challenges")
        .upsert(row, on_conflict="user_id,node_id")
        .execute()
    )
    if not inserted.data:
        raise RuntimeError("Failed to persist the generated challenge session")

    return {"challenge": _public_challenge(inserted.data[0]), **_readiness(user_id)}


def submit_challenge_question(
    user_id: str, node_id: str, question_index: int, code: str, language: str = "python"
) -> dict:
    """Grades one submitted question through execution_service.run_submission.
    When all 10 are solved, marks the session passed and completes the
    roadmap node via repositories.complete_roadmap_node."""
    row = _get_challenge_row(user_id, node_id)
    if row is None:
        raise LookupError("No active challenge session was found for this node.")

    questions = row.get("questions") or []
    if not isinstance(question_index, int) or not (0 <= question_index < len(questions)):
        raise ValueError("That question does not exist in this challenge.")

    target = questions[question_index]
    outcome = run_submission({"test_cases": target.get("test_cases", [])}, language, code)
    if "error" in outcome:
        if outcome.get("error_type") == "infrastructure":
            # Surfaced to the route as a 503 with a generic message.
            raise PistonExecutionError(outcome["error"])
        raise ValueError("Your submission could not be run. Check your code and try again.")

    passed = bool(outcome.get("all_passed"))
    status = row.get("status", "in_progress")
    solved = sorted(set(row.get("solved_indices") or []))
    node_completion = None

    if passed and status == "in_progress":
        solved = sorted(set(solved) | {question_index})

    all_completed = len(solved) >= TOTAL_CHALLENGE_QUESTIONS
    score = round(len(solved) / TOTAL_CHALLENGE_QUESTIONS * 100, 2)
    now_iso = datetime.now(timezone.utc).isoformat()

    update = {
        "solved_indices": solved,
        "current_index": question_index,
        "score": score,
        "updated_at": now_iso,
    }

    if all_completed and status == "in_progress":
        update["status"] = "passed"
        update["completed_at"] = now_iso
        status = "passed"
        try:
            # Identical XP / level / streak / next-node-unlock path as the
            # normal roadmap completion flow — nothing recomputed here.
            node_completion = complete_roadmap_node(node_id, user_id)
        except Exception:
            logger.exception(
                "challenge: complete_roadmap_node failed (node=%s user=%s)", node_id, user_id
            )
            node_completion = None

    supabase.table("roadmap_challenges").update(update).eq("id", row["id"]).execute()

    return {
        "passed": passed,
        "passed_count": outcome.get("passed_count", 0),
        "total_count": outcome.get("total_count", 0),
        "results": outcome.get("results", []),
        "question_index": question_index,
        "solved_count": len(solved),
        "total_questions": TOTAL_CHALLENGE_QUESTIONS,
        "all_completed": all_completed,
        "score": score,
        "status": status,
        "node_completion": node_completion,
    }


def get_challenge_history(user_id: str, node_id: str) -> dict:
    """The single challenge session for this node (unique per user+node),
    wrapped in a list for a stable response shape."""
    row = _get_challenge_row(user_id, node_id)
    return {"challenges": [_public_challenge(row)] if row else []}
