"""Static complexity + anti-pattern analysis using Tree-sitter.

Complexity is derived from the deepest chain of nested loops, using the
bound/condition variable of each loop (not just nesting depth) so that
loops over different variables (e.g. `range(n)` and `range(sum_total)`)
are reported as O(n * sum_total) rather than being blindly squared into
O(n^2). This is still a heuristic, not full semantic analysis — it reads
the loop header's text, it doesn't trace data flow — but it directly
distinguishes "two loops over the same bound" from "two loops over
different bounds," which plain depth-counting cannot.

Anti-pattern detection remains Python-only (see Phase 9 notes) and is
scoped per-line within identified loop bodies, with a lightweight
set/dict-assignment scan so that `x in a_set` isn't flagged the same way
as `x in a_list`.
"""

import re

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


# --- Complexity: deepest loop chain + bound-variable-aware expression ---

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


def _extract_range_variable(loop_node, source_bytes: bytes) -> str:
    """Best-effort extraction of the variable/expression a loop is bounded
    by, so distinct bounds aren't collapsed into a generic "n" for every
    loop. Falls back to "n" when the shape isn't recognized."""
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
        return "n"

    if loop_node.type == "while_statement":
        condition = loop_node.child_by_field_name("condition")
        if condition is not None:
            text = source_bytes[condition.start_byte:condition.end_byte].decode("utf-8", errors="ignore")
            match = re.search(r"[<>]=?\s*([a-zA-Z_]\w*)", text)
            if match:
                return match.group(1)
        return "n"

    return "n"


def _build_complexity_expression(chain: list, source_bytes: bytes) -> str:
    if not chain:
        return "O(1)"

    variables = [_extract_range_variable(node, source_bytes) for node in chain]
    counts: dict[str, int] = {}
    order: list[str] = []
    for v in variables:
        if v not in counts:
            order.append(v)
        counts[v] = counts.get(v, 0) + 1

    parts = [v if counts[v] == 1 else f"{v}^{counts[v]}" for v in order]
    return "O(" + " * ".join(parts) + ")"


# --- Anti-patterns: Python only, line-scoped, set/dict-aware ---

def _find_loop_spans(node, loop_types: set, source_bytes: bytes, spans: list) -> None:
    if node.type in loop_types:
        spans.append(source_bytes[node.start_byte:node.end_byte].decode("utf-8", errors="ignore"))
    for child in node.children:
        _find_loop_spans(child, loop_types, source_bytes, spans)


def _find_set_like_variables(full_source: str) -> set:
    """Collects names assigned from a set/dict literal or constructor
    anywhere in the source, so the membership-check heuristic can exclude
    them — `x in a_set` is O(1), not the O(n) list scan this rule targets."""
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
        # Matched per-line, not against the whole span, so a token on one
        # line can never match against a colon/bracket that belongs to an
        # unrelated statement several lines later.
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
    complexity = _build_complexity_expression(chain, source_bytes)

    anti_patterns = []
    if language == "python":
        anti_patterns = _detect_python_anti_patterns(tree.root_node, loop_types, source_bytes, source_code)

    return {"complexity": complexity, "max_loop_depth": len(chain), "anti_patterns": anti_patterns}