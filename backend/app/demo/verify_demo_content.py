"""Proves Demo Mode's fixed content through the REAL grading pipeline.

    cd backend && python -m app.demo.verify_demo_content

For every solution in demo_content.py this:
  1. Grades the CORRECT solution with execution_service.run_submission (the
     same function real Practice/Challenge/Assessment/Interview grading uses)
     and requires every test case to pass.
  2. Grades the WRONG solution the same way and requires at least one test
     case to fail. A wrong solution that crashes or fails to compile also
     counts as failing, but is reported separately, since the goal is a
     near-miss.
  3. For Python, runs the canonical solution through
     problem_service._validate_canonical_solution — the exact check real
     AI-generated problems must pass — and confirms the outputs it derives
     from real execution match the hand-authored expected outputs.
  4. Runs the real Tree-sitter analyzer over every Python solution and
     confirms that ONLY the designated anti-pattern trigger (a WRONG solution)
     reports an anti-pattern.

Prints a checklist and exits non-zero if anything fails, so it can gate a
change to demo_content.py. Needs a running Piston instance (PISTON_API).
"""

import copy
import sys
from concurrent.futures import ThreadPoolExecutor

from app.ai.code_analysis import analyze_code
from app.demo import demo_content
from app.services.execution_service import run_submission
from app.services.problem_service import _validate_canonical_solution


def _collect_items() -> list[dict]:
    """Flattens every solution in demo_content into one checklist row each."""
    items = []

    def add(section, label, problem, trigger_key=None):
        for language, pair in problem["solutions"].items():
            for kind in ("correct", "wrong"):
                items.append({
                    "section": section,
                    "label": label,
                    "language": language,
                    "kind": kind,
                    "code": pair[kind],
                    "test_cases": problem["test_cases"],
                    "is_trigger": bool(trigger_key) and language == "python" and kind == "wrong",
                })

    for p in demo_content.PRACTICE_PROBLEMS:
        add("Practice", f"{p['difficulty']} · {p['title']}", p, trigger_key=p.get("anti_pattern_trigger"))
    for i, p in enumerate(demo_content.CHALLENGE_PROBLEMS, start=1):
        add("Challenge Gate", f"Q{i} {p['difficulty']} · {p['title']}", p)
    for a in demo_content.ASSESSMENTS:
        for i, q in enumerate(a["questions"], start=1):
            add(f"Assessment ({a['key']})", f"Q{i} · {q['title']}", q)
    for t in demo_content.MOCK_INTERVIEW_TOPICS:
        add("Mock Interview", f"{t['topic']} · {t['title']}", t)
    return items


def _grade(item: dict) -> dict:
    outcome = run_submission({"test_cases": item["test_cases"]}, item["language"], item["code"])
    result = dict(item)
    if "error" in outcome:
        result.update(passed=0, total=len(item["test_cases"]), all_passed=False, error=outcome["error"])
        return result

    crashed = any(
        r.get("compile_failed") or (not r["passed"] and r["actual"] and "Error" in r["actual"])
        for r in outcome["results"]
    )
    result.update(
        passed=outcome["passed_count"],
        total=outcome["total_count"],
        all_passed=outcome["all_passed"],
        error=None,
        crashed=crashed,
    )
    return result


def _validate_python_canonical(item: dict) -> str | None:
    """Mirrors how real problems are validated, then compares the
    execution-derived outputs against the hand-authored expected outputs."""
    problem = {"canonical_solution": item["code"], "test_cases": copy.deepcopy(item["test_cases"])}
    validation = _validate_canonical_solution(problem)
    if not validation["valid"]:
        return f"_validate_canonical_solution rejected it ({validation['reason']})"
    for authored, derived in zip(item["test_cases"], problem["test_cases"]):
        if str(authored["expected_output"]).strip() != derived["expected_output"]:
            return (
                f"authored expected {authored['expected_output']!r} but real execution produced "
                f"{derived['expected_output']!r} for input {authored['input']!r}"
            )
    return None


def main() -> int:
    items = _collect_items()
    print(f"Grading {len(items)} solutions through the real Piston pipeline...\n")

    with ThreadPoolExecutor(max_workers=4) as pool:
        graded = list(pool.map(_grade, items))

    failures = []
    current_section = None
    for row in graded:
        if row["section"] != current_section:
            current_section = row["section"]
            print(f"\n### {current_section}\n")
            print("| Result | Problem | Language | Solution | Tests passed | Notes |")
            print("|---|---|---|---|---|---|")

        notes = []
        if row["kind"] == "correct":
            ok = row["all_passed"]
            if not ok:
                notes.append(row.get("error") or "a correct solution failed a test case")
            if ok and row["language"] == "python":
                canonical_problem = _validate_python_canonical(row)
                if canonical_problem:
                    ok = False
                    notes.append(canonical_problem)
                else:
                    notes.append("validated like a real generated problem")
        else:
            ok = row.get("error") is None and not row["all_passed"]
            if row.get("error"):
                notes.append(f"infrastructure error: {row['error']}")
            elif row.get("crashed"):
                notes.append("fails by crashing, not by a wrong answer")

        if row["language"] == "python":
            keys = [p["key"] for p in analyze_code(row["code"], "python")["anti_patterns"]]
            if row["is_trigger"]:
                if "linear_membership_check" in keys:
                    notes.append("anti-pattern detected: linear_membership_check -> Hash Maps (intended)")
                else:
                    ok = False
                    notes.append("EXPECTED linear_membership_check but analyzer found none")
            elif keys:
                ok = False
                notes.append(f"unexpected anti-pattern(s): {keys}")

        status = "PASS" if ok else "FAIL"
        expectation = "all pass" if row["kind"] == "correct" else "must fail"
        print(
            f"| {status} | {row['label']} | {row['language']} | {row['kind']} ({expectation}) | "
            f"{row['passed']}/{row['total']} | {'; '.join(notes)} |"
        )
        if not ok:
            failures.append(row)

    print(f"\n{len(graded) - len(failures)}/{len(graded)} checks passed.")
    if failures:
        print("VERIFICATION FAILED")
        return 1
    print("ALL DEMO CONTENT VERIFIED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
