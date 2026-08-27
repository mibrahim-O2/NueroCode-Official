"""Reveals a problem's already-generated, already-validated canonical
solution — no new solution is generated here. Reuses the exact
canonical_solution stored during problem_service.generate_problem()
(Phase 7), gated on the student having a genuine passing submission for
THIS specific problem."""

from app.ai.provider_factory import get_ai_provider
from app.database.repositories import get_problem_by_id, has_passing_submission

EXPLANATION_SYSTEM_PROMPT = """You are explaining a coding solution to a student who just solved this
problem themselves. Given the problem and its official solution, write a short (4-6 sentence),
step-by-step explanation of WHY this approach works and why it's efficient. Do not just restate the
code — explain the reasoning."""


def get_official_solution(user_id: str, problem_id: str) -> dict:
    problem = get_problem_by_id(problem_id)
    if not problem:
        raise LookupError("Problem not found")
    if not has_passing_submission(user_id, problem_id):
        raise PermissionError("Solve this problem successfully before viewing the official solution.")

    provider = get_ai_provider()
    explanation = provider.generate(
        EXPLANATION_SYSTEM_PROMPT,
        f"Problem: {problem['title']}\n{problem['description']}\n\nSolution:\n{problem['canonical_solution']}",
        max_tokens=500,
    )

    return {
        "solution_code": problem["canonical_solution"],
        "explanation": explanation,
        "expected_complexity": problem["expected_complexity"],
    }