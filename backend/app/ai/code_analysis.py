"""Static complexity + anti-pattern analysis using Tree-sitter.

Complexity output is always one of a fixed set of canonical Big-O forms
(O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n), etc.) — raw source
identifiers (loop bound variable names, function names) are used only
internally to compare loops/calls for equality and are never spliced
into the displayed string. This is still a heuristic reading loop
headers and call sites, not full semantic analysis.

Anti-pattern detection remains Python-only (see Phase 9 notes), scoped
per-line within identified loop bodies, with a set/dict-assignment scan
so `x in a_set` isn't flagged the same way as `x in a_list`.
"""

import re
import warnings

# tree_sitter_languages (a third-party helper library) still calls
# tree-sitter's OLD, deprecated Language() constructor internally,
# regardless of which tree-sitter version is installed — this is inside
# that library's own code, not ours, so it can't be fixed by changing
# our code or pinning a version. Silencing this specific warning message
# is the correct fix here, since the deprecated call still works
# correctly today; it's just noisy.
warnings.filterwarnings("ignore", message="Language\\(path, name\\) is deprecated")

from tree_sitter_languages import get_parser

LOOP_NODE_TYPES = {
    "python": {"for_statement", "while_statement"},
    "javascript": {"for_statement", "while_statement", "for_in_statement", "for_of_statement"},
    "cpp": {"for_statement", "while_statement"},
}

COUNT_IN_LOOP_MESSAGE = (
    "Calling .count() inside a loop re-scans the whole list on every iteration, "
    "turning an O(n) loop into O(n^2). Consider counting with a dictionary "
    "(collections.Counter) once, outside the loop."
)

MEMBERSHIP_CHECK_MESSAGE = (
    "Checking membership with 'in' against a list inside a loop is an O(n) scan "
    "per check. If you only need to test presence, a set or dict gives O(1) "
    "average-case lookups instead."
)

BOUND_SYMBOLS = ["n", "m", "k", "p", "q"]
SUPERSCRIPTS = {2: "\u00b2", 3: "\u00b3"}

# A loop whose body halves/doubles its own bound (binary search's
# `left`/`right`/`mid`, or explicit `// 2` / bit-shift halving) is
# logarithmic, not linear — detected from the loop's own source text.
LOG_HINT_PATTERN = re.compile(r"//\s*2\b|>>=?\s*1\b|\bmid\b")


# --- Complexity: deepest loop chain, bound-equality-aware, log-aware ---

def _deepest_loop_chain(node, loop_types: set) -> list:
    """Returns the loop nodes along the single deepest nesting path,
    root to innermost. Sibling loops are not summed — only the longest
    chain along any one path counts toward depth."""
    current = [node] if node.type in loop_types else []
    best_chain = list(current)
    for child in node.children:
        candidate = current + _deepest_loop_chain(child, loop_types)
        if len(candidate) > len(best_chain):
            best_chain = candidate
    return best_chain


def _extract_bound_identity(loop_node, source_bytes: bytes) -> str:
    """Returns an internal identity string for what a loop is bounded by.

    Used ONLY to test whether two loops share the same bound (e.g. both
    `range(n)`) versus different bounds (`range(n)` vs `range(sum_total)`).
    This value is never shown to the user directly.
    """
    if loop_node.type == "for_statement":
        right = loop_node.child_by_field_name("right")
        if right is not None:
            text = source_bytes[right.start_byte:right.end_byte].decode("utf-8", errors="ignore")
            match = re.search(r"range\(\s*(?:len\(\s*)?([a-zA-Z_]\w*)", text)
            if match:
                return match.group(1)
            simple = re.match(r"^([a-zA-Z_]\w*)$", text.strip())
            if simple:
                return simple.group(1)
        return "__unknown__"

    if loop_node.type == "while_statement":
        condition = loop_node.child_by_field_name("condition")
        if condition is not None:
            text = source_bytes[condition.start_byte:condition.end_byte].decode("utf-8", errors="ignore")
            match = re.search(r"[<>]=?\s*([a-zA-Z_]\w*)", text)
            if match:
                return match.group(1)
        return "__unknown__"

    return "__unknown__"


def _loop_is_logarithmic(loop_node, source_bytes: bytes) -> bool:
    text = source_bytes[loop_node.start_byte:loop_node.end_byte].decode("utf-8", errors="ignore")
    return bool(LOG_HINT_PATTERN.search(text))


def _symbol_for_index(index: int) -> str:
    if index < len(BOUND_SYMBOLS):
        return BOUND_SYMBOLS[index]
    return f"x{index}"


def _format_factor(name: str, count: int) -> str:
    if count == 1:
        return name
    if name != "log n" and count in SUPERSCRIPTS:
        return f"{name}{SUPERSCRIPTS[count]}"
    return f"({name})^{count}"


def _build_complexity_expression(chain: list, source_bytes: bytes) -> str:
    """Builds a canonical Big-O string from the deepest loop chain.

    Bound identifiers are only used to decide whether consecutive loops
    share a bound (-> squared) or differ (-> multiplied as distinct
    symbols) — the displayed symbols always come from a fixed set.
    """
    if not chain:
        return "O(1)"

    bound_ids = [_extract_bound_identity(node, source_bytes) for node in chain]
    is_log = [_loop_is_logarithmic(node, source_bytes) for node in chain]

    symbol_for_bound: dict[str, str] = {}
    next_index = 0
    factors: list[str] = []

    for bound_id, log in zip(bound_ids, is_log):
        if log:
            factors.append("log n")
            continue
        if bound_id not in symbol_for_bound:
            symbol_for_bound[bound_id] = _symbol_for_index(next_index)
            next_index += 1
        factors.append(symbol_for_bound[bound_id])

    counts: dict[str, int] = {}
    order: list[str] = []
    for f in factors:
        if f not in counts:
            order.append(f)
        counts[f] = counts.get(f, 0) + 1

    # Conventional idiom: a plain "n" loop containing one logarithmic loop
    # is written "n log n", not "n * log n".
    if set(order) == {"n", "log n"} and counts["n"] == 1 and counts["log n"] == 1:
        return "O(n log n)"

    parts = [_format_factor(f, counts[f]) for f in order]
    return "O(" + " * ".join(parts) + ")"


# --- No-loop case: bounded recursion heuristic (Python only) ---

def _find_function_name(root_node, source_bytes: bytes) -> str | None:
    for node in root_node.children:
        if node.type == "function_definition":
            name_node = node.child_by_field_name("name")
            if name_node is not None:
                return source_bytes[name_node.start_byte:name_node.end_byte].decode("utf-8", errors="ignore")
    return None


def _count_self_calls(root_node, function_name: str, source_bytes: bytes) -> int:
    count = 0

    def walk(node):
        nonlocal count
        if node.type == "call":
            func_node = node.child_by_field_name("function")
            if func_node is not None:
                name = source_bytes[func_node.start_byte:func_node.end_byte].decode("utf-8", errors="ignore")
                if name == function_name:
                    count += 1
        for child in node.children:
            walk(child)

    walk(root_node)
    return count


def _analyze_recursive_complexity(root_node, source_bytes: bytes) -> str:
    """Heuristic only: 2+ self-calls in one function body (e.g. naive
    fib(n-1) + fib(n-2)) reads as exponential branching; exactly one
    self-call reads as linear recursion; no self-calls and no loops is
    O(1). This does not detect memoization, tail-call patterns, or
    multi-function mutual recursion.
    """
    function_name = _find_function_name(root_node, source_bytes)
    if not function_name:
        return "O(1)"
    self_calls = _count_self_calls(root_node, function_name, source_bytes)
    if self_calls >= 2:
        return "O(2^n)"
    if self_calls == 1:
        return "O(n)"
    return "O(1)"


# --- Anti-patterns: Python only, line-scoped, set/dict-aware ---

def _find_loop_spans(node, loop_types: set, source_bytes: bytes, spans: list) -> None:
    if node.type in loop_types:
        spans.append(source_bytes[node.start_byte:node.end_byte].decode("utf-8", errors="ignore"))
    for child in node.children:
        _find_loop_spans(child, loop_types, source_bytes, spans)


def _find_set_like_variables(full_source: str) -> set:
    names = set()
    for match in re.finditer(r"\b([a-zA-Z_]\w*)\s*=\s*(?:\{|set\(|dict\()", full_source):
        names.add(match.group(1))
    return names


def _line_flags_membership_check(line: str, set_like_vars: set) -> bool:
    match = re.search(r"(?<!not )\bin\s+([a-zA-Z_]\w*)\b", line)
    if not match:
        return False
    return match.group(1) not in set_like_vars


def _detect_python_anti_patterns(root_node, loop_types: set, source_bytes: bytes, full_source: str) -> list:
    set_like_vars = _find_set_like_variables(full_source)
    loop_spans: list = []
    _find_loop_spans(root_node, loop_types, source_bytes, loop_spans)

    found = []
    seen_keys = set()
    for span in loop_spans:
        for line in span.splitlines():
            if "count_in_loop" not in seen_keys and re.search(r"\.count\(", line):
                found.append({"key": "count_in_loop", "message": COUNT_IN_LOOP_MESSAGE})
                seen_keys.add("count_in_loop")
            if "linear_membership_check" not in seen_keys and _line_flags_membership_check(line, set_like_vars):
                found.append({"key": "linear_membership_check", "message": MEMBERSHIP_CHECK_MESSAGE})
                seen_keys.add("linear_membership_check")
    return found


def analyze_code(source_code: str, language: str) -> dict:
    """Returns {"complexity": str, "max_loop_depth": int, "anti_patterns": [...]}."""
    if language not in LOOP_NODE_TYPES:
        return {"complexity": "unknown", "max_loop_depth": 0, "anti_patterns": []}

    parser = get_parser(language)
    source_bytes = source_code.encode("utf-8")
    tree = parser.parse(source_bytes)
    loop_types = LOOP_NODE_TYPES[language]

    chain = _deepest_loop_chain(tree.root_node, loop_types)

    if chain:
        complexity = _build_complexity_expression(chain, source_bytes)
    elif language == "python":
        complexity = _analyze_recursive_complexity(tree.root_node, source_bytes)
    else:
        complexity = "O(1)"

    anti_patterns = []
    if language == "python":
        anti_patterns = _detect_python_anti_patterns(tree.root_node, loop_types, source_bytes, source_code)

    return {"complexity": complexity, "max_loop_depth": len(chain), "anti_patterns": anti_patterns}