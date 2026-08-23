import json
import logging
import re

from app.ai.provider_factory import get_ai_provider
from app.config.settings import settings
from app.services.piston_service import execute_code, ensure_runtime_available, PistonExecutionError
from app.database.repositories import get_recent_problem_titles, save_generated_problem

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are NeuroCode's coding problem generator. You create original, high-quality \
programming practice problems for a computer science education platform.

Rules:
- Never reuse a well-known LeetCode, HackerRank, or Codeforces problem verbatim. Create an original \
scenario that tests the same underlying concept instead.
- The problem must be solvable in Python.
- Respond with ONLY a single valid JSON object. No markdown fences, no commentary before or after.
- The JSON object must have exactly these keys:
  "title" (string), "description" (string, 2-4 sentences), "examples" (array of exactly 3 objects each \
with "input", "output", and optional "explanation" string fields), "constraints" (array of 3-5 short \
strings), "expected_complexity" (string, e.g. "O(n)"), "canonical_solution" (string, a complete Python \
function named solve(*args) that solves the problem), "test_cases" (array of 3-5 objects each with \
"input" (a JSON array of arguments to pass to solve) and "expected_output")."""


def _build_user_prompt(topic: str, difficulty: str, avoid_titles: list[str]) -> str:
    avoid_clause = ""
    if avoid_titles:
        avoid_clause = (
            f"\nDo not generate a problem similar to any of these previous titles: "
            f"{', '.join(avoid_titles)}."
        )
    return (
        f"Generate one original coding problem.\n"
        f"Topic: {topic}\n"
        f"Difficulty: {difficulty}\n"
        f"The problem must require knowledge of {topic} concepts specifically and cannot be solved "
        f"efficiently while ignoring them."
        f"{avoid_clause}"
    )


def _extract_json(raw_text: str) -> dict:
    text = raw_text.strip()
    text = re.sub(r"^```(json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Defensive fallback: locate the outermost {...} span and parse
        # just that. Guards against a provider prepending or appending
        # stray narrative text around an otherwise-valid JSON object
        # (e.g. a leftover reasoning fragment), rather than failing the
        # whole attempt when the JSON itself was actually fine.
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(text[start : end + 1])


def _validate_canonical_solution(problem: dict) -> dict:
    """Runs the canonical solution against each test case's INPUT and uses
    the actual execution output as ground truth — it does NOT compare
    against the AI's self-predicted expected_output.

    Why: LLMs don't execute code when generating it — they predict what a
    solution "should" produce by reasoning about it, and this
    self-prediction is unreliable for anything beyond simple logic, even
    when the solution code itself is correct. Comparing real execution
    against a hallucinated expected value caused a high false-rejection
    rate on genuinely correct solutions (confirmed in production logs:
    multi-topic assessment problems with permutations/nested string logic
    failed validation repeatedly with plausible-but-wrong predicted
    values). Deriving expected_output from actual execution removes this
    failure class entirely — the only way to fail now is the solution
    itself crashing, or every test case degenerately producing the same
    output (a sign the solution doesn't meaningfully discriminate
    between different inputs, which usually means it's buggy in a
    different way — e.g. always returning a default/empty value).

    Mutates problem["test_cases"][i]["expected_output"] in place with the
    real computed values — callers should use `problem` after this call,
    not the original AI-authored test_cases.
    """
    solution_code = problem["canonical_solution"]
    computed_outputs = []

    for i, case in enumerate(problem["test_cases"]):
        args_repr = ", ".join(repr(a) for a in case["input"])
        harness = f"{solution_code}\n\nprint(solve({args_repr}))"
        result = execute_code("python", harness)  # may raise PistonExecutionError — let it propagate

        run_info = result.get("run", {})
        actual_output = (run_info.get("stdout") or "").strip()
        stderr = (run_info.get("stderr") or "").strip()

        if stderr:
            return {
                "valid": False, "failing_case_index": i,
                "expected": None, "actual": stderr, "reason": "runtime_error",
            }

        case["expected_output"] = actual_output
        computed_outputs.append(actual_output)

    if len(computed_outputs) > 1 and len(set(computed_outputs)) == 1:
        return {
            "valid": False, "failing_case_index": None,
            "expected": None, "actual": computed_outputs[0], "reason": "degenerate_outputs",
        }

    return {"valid": True, "failing_case_index": None, "expected": None, "actual": None, "reason": None}


def generate_problem(user_id: str, topic: str, difficulty: str, provider_override: str | None = None) -> dict:
    # Fail fast, before spending an AI call, if Piston can't validate
    # anything right now — this is the check that would have immediately
    # surfaced "no runtimes loaded" instead of 3 wasted AI generations.
    ensure_runtime_available("python")

    provider = get_ai_provider(provider_override)
    avoid_titles = get_recent_problem_titles(user_id, topic, limit=5)

    attempt_summaries: list[str] = []

    for attempt in range(1, 4):
        raw = None
        try:
            raw = provider.generate(SYSTEM_PROMPT, _build_user_prompt(topic, difficulty, avoid_titles))
            problem = _extract_json(raw)

            required_keys = {
                "title", "description", "examples", "constraints",
                "expected_complexity", "canonical_solution", "test_cases",
            }
            if not required_keys.issubset(problem.keys()):
                logger.warning(
                    "[attempt %d/3] AI response missing required fields | topic=%s difficulty=%s\nraw:\n%s",
                    attempt, topic, difficulty, raw,
                )
                attempt_summaries.append(f"attempt {attempt}: malformed response (missing fields)")
                continue

            validation = _validate_canonical_solution(problem)
            if not validation["valid"]:
                logger.warning(
                    "[attempt %d/3] validation failed | topic=%s difficulty=%s title=%r reason=%s "
                    "failing_case=%s expected=%r actual=%r\ncanonical_solution:\n%s\ntest_cases:\n%s",
                    attempt, topic, difficulty, problem.get("title"), validation["reason"],
                    validation["failing_case_index"], validation["expected"], validation["actual"],
                    problem.get("canonical_solution"), problem.get("test_cases"),
                )
                attempt_summaries.append(
                    f"attempt {attempt}: validation failed on test case {validation['failing_case_index']} "
                    f"({validation['reason']})"
                )
                continue

            saved = save_generated_problem(user_id, topic, difficulty, problem)
            logger.info("[attempt %d/3] problem generated and validated successfully | title=%r", attempt, problem["title"])
            return {
                "id": saved["id"],
                "topic": topic,
                "difficulty": difficulty,
                "title": problem["title"],
                "description": problem["description"],
                "examples": problem["examples"],
                "constraints": problem["constraints"],
                "expected_complexity": problem["expected_complexity"],
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
            logger.exception("[attempt %d/3] unexpected error during problem generation", attempt)
            attempt_summaries.append(f"attempt {attempt}: unexpected error — {exc}")
            continue

    raise RuntimeError("Problem generation failed after 3 attempts. " + "; ".join(attempt_summaries))