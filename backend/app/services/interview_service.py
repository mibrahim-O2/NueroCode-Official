"""Mock Interview Mode: a timed, unassisted problem-solving session,
architecturally separate from both Practice (assisted, roadmap-linked)
and Assessment (credential-bearing, proctored). Reuses the existing
generation-validation loop's SHAPE (mirrors assessment_service.py) and
the existing grading pipeline (execution_service.run_submission)
directly — no new execution or grading logic.
"""

import logging

from app.ai.provider_factory import get_ai_provider
from app.ai.gemini_provider import GeminiQuotaExceededError
from app.config.settings import settings
from app.services.problem_service import _extract_json, _validate_canonical_solution
from app.services.execution_service import run_submission
from app.ai.code_analysis import analyze_code
from app.services.piston_service import ensure_runtime_available, PistonExecutionError
from app.database.repositories import (
    create_interview_session,
    get_interview_session,
    update_interview_session,
)

logger = logging.getLogger(__name__)

INTERVIEW_SYSTEM_PROMPT = """You are generating a realistic technical coding interview question.
Respond with ONLY a JSON object: title, description, examples (list of {input, output, explanation}),
constraints (list of strings), expected_complexity, canonical_solution (a working Python function
named `solve`), test_cases (list of {input: [...], expected_output: ...}).
The question should feel like something asked in a real software engineering interview — clear,
solvable in 20-30 minutes, with a well-defined single correct approach."""


def start_interview(user_id: str, topic: str, difficulty: str) -> dict:
    ensure_runtime_available("python")
    provider = get_ai_provider()

    for attempt in range(1, 4):
        try:
            raw = provider.generate(
                INTERVIEW_SYSTEM_PROMPT,
                f"Generate a {difficulty} interview question about {topic}.",
            )
            question = _extract_json(raw)
            # Deliberately NOT reassigning the return value here — this
            # function's job is to run the canonical solution through
            # Piston and correct each test case's expected_output; the
            # earlier version reassigned its return value onto `question`
            # and that silently dropped fields like 'title', causing a
            # KeyError further down. Calling it for its side effect only
            # and keeping the original, fully-formed `question` dict.
            _validate_canonical_solution(question)

            session = create_interview_session(
                user_id=user_id,
                topic=topic,
                difficulty=difficulty,
                question={k: v for k, v in question.items() if k not in ("canonical_solution",)},
                time_limit_seconds=settings.INTERVIEW_DURATION_SECONDS,
            )
            logger.info("[interview attempt %d/3] question generated successfully", attempt)
            return {
                "id": session["id"],
                "topic": topic,
                "difficulty": difficulty,
                "title": question["title"],
                "description": question["description"],
                "examples": question["examples"],
                "constraints": question["constraints"],
                "expected_complexity": question["expected_complexity"],
                "time_limit_seconds": session["time_limit_seconds"],
                "started_at": session["started_at"],
            }
        except GeminiQuotaExceededError:
            raise
        except PistonExecutionError as exc:
            logger.warning("[interview attempt %d/3] infrastructure error: %s", attempt, exc)
            continue
        except Exception:  # noqa: BLE001
            logger.exception("[interview attempt %d/3] generation failed", attempt)
            continue

    raise RuntimeError("Interview question generation failed after 3 attempts.")


def submit_interview(user_id: str, session_id: str, language: str, source_code: str) -> dict:
    session = get_interview_session(session_id)
    if not session or session["user_id"] != user_id:
        raise ValueError("Interview session not found.")
    if session["status"] != "in_progress":
        raise ValueError("This interview session has already been completed.")

    # test_cases were stripped from the client-visible question but are
    # still needed here for grading — stored in the full session row.
    full_question = session["question"]
    problem_for_grading = {"test_cases": full_question.get("_test_cases", [])}

    execution_result = run_submission(problem_for_grading, language, source_code)
    analysis = analyze_code(source_code, language) if language == "python" else None

    updated = update_interview_session(
        session_id,
        {
            "language": language,
            "source_code": source_code,
            "execution_result": execution_result,
            "complexity": analysis["complexity"] if analysis else None,
            "status": "completed",
            "submitted_at": "now()",
        },
    )

    return {
        "results": execution_result,
        "complexity": analysis["complexity"] if analysis else None,
        "anti_patterns": analysis["detected_patterns"] if analysis else [],
        "time_taken_seconds": updated["time_taken_seconds"],
        "all_passed": execution_result.get("all_passed", False),
    }
