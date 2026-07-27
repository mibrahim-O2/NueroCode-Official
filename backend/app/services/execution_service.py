"""Grades a code submission against a problem's stored test cases.

Builds a per-language execution harness, runs it through Piston, and
compares stdout against each test case's expected output.
"""

import json

from app.services.piston_service import execute_code, PistonExecutionError

SUPPORTED_LANGUAGES = ("python", "javascript", "cpp")


# --- C++ type inference / literal formatting (unchanged logic, isolated) ---

def _infer_cpp_type(value) -> str:
    if isinstance(value, bool):
        return "bool"
    if isinstance(value, int):
        return "int"
    if isinstance(value, float):
        return "double"
    if isinstance(value, str):
        return "std::string"
    if isinstance(value, list):
        inner = _infer_cpp_type(value[0]) if value else "int"
        return f"std::vector<{inner}>"
    return "std::string"


def _cpp_literal(value) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return repr(value)
    if isinstance(value, str):
        return json.dumps(value)
    if isinstance(value, list):
        return "{" + ", ".join(_cpp_literal(v) for v in value) + "}"
    return json.dumps(str(value))


# --- Per-language harness builders ---

def _build_python_harness(source_code: str, args: list) -> str:
    args_repr = ", ".join(repr(a) for a in args)
    return f"{source_code}\n\nprint(solve({args_repr}))"


def _build_javascript_harness(source_code: str, args: list) -> str:
    args_repr = ", ".join(json.dumps(a) for a in args)
    return f"{source_code}\n\nconsole.log(solve({args_repr}));"


def _build_cpp_harness(source_code: str, args: list, expected_output) -> str:
    arg_types = [_infer_cpp_type(a) for a in args]
    arg_literals = [_cpp_literal(a) for a in args]
    arg_decls = "\n    ".join(
        f"{t} arg{i} = {lit};" for i, (t, lit) in enumerate(zip(arg_types, arg_literals))
    )
    call_args = ", ".join(f"arg{i}" for i in range(len(args)))
    print_stmt = (
        'cout << (result ? "True" : "False");'
        if isinstance(expected_output, bool)
        else "cout << result;"
    )
    return (
        "#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\n"
        f"{source_code}\n\n"
        "int main() {\n"
        f"    {arg_decls}\n"
        f"    auto result = solve({call_args});\n"
        f"    {print_stmt}\n"
        "    return 0;\n"
        "}\n"
    )


def _build_harness(
    language: str, source_code: str, args: list, expected_output
) -> tuple[str | None, str | None]:
    """Returns (harness_source, error) — exactly one is non-None."""
    if language == "python":
        return _build_python_harness(source_code, args), None

    if language == "javascript":
        return _build_javascript_harness(source_code, args), None

    if language == "cpp":
        if isinstance(expected_output, list):
            return None, {
                "message": (
                    "C++ execution currently supports scalar return types (numbers, strings, "
                    "booleans) only. This problem expects a list result — please solve it in "
                    "Python or JavaScript for now."
                ),
                "error_type": "invalid_request",
            }
        return _build_cpp_harness(source_code, args, expected_output), None

    return None, {"message": f"Unsupported language: {language}", "error_type": "invalid_request"}


def _run_case(language: str, harness: str, case_number: int, args: list, expected_str: str) -> dict:
    """Executes one test case's harness and returns its graded result.

    Distinguishes compile failures from runtime failures so callers can
    surface them cleanly and, for compiled languages, avoid repeating an
    identical compile error across every remaining test case.
    """
    piston_result = execute_code(language, harness)

    compile_info = piston_result.get("compile") or {}
    if compile_info.get("code") not in (0, None):
        compile_error = (
            compile_info.get("stderr") or compile_info.get("output") or "Compilation failed"
        ).strip()
        return {
            "case": case_number,
            "input": args,
            "expected": expected_str,
            "actual": compile_error,
            "passed": False,
            "compile_failed": True,
        }

    run_info = piston_result.get("run") or {}
    stdout = (run_info.get("stdout") or "").strip()
    stderr = (run_info.get("stderr") or "").strip()

    passed = (not stderr) and stdout == expected_str
    return {
        "case": case_number,
        "input": args,
        "expected": expected_str,
        "actual": stdout if not stderr else stderr,
        "passed": passed,
        "compile_failed": False,
    }


def run_submission(problem: dict, language: str, source_code: str) -> dict:
    """Grades a submission against a problem's stored test cases.

    Returns either:
      {"error": "...", "error_type": "invalid_request" | "infrastructure"} —
        could not be graded at all. "invalid_request" means bad input on
        the student's end (unsupported language/return type); "infrastructure"
        means Piston itself is unreachable or has no runtimes loaded.
      {"results": [...], "passed_count": int, "total_count": int, "all_passed": bool}
    """
    if language not in SUPPORTED_LANGUAGES:
        return {"error": f"Unsupported language: {language}", "error_type": "invalid_request"}

    test_cases = problem["test_cases"]
    results = []
    passed_count = 0

    try:
        for i, case in enumerate(test_cases, start=1):
            args = case["input"]
            expected_str = str(case["expected_output"]).strip()

            harness, error = _build_harness(language, source_code, args, case["expected_output"])
            if error:
                return {"error": error["message"], "error_type": error["error_type"]}

            case_result = _run_case(language, harness, i, args, expected_str)
            results.append(case_result)
            if case_result["passed"]:
                passed_count += 1

            if case_result["compile_failed"]:
                # Compilation depends only on the user's own code, which is
                # identical across every case's harness — stop instead of
                # repeating the same failure (and the same Piston round trip)
                # for every remaining test case.
                break
    except PistonExecutionError as exc:
        return {"error": str(exc), "error_type": "infrastructure"}

    return {
        "results": results,
        "passed_count": passed_count,
        "total_count": len(test_cases),
        "all_passed": passed_count == len(test_cases),
    }