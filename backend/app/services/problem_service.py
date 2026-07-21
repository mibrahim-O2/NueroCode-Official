import json
import re

from app.ai.provider_factory import get_ai_provider
from app.services.piston_service import execute_code
from app.database.repositories import get_recent_problem_titles, save_generated_problem

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
    return json.loads(text)


def _validate_canonical_solution(problem: dict) -> bool:
    solution_code = problem["canonical_solution"]
    for case in problem["test_cases"]:
        args_repr = ", ".join(repr(arg) for arg in case["input"])
        harness = f"{solution_code}\n\nprint(solve({args_repr}))"
        result = execute_code("python", harness)
        actual_output = (result.get("run", {}).get("stdout") or "").strip()
        expected_output = str(case["expected_output"]).strip()
        if actual_output != expected_output:
            return False
    return True


def generate_problem(user_id: str, topic: str, difficulty: str) -> dict:
    provider = get_ai_provider()
    avoid_titles = get_recent_problem_titles(user_id, topic, limit=5)

    last_error = None
    for _ in range(3):
        try:
            raw = provider.generate(SYSTEM_PROMPT, _build_user_prompt(topic, difficulty, avoid_titles))
            problem = _extract_json(raw)

            required_keys = {
                "title", "description", "examples", "constraints",
                "expected_complexity", "canonical_solution", "test_cases",
            }
            if not required_keys.issubset(problem.keys()):
                raise ValueError("AI response missing required fields")

            if not _validate_canonical_solution(problem):
                raise ValueError("Canonical solution failed its own test cases")

            saved = save_generated_problem(user_id, topic, difficulty, problem)
            return {
                "id": saved["id"],
                "topic": topic,
                "difficulty": difficulty,
                "title": problem["title"],
                "description": problem["description"],
                "examples": problem["examples"],
                "constraints": problem["constraints"],
                "expected_complexity": problem["expected_complexity"],
            }
        except Exception as exc:  # noqa: BLE001 - intentional broad catch for retry loop
            last_error = exc
            continue

    raise RuntimeError(f"Problem generation failed after 3 attempts: {last_error}")