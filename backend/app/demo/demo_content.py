"""Fixed, hand-authored content for Demo Mode — the single source of truth.

Why this file exists
--------------------
Real NeuroCode generates problems, assessment questions and interview
questions with AI at runtime, so no two runs look the same. A live demo needs
the opposite: the same content every time, so the presenter can rehearse and
never hit an unexpected question. Everything a presenter can be asked to
solve in Demo Mode is defined here, once, and never generated at runtime.

What is NOT here
----------------
Grading, analysis, XP, unlocking, integrity scoring and credential tiers are
not defined here. demo_service.py runs all of those through the exact same
real services the live app uses (execution_service.run_submission, the real
Tree-sitter analyzer, repositories.update_user_progress, the shared
assessment_service scoring rules). This file only answers "what exists".

Verification
------------
Every "correct" solution below has been executed through the real Piston
pipeline and passes all of its own test cases; every "wrong" solution has
been executed and fails at least one. Re-run the proof at any time with:

    cd backend && python -m app.demo.verify_demo_content

docs/demo.md is generated from this file (python -m app.demo.generate_demo_docs),
so the presenter script can never drift from the running content.

Shape
-----
Problem dicts mirror the real problem objects stored by problem_service
(title, description, examples, constraints, expected_complexity, test_cases)
plus a `solutions` block: {language: {"correct", "wrong", "wrong_explanation"}}.
test_cases use the same {"input": [args...], "expected_output": value} format
execution_service.run_submission grades against.
"""

import textwrap


def _code(source: str) -> str:
    """Dedents an indented triple-quoted code block, so solutions can be
    written nested inside the dicts below while still reaching Piston (and
    the presenter's editor) with correct, flush-left indentation."""
    return textwrap.dedent(source).strip("\n") + "\n"


# ============================================================================
# PERSONA + DEMO COHORT
# ============================================================================
# The display identity shown in place of the owner's real name and photo
# while Demo Mode is on (Topbar, Dashboard greeting, Profile, and the 4th
# "live progress" row in the demo cohort). Persisted into the owner's
# preferences on first activation, so the frontend reads it from
# GET /demo/status rather than hardcoding it.
DEMO_PERSONA = {
    "display_name": "mibrahim-O2",
    # The frontend renders the NeuroCode logo mark for this avatar key.
    "avatar": "neurocode-logo-mark",
}

# The three fixed demo cohort accounts. These become REAL users rows with
# is_demo_cohort = true (see migration 026), so the real admin role-change
# and per-student reset actions work on them unmodified. Every name and
# email is deliberately fictional; example.com is a reserved domain that can
# never belong to a real person.
#
# firebase_uid is a fixed placeholder: these accounts never log in, it only
# satisfies the users table's unique-not-null constraint and makes creation
# idempotent (the same get-or-create-by-firebase_uid pattern real login uses).
#
# seed_completed_topics: how many real roadmap topics each account has
# completed on first activation, via the real complete_roadmap_node (so their
# XP and level are genuinely earned). Different amounts give the educator
# view a realistic spread instead of three identical empty rows.
DEMO_COHORT = [
    {
        "key": "student-a",
        "name": "Demo Student A",
        "email": "demo.student.a@example.com",
        "firebase_uid": "demo-cohort-student-a",
        "seed_completed_topics": 4,
    },
    {
        "key": "student-b",
        "name": "Demo Student B",
        "email": "demo.student.b@example.com",
        "firebase_uid": "demo-cohort-student-b",
        "seed_completed_topics": 2,
    },
    {
        "key": "student-c",
        "name": "Demo Student C",
        "email": "demo.student.c@example.com",
        "firebase_uid": "demo-cohort-student-c",
        "seed_completed_topics": 7,
    },
]

# Author name on demo teacher comments (demo_submission_comments stores a
# plain name rather than a real educator account — see migration 029).
DEMO_EDUCATOR_NAME = "Demo Educator"


# ============================================================================
# DEMO ROADMAP
# ============================================================================
# The 5 fixed topics of the demo roadmap, in their starting order. Each is a
# real topic from the real 10-topic roadmap (repositories.DEFAULT_TOPICS) with
# its real difficulty, so XP rewards match the live app exactly.
#
# Hash Maps is deliberately placed LAST. The demo's headline moment is the
# adaptive engine reacting to a real anti-pattern: submitting the flagged
# wrong solution to "First Repeated Reading" (an Arrays problem) makes the
# real analyzer detect a linear membership check, which TOPIC_FIX_MAP maps to
# Hash Maps. Starting it at position 4 means the real promote_roadmap_topic
# visibly jumps it from last place to second — a reorder nobody can miss.
DEMO_ROADMAP_TOPICS = [
    ("Arrays", "beginner"),
    ("Strings", "beginner"),
    ("Two Pointers", "intermediate"),
    ("Sliding Window", "intermediate"),
    ("Hash Maps", "beginner"),
]


# ============================================================================
# PRACTICE PROBLEMS — 9 problems (3 easy, 3 medium, 3 hard), 3 languages each
# ============================================================================
# Served by GET /demo/practice/{problem_key} and graded by
# POST /demo/practice/submit through the real run_submission + analyzer.
#
# Every problem returns a single number or string. The real C++ harness only
# prints scalar return types, and JavaScript prints booleans as "true" (which
# would never match an expected "True"), so both are avoided to keep all
# three languages gradeable by the unmodified real harness.
#
# Each wrong solution is a realistic near-miss (an ordering bug, a wrong
# comparison operator, an off-by-one, a missed edge case). Most of them pass
# some test cases and fail others, so "here's the mistake, here's the fix"
# reads naturally live.
PRACTICE_PROBLEMS = [
    # ------------------------------------------------------------------
    # ANTI-PATTERN TRIGGER. The Python WRONG solution below keeps previous
    # readings in a plain list and checks `value in seen` inside the loop.
    # The real analyzer (app/ai/code_analysis.py) flags that as
    # "linear_membership_check", and TOPIC_FIX_MAP maps that key to
    # "Hash Maps". Because this problem's topic is "Arrays" (not Hash Maps),
    # the real reorder rule fires: submitting it while Arrays is the active
    # topic moves Hash Maps from position 4 to position 1 of the demo
    # roadmap, live. Anti-pattern detection is Python-only in the real
    # analyzer, so submit the PYTHON wrong solution for this moment.
    # ------------------------------------------------------------------
    {
        "key": "easy-first-repeated-reading",
        "topic": "Arrays",
        "difficulty": "easy",
        "anti_pattern_trigger": True,
        "title": "First Repeated Reading",
        "description": (
            "A sensor streams integer readings one at a time. Return the first reading value that "
            "appears for a second time as you read the list from left to right. If no value ever "
            "repeats, return -1."
        ),
        "examples": [
            {
                "input": "readings = [3, 1, 4, 1, 5, 9]",
                "output": "1",
                "explanation": "1 is the first value seen a second time (at index 3).",
            },
            {
                "input": "readings = [4, 9, 9, 4]",
                "output": "9",
                "explanation": "9 repeats at index 2, before 4 repeats at index 3.",
            },
            {"input": "readings = [5, 6, 7, 8]", "output": "-1", "explanation": "No value appears twice."},
        ],
        "constraints": [
            "1 <= len(readings) <= 10^5",
            "-10^9 <= readings[i] <= 10^9",
            "Return -1 when no value repeats",
        ],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": [[3, 1, 4, 1, 5, 9]], "expected_output": 1},
            {"input": [[2, 7, 2, 7]], "expected_output": 2},
            {"input": [[5, 6, 7, 8]], "expected_output": -1},
            {"input": [[4, 9, 9, 4]], "expected_output": 9},
            {"input": [[8]], "expected_output": -1},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(readings):
                        seen = set()
                        for value in readings:
                            if value in seen:
                                return value
                            seen.add(value)
                        return -1
                """),
                "wrong": _code("""
                    def solve(readings):
                        seen = []
                        for value in readings:
                            seen.append(value)
                            if value in seen:
                                return value
                        return -1
                """),
                "wrong_explanation": (
                    "Two problems. First, each reading is added to `seen` BEFORE the check, so every "
                    "reading finds itself and the function always returns the first element. Second, "
                    "`seen` is a list, so `value in seen` rescans it on every iteration (O(n^2)). The "
                    "analyzer flags that second issue as a linear membership check, which is what moves "
                    "Hash Maps forward on the roadmap. Fix: check a set first, then add."
                ),
            },
            "javascript": {
                "correct": _code("""
                    function solve(readings) {
                      const seen = new Set();
                      for (const value of readings) {
                        if (seen.has(value)) {
                          return value;
                        }
                        seen.add(value);
                      }
                      return -1;
                    }
                """),
                "wrong": _code("""
                    function solve(readings) {
                      const seen = [];
                      for (const value of readings) {
                        seen.push(value);
                        if (seen.includes(value)) {
                          return value;
                        }
                      }
                      return -1;
                    }
                """),
                "wrong_explanation": (
                    "Pushes the reading before checking, so every reading matches itself and the first "
                    "element is always returned; `includes` on an array is also a linear scan per step. "
                    "Fix: check a Set first, then add."
                ),
            },
            "cpp": {
                "correct": _code("""
                    #include <unordered_set>

                    int solve(vector<int> readings) {
                        unordered_set<int> seen;
                        for (int value : readings) {
                            if (seen.count(value)) {
                                return value;
                            }
                            seen.insert(value);
                        }
                        return -1;
                    }
                """),
                "wrong": _code("""
                    int solve(vector<int> readings) {
                        vector<int> seen;
                        for (int value : readings) {
                            seen.push_back(value);
                            for (int previous : seen) {
                                if (previous == value) {
                                    return value;
                                }
                            }
                        }
                        return -1;
                    }
                """),
                "wrong_explanation": (
                    "Stores the reading before scanning, so the inner loop always matches the reading "
                    "itself and the first element is returned. Fix: check an unordered_set before inserting."
                ),
            },
        },
    },
    {
        "key": "easy-reverse-word-order",
        "topic": "Strings",
        "difficulty": "easy",
        "title": "Reverse Word Order",
        "description": (
            "Given a line of text, return its words in reverse order, separated by single spaces. The "
            "input may contain leading, trailing, or repeated spaces between words; the output must not."
        ),
        "examples": [
            {"input": 'text = "the sky is blue"', "output": '"blue is sky the"'},
            {
                "input": 'text = "  code   review  "',
                "output": '"review code"',
                "explanation": "Extra spaces are collapsed to single spaces.",
            },
            {"input": 'text = "hello"', "output": '"hello"'},
        ],
        "constraints": [
            "1 <= len(text) <= 10^4",
            "text contains only letters and spaces",
            "text contains at least one word",
        ],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": ["the sky is blue"], "expected_output": "blue is sky the"},
            {"input": ["hello"], "expected_output": "hello"},
            {"input": ["  code   review  "], "expected_output": "review code"},
            {"input": ["a b  c"], "expected_output": "c b a"},
            {"input": ["neuro code"], "expected_output": "code neuro"},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(text):
                        return " ".join(reversed(text.split()))
                """),
                "wrong": _code("""
                    def solve(text):
                        return " ".join(text.split(" ")[::-1])
                """),
                "wrong_explanation": (
                    'Missed edge case: split(" ") keeps an empty string for every extra space, so repeated '
                    "spaces survive into the output. It passes on clean input and fails on messy spacing. "
                    "Fix: split() with no argument, which splits on any run of whitespace."
                ),
            },
            "javascript": {
                "correct": _code("""
                    function solve(text) {
                      return text.split(" ").filter((word) => word.length > 0).reverse().join(" ");
                    }
                """),
                "wrong": _code("""
                    function solve(text) {
                      return text.split(" ").reverse().join(" ");
                    }
                """),
                "wrong_explanation": (
                    'Missed edge case: split(" ") produces empty strings for repeated spaces, and they are '
                    "rejoined into the output. Fix: filter out the empty pieces before reversing."
                ),
            },
            "cpp": {
                "correct": _code("""
                    #include <sstream>

                    string solve(string text) {
                        istringstream stream(text);
                        vector<string> words;
                        string word;
                        while (stream >> word) {
                            words.push_back(word);
                        }
                        string result;
                        for (int i = (int)words.size() - 1; i >= 0; i--) {
                            result += words[i];
                            if (i > 0) {
                                result += " ";
                            }
                        }
                        return result;
                    }
                """),
                "wrong": _code("""
                    string solve(string text) {
                        vector<string> words;
                        string current;
                        for (char ch : text) {
                            if (ch == ' ') {
                                words.push_back(current);
                                current = "";
                            } else {
                                current += ch;
                            }
                        }
                        words.push_back(current);
                        string result;
                        for (int i = (int)words.size() - 1; i >= 0; i--) {
                            result += words[i];
                            if (i > 0) {
                                result += " ";
                            }
                        }
                        return result;
                    }
                """),
                "wrong_explanation": (
                    "Splits on every single space, so repeated spaces create empty words that are joined "
                    "back into the output. Fix: read words with a stream, which skips any whitespace."
                ),
            },
        },
    },
    {
        "key": "easy-largest-temperature-rise",
        "topic": "Arrays",
        "difficulty": "easy",
        "title": "Largest Temperature Rise",
        "description": (
            "You are given hourly temperature readings in order. Return the largest rise from an earlier "
            "reading to a later one (later minus earlier). If temperatures never rise, return 0."
        ),
        "examples": [
            {"input": "temps = [3, 8, 4, 10]", "output": "7", "explanation": "10 - 3 = 7."},
            {"input": "temps = [9, 7, 4]", "output": "0", "explanation": "Temperatures only fall."},
            {"input": "temps = [2, 1, 6]", "output": "5", "explanation": "6 - 1 = 5."},
        ],
        "constraints": ["2 <= len(temps) <= 10^5", "-100 <= temps[i] <= 100"],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": [[3, 8, 4, 10]], "expected_output": 7},
            {"input": [[9, 7, 4]], "expected_output": 0},
            {"input": [[5, 5, 5]], "expected_output": 0},
            {"input": [[2, 1, 6]], "expected_output": 5},
            {"input": [[1, 4]], "expected_output": 3},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(temps):
                        lowest = temps[0]
                        best = 0
                        for t in temps[1:]:
                            best = max(best, t - lowest)
                            lowest = min(lowest, t)
                        return best
                """),
                "wrong": _code("""
                    def solve(temps):
                        lowest = temps[0]
                        best = temps[1] - temps[0]
                        for t in temps[1:]:
                            best = max(best, t - lowest)
                            lowest = min(lowest, t)
                        return best
                """),
                "wrong_explanation": (
                    "Missed edge case: `best` starts at the first difference instead of 0, so when "
                    "temperatures only fall it returns a negative 'rise'. Fix: start `best` at 0."
                ),
            },
            "javascript": {
                "correct": _code("""
                    function solve(temps) {
                      let lowest = temps[0];
                      let best = 0;
                      for (let i = 1; i < temps.length; i++) {
                        best = Math.max(best, temps[i] - lowest);
                        lowest = Math.min(lowest, temps[i]);
                      }
                      return best;
                    }
                """),
                "wrong": _code("""
                    function solve(temps) {
                      let lowest = temps[0];
                      let best = temps[1] - temps[0];
                      for (let i = 1; i < temps.length; i++) {
                        best = Math.max(best, temps[i] - lowest);
                        lowest = Math.min(lowest, temps[i]);
                      }
                      return best;
                    }
                """),
                "wrong_explanation": (
                    "Starts `best` at the first difference, which is negative when temperatures fall. "
                    "Fix: start `best` at 0."
                ),
            },
            "cpp": {
                "correct": _code("""
                    #include <algorithm>

                    int solve(vector<int> temps) {
                        int lowest = temps[0];
                        int best = 0;
                        for (size_t i = 1; i < temps.size(); i++) {
                            best = max(best, temps[i] - lowest);
                            lowest = min(lowest, temps[i]);
                        }
                        return best;
                    }
                """),
                "wrong": _code("""
                    #include <algorithm>

                    int solve(vector<int> temps) {
                        int lowest = temps[0];
                        int best = temps[1] - temps[0];
                        for (size_t i = 1; i < temps.size(); i++) {
                            best = max(best, temps[i] - lowest);
                            lowest = min(lowest, temps[i]);
                        }
                        return best;
                    }
                """),
                "wrong_explanation": (
                    "Starts `best` at the first difference, which is negative when temperatures fall. "
                    "Fix: start `best` at 0."
                ),
            },
        },
    },
    {
        "key": "medium-pairs-that-hit-target",
        "topic": "Hash Maps",
        "difficulty": "medium",
        "title": "Pairs That Hit the Target",
        "description": (
            "Given a list of integers and a target, count the index pairs (i, j) with i < j whose values "
            "add up exactly to target. A value can never be paired with itself."
        ),
        "examples": [
            {
                "input": "nums = [1, 5, 7, 1], target = 6",
                "output": "2",
                "explanation": "Indices (0, 1) and (1, 3): 1 + 5 and 5 + 1.",
            },
            {
                "input": "nums = [3, 3, 3], target = 6",
                "output": "3",
                "explanation": "Every pair of the three 3s.",
            },
            {"input": "nums = [2, 4], target = 5", "output": "0"},
        ],
        "constraints": [
            "1 <= len(nums) <= 10^5",
            "-10^4 <= nums[i], target <= 10^4",
            "Only pairs of two different indices count",
        ],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": [[1, 5, 7, 1], 6], "expected_output": 2},
            {"input": [[3, 3, 3], 6], "expected_output": 3},
            {"input": [[2, 4], 5], "expected_output": 0},
            {"input": [[4, 2, 3, 1], 5], "expected_output": 2},
            {"input": [[0, 0], 0], "expected_output": 1},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(nums, target):
                        counts = {}
                        pairs = 0
                        for x in nums:
                            pairs += counts.get(target - x, 0)
                            counts[x] = counts.get(x, 0) + 1
                        return pairs
                """),
                "wrong": _code("""
                    def solve(nums, target):
                        counts = {}
                        pairs = 0
                        for x in nums:
                            counts[x] = counts.get(x, 0) + 1
                            pairs += counts.get(target - x, 0)
                        return pairs
                """),
                "wrong_explanation": (
                    "Ordering bug: the current value is counted BEFORE looking up its complement, so when "
                    "x + x == target the value pairs with itself. It passes most inputs and fails only when "
                    "two halves of the target appear. Fix: look up first, then record x."
                ),
            },
            "javascript": {
                "correct": _code("""
                    function solve(nums, target) {
                      const counts = new Map();
                      let pairs = 0;
                      for (const x of nums) {
                        pairs += counts.get(target - x) || 0;
                        counts.set(x, (counts.get(x) || 0) + 1);
                      }
                      return pairs;
                    }
                """),
                "wrong": _code("""
                    function solve(nums, target) {
                      const counts = new Map();
                      let pairs = 0;
                      for (const x of nums) {
                        counts.set(x, (counts.get(x) || 0) + 1);
                        pairs += counts.get(target - x) || 0;
                      }
                      return pairs;
                    }
                """),
                "wrong_explanation": (
                    "Records x before looking up target - x, so x pairs with itself when x + x == target. "
                    "Fix: look up first, then record."
                ),
            },
            "cpp": {
                "correct": _code("""
                    #include <unordered_map>

                    int solve(vector<int> nums, int target) {
                        unordered_map<int, int> counts;
                        int pairs = 0;
                        for (int x : nums) {
                            auto it = counts.find(target - x);
                            if (it != counts.end()) {
                                pairs += it->second;
                            }
                            counts[x]++;
                        }
                        return pairs;
                    }
                """),
                "wrong": _code("""
                    #include <unordered_map>

                    int solve(vector<int> nums, int target) {
                        unordered_map<int, int> counts;
                        int pairs = 0;
                        for (int x : nums) {
                            counts[x]++;
                            auto it = counts.find(target - x);
                            if (it != counts.end()) {
                                pairs += it->second;
                            }
                        }
                        return pairs;
                    }
                """),
                "wrong_explanation": (
                    "Increments counts[x] before the lookup, so x pairs with itself when x + x == target. "
                    "Fix: look up first, then increment."
                ),
            },
        },
    },
    {
        "key": "medium-affordable-gift-pairs",
        "topic": "Two Pointers",
        "difficulty": "medium",
        "title": "Affordable Gift Pairs",
        "description": (
            "A shop lists item prices in no particular order. Count how many pairs of different items "
            "(i < j) cost no more than budget in total. A total exactly equal to budget is affordable."
        ),
        "examples": [
            {
                "input": "prices = [1, 2, 3, 4], budget = 5",
                "output": "4",
                "explanation": "(1, 2), (1, 3), (1, 4) and (2, 3).",
            },
            {
                "input": "prices = [5, 1, 4], budget = 5",
                "output": "1",
                "explanation": "Only 1 + 4 fits, exactly on budget.",
            },
            {"input": "prices = [10, 20], budget = 5", "output": "0"},
        ],
        "constraints": [
            "2 <= len(prices) <= 10^5",
            "1 <= prices[i], budget <= 10^6",
            "A total equal to budget counts as affordable",
        ],
        "expected_complexity": "O(n log n)",
        "test_cases": [
            {"input": [[1, 2, 3, 4], 5], "expected_output": 4},
            {"input": [[5, 1, 4], 5], "expected_output": 1},
            {"input": [[2, 2, 2], 4], "expected_output": 3},
            {"input": [[10, 20], 5], "expected_output": 0},
            {"input": [[3, 1, 2], 10], "expected_output": 3},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(prices, budget):
                        prices = sorted(prices)
                        left, right = 0, len(prices) - 1
                        count = 0
                        while left < right:
                            if prices[left] + prices[right] <= budget:
                                count += right - left
                                left += 1
                            else:
                                right -= 1
                        return count
                """),
                "wrong": _code("""
                    def solve(prices, budget):
                        prices = sorted(prices)
                        left, right = 0, len(prices) - 1
                        count = 0
                        while left < right:
                            if prices[left] + prices[right] < budget:
                                count += right - left
                                left += 1
                            else:
                                right -= 1
                        return count
                """),
                "wrong_explanation": (
                    "Wrong comparison operator: `<` instead of `<=`, so a pair costing exactly the budget is "
                    "treated as too expensive. Fix: use `<=`."
                ),
            },
            "javascript": {
                "correct": _code("""
                    function solve(prices, budget) {
                      const sorted = [...prices].sort((a, b) => a - b);
                      let left = 0;
                      let right = sorted.length - 1;
                      let count = 0;
                      while (left < right) {
                        if (sorted[left] + sorted[right] <= budget) {
                          count += right - left;
                          left++;
                        } else {
                          right--;
                        }
                      }
                      return count;
                    }
                """),
                "wrong": _code("""
                    function solve(prices, budget) {
                      const sorted = [...prices].sort((a, b) => a - b);
                      let left = 0;
                      let right = sorted.length - 1;
                      let count = 0;
                      while (left < right) {
                        if (sorted[left] + sorted[right] < budget) {
                          count += right - left;
                          left++;
                        } else {
                          right--;
                        }
                      }
                      return count;
                    }
                """),
                "wrong_explanation": "Uses `<` instead of `<=`, rejecting pairs that cost exactly the budget.",
            },
            "cpp": {
                "correct": _code("""
                    #include <algorithm>

                    int solve(vector<int> prices, int budget) {
                        sort(prices.begin(), prices.end());
                        int left = 0;
                        int right = (int)prices.size() - 1;
                        int count = 0;
                        while (left < right) {
                            if (prices[left] + prices[right] <= budget) {
                                count += right - left;
                                left++;
                            } else {
                                right--;
                            }
                        }
                        return count;
                    }
                """),
                "wrong": _code("""
                    #include <algorithm>

                    int solve(vector<int> prices, int budget) {
                        sort(prices.begin(), prices.end());
                        int left = 0;
                        int right = (int)prices.size() - 1;
                        int count = 0;
                        while (left < right) {
                            if (prices[left] + prices[right] < budget) {
                                count += right - left;
                                left++;
                            } else {
                                right--;
                            }
                        }
                        return count;
                    }
                """),
                "wrong_explanation": "Uses `<` instead of `<=`, rejecting pairs that cost exactly the budget.",
            },
        },
    },
    {
        "key": "medium-busiest-stretch-of-hours",
        "topic": "Sliding Window",
        "difficulty": "medium",
        "title": "Busiest Stretch of Hours",
        "description": (
            "visits[i] is the number of visitors in hour i. Return the largest total number of visitors "
            "across any k consecutive hours."
        ),
        "examples": [
            {"input": "visits = [4, 2, 1, 7, 8], k = 2", "output": "15", "explanation": "Hours 3 and 4: 7 + 8."},
            {
                "input": "visits = [3, 0, 4, 1, 5], k = 3",
                "output": "10",
                "explanation": "The last three hours: 4 + 1 + 5.",
            },
            {"input": "visits = [2, 8, 1, 1], k = 2", "output": "10"},
        ],
        "constraints": ["1 <= k <= len(visits) <= 10^5", "0 <= visits[i] <= 10^4"],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": [[4, 2, 1, 7, 8], 2], "expected_output": 15},
            {"input": [[1, 9, 3], 1], "expected_output": 9},
            {"input": [[5, 5, 5, 5], 4], "expected_output": 20},
            {"input": [[3, 0, 4, 1, 5], 3], "expected_output": 10},
            {"input": [[2, 8, 1, 1], 2], "expected_output": 10},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(visits, k):
                        total = sum(visits[:k])
                        best = total
                        for i in range(k, len(visits)):
                            total += visits[i] - visits[i - k]
                            best = max(best, total)
                        return best
                """),
                "wrong": _code("""
                    def solve(visits, k):
                        total = sum(visits[:k])
                        best = total
                        for i in range(k, len(visits) - 1):
                            total += visits[i] - visits[i - k]
                            best = max(best, total)
                        return best
                """),
                "wrong_explanation": (
                    "Off-by-one: the loop stops one hour early, so the final window is never considered. "
                    "It passes whenever the busiest stretch is somewhere earlier. Fix: loop to len(visits)."
                ),
            },
            "javascript": {
                "correct": _code("""
                    function solve(visits, k) {
                      let total = 0;
                      for (let i = 0; i < k; i++) {
                        total += visits[i];
                      }
                      let best = total;
                      for (let i = k; i < visits.length; i++) {
                        total += visits[i] - visits[i - k];
                        best = Math.max(best, total);
                      }
                      return best;
                    }
                """),
                "wrong": _code("""
                    function solve(visits, k) {
                      let total = 0;
                      for (let i = 0; i < k; i++) {
                        total += visits[i];
                      }
                      let best = total;
                      for (let i = k; i < visits.length - 1; i++) {
                        total += visits[i] - visits[i - k];
                        best = Math.max(best, total);
                      }
                      return best;
                    }
                """),
                "wrong_explanation": "Off-by-one: stops before the last window. Fix: loop while i < visits.length.",
            },
            "cpp": {
                "correct": _code("""
                    #include <algorithm>

                    int solve(vector<int> visits, int k) {
                        int total = 0;
                        for (int i = 0; i < k; i++) {
                            total += visits[i];
                        }
                        int best = total;
                        for (int i = k; i < (int)visits.size(); i++) {
                            total += visits[i] - visits[i - k];
                            best = max(best, total);
                        }
                        return best;
                    }
                """),
                "wrong": _code("""
                    #include <algorithm>

                    int solve(vector<int> visits, int k) {
                        int total = 0;
                        for (int i = 0; i < k; i++) {
                            total += visits[i];
                        }
                        int best = total;
                        for (int i = k; i < (int)visits.size() - 1; i++) {
                            total += visits[i] - visits[i - k];
                            best = max(best, total);
                        }
                        return best;
                    }
                """),
                "wrong_explanation": "Off-by-one: stops before the last window. Fix: loop while i < visits.size().",
            },
        },
    },
    {
        "key": "hard-longest-unique-run",
        "topic": "Sliding Window",
        "difficulty": "hard",
        "title": "Longest Run of Unique Characters",
        "description": (
            "Return the length of the longest contiguous stretch of text in which no character repeats."
        ),
        "examples": [
            {"input": 'text = "abcabcbb"', "output": "3", "explanation": '"abc".'},
            {
                "input": 'text = "abba"',
                "output": "2",
                "explanation": '"ab" or "ba" — the window\'s left edge must never move backwards.',
            },
            {"input": 'text = "pwwkew"', "output": "3", "explanation": '"wke".'},
        ],
        "constraints": ["1 <= len(text) <= 10^5", "text consists of lowercase English letters"],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": ["abcabcbb"], "expected_output": 3},
            {"input": ["bbbb"], "expected_output": 1},
            {"input": ["pwwkew"], "expected_output": 3},
            {"input": ["abba"], "expected_output": 2},
            {"input": ["tmmzuxt"], "expected_output": 5},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(text):
                        last_seen = {}
                        left = 0
                        best = 0
                        for right, ch in enumerate(text):
                            if ch in last_seen and last_seen[ch] >= left:
                                left = last_seen[ch] + 1
                            last_seen[ch] = right
                            best = max(best, right - left + 1)
                        return best
                """),
                "wrong": _code("""
                    def solve(text):
                        last_seen = {}
                        left = 0
                        best = 0
                        for right, ch in enumerate(text):
                            if ch in last_seen:
                                left = last_seen[ch] + 1
                            last_seen[ch] = right
                            best = max(best, right - left + 1)
                        return best
                """),
                "wrong_explanation": (
                    "Missed edge case: a character last seen BEFORE the current window can drag `left` "
                    "backwards (try \"abba\"), re-admitting a repeat into the window. It passes the common "
                    "examples and fails exactly that case. Fix: only move `left` when the last occurrence is "
                    "inside the window (last_seen[ch] >= left)."
                ),
            },
            "javascript": {
                "correct": _code("""
                    function solve(text) {
                      const lastSeen = new Map();
                      let left = 0;
                      let best = 0;
                      for (let right = 0; right < text.length; right++) {
                        const ch = text[right];
                        if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {
                          left = lastSeen.get(ch) + 1;
                        }
                        lastSeen.set(ch, right);
                        best = Math.max(best, right - left + 1);
                      }
                      return best;
                    }
                """),
                "wrong": _code("""
                    function solve(text) {
                      const lastSeen = new Map();
                      let left = 0;
                      let best = 0;
                      for (let right = 0; right < text.length; right++) {
                        const ch = text[right];
                        if (lastSeen.has(ch)) {
                          left = lastSeen.get(ch) + 1;
                        }
                        lastSeen.set(ch, right);
                        best = Math.max(best, right - left + 1);
                      }
                      return best;
                    }
                """),
                "wrong_explanation": (
                    "Lets `left` move backwards when the repeat was already outside the window. Fix: require "
                    "lastSeen.get(ch) >= left."
                ),
            },
            "cpp": {
                "correct": _code("""
                    #include <unordered_map>
                    #include <algorithm>

                    int solve(string text) {
                        unordered_map<char, int> lastSeen;
                        int left = 0;
                        int best = 0;
                        for (int right = 0; right < (int)text.size(); right++) {
                            char ch = text[right];
                            if (lastSeen.count(ch) && lastSeen[ch] >= left) {
                                left = lastSeen[ch] + 1;
                            }
                            lastSeen[ch] = right;
                            best = max(best, right - left + 1);
                        }
                        return best;
                    }
                """),
                "wrong": _code("""
                    #include <unordered_map>
                    #include <algorithm>

                    int solve(string text) {
                        unordered_map<char, int> lastSeen;
                        int left = 0;
                        int best = 0;
                        for (int right = 0; right < (int)text.size(); right++) {
                            char ch = text[right];
                            if (lastSeen.count(ch)) {
                                left = lastSeen[ch] + 1;
                            }
                            lastSeen[ch] = right;
                            best = max(best, right - left + 1);
                        }
                        return best;
                    }
                """),
                "wrong_explanation": (
                    "Lets `left` move backwards when the repeat was already outside the window. Fix: require "
                    "lastSeen[ch] >= left."
                ),
            },
        },
    },
    {
        "key": "hard-widest-water-tank",
        "topic": "Two Pointers",
        "difficulty": "hard",
        "title": "Widest Water Tank",
        "description": (
            "walls[i] is the height of a vertical wall at position i. Any two walls form a tank whose "
            "capacity is the distance between them multiplied by the shorter wall's height. Return the "
            "largest possible capacity."
        ),
        "examples": [
            {
                "input": "walls = [1, 8, 6, 2, 5, 4, 8, 3, 7]",
                "output": "49",
                "explanation": "Walls at positions 1 and 8: width 7 × height 7.",
            },
            {"input": "walls = [4, 3, 2, 1, 4]", "output": "16", "explanation": "The two outer walls: 4 × 4."},
            {"input": "walls = [1, 1]", "output": "1"},
        ],
        "constraints": ["2 <= len(walls) <= 10^5", "0 <= walls[i] <= 10^4"],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": [[1, 8, 6, 2, 5, 4, 8, 3, 7]], "expected_output": 49},
            {"input": [[1, 1]], "expected_output": 1},
            {"input": [[4, 3, 2, 1, 4]], "expected_output": 16},
            {"input": [[1, 2, 1]], "expected_output": 2},
            {"input": [[2, 3, 10, 5, 7, 8, 9]], "expected_output": 36},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(walls):
                        left, right = 0, len(walls) - 1
                        best = 0
                        while left < right:
                            width = right - left
                            best = max(best, width * min(walls[left], walls[right]))
                            if walls[left] < walls[right]:
                                left += 1
                            else:
                                right -= 1
                        return best
                """),
                "wrong": _code("""
                    def solve(walls):
                        left, right = 0, len(walls) - 1
                        best = 0
                        while left < right:
                            width = right - left
                            best = max(best, width * min(walls[left], walls[right]))
                            if walls[left] > walls[right]:
                                left += 1
                            else:
                                right -= 1
                        return best
                """),
                "wrong_explanation": (
                    "Moves the TALLER wall inward instead of the shorter one, so the short wall keeps capping "
                    "every later tank. It still passes symmetric inputs like [4, 3, 2, 1, 4]. Fix: move the "
                    "pointer at the shorter wall (flip the comparison)."
                ),
            },
            "javascript": {
                "correct": _code("""
                    function solve(walls) {
                      let left = 0;
                      let right = walls.length - 1;
                      let best = 0;
                      while (left < right) {
                        const width = right - left;
                        best = Math.max(best, width * Math.min(walls[left], walls[right]));
                        if (walls[left] < walls[right]) {
                          left++;
                        } else {
                          right--;
                        }
                      }
                      return best;
                    }
                """),
                "wrong": _code("""
                    function solve(walls) {
                      let left = 0;
                      let right = walls.length - 1;
                      let best = 0;
                      while (left < right) {
                        const width = right - left;
                        best = Math.max(best, width * Math.min(walls[left], walls[right]));
                        if (walls[left] > walls[right]) {
                          left++;
                        } else {
                          right--;
                        }
                      }
                      return best;
                    }
                """),
                "wrong_explanation": "Moves the taller wall inward instead of the shorter one. Fix: flip the comparison.",
            },
            "cpp": {
                "correct": _code("""
                    #include <algorithm>

                    int solve(vector<int> walls) {
                        int left = 0;
                        int right = (int)walls.size() - 1;
                        int best = 0;
                        while (left < right) {
                            int width = right - left;
                            best = max(best, width * min(walls[left], walls[right]));
                            if (walls[left] < walls[right]) {
                                left++;
                            } else {
                                right--;
                            }
                        }
                        return best;
                    }
                """),
                "wrong": _code("""
                    #include <algorithm>

                    int solve(vector<int> walls) {
                        int left = 0;
                        int right = (int)walls.size() - 1;
                        int best = 0;
                        while (left < right) {
                            int width = right - left;
                            best = max(best, width * min(walls[left], walls[right]));
                            if (walls[left] > walls[right]) {
                                left++;
                            } else {
                                right--;
                            }
                        }
                        return best;
                    }
                """),
                "wrong_explanation": "Moves the taller wall inward instead of the shorter one. Fix: flip the comparison.",
            },
        },
    },
    {
        "key": "hard-longest-balanced-ledger-run",
        "topic": "Hash Maps",
        "difficulty": "hard",
        "title": "Longest Balanced Ledger Run",
        "description": (
            "A ledger records daily balance changes, which can be negative. Return the length of the "
            "longest run of consecutive days whose changes add up exactly to k, or 0 if no such run exists."
        ),
        "examples": [
            {
                "input": "changes = [1, -1, 5, -2, 3], k = 3",
                "output": "4",
                "explanation": "Days 0-3: 1 - 1 + 5 - 2 = 3.",
            },
            {
                "input": "changes = [-2, -1, 2, 1], k = 1",
                "output": "2",
                "explanation": "Days 1-2: -1 + 2 = 1.",
            },
            {"input": "changes = [1, 2, 3], k = 7", "output": "0"},
        ],
        "constraints": [
            "1 <= len(changes) <= 10^5",
            "-10^4 <= changes[i] <= 10^4",
            "-10^9 <= k <= 10^9",
        ],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": [[1, -1, 5, -2, 3], 3], "expected_output": 4},
            {"input": [[-2, -1, 2, 1], 1], "expected_output": 2},
            {"input": [[1, 2, 3], 7], "expected_output": 0},
            {"input": [[3, 1, -1, 1, 2], 3], "expected_output": 4},
            {"input": [[0, 0, 0], 0], "expected_output": 3},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(changes, k):
                        first_index = {0: -1}
                        prefix = 0
                        best = 0
                        for i, change in enumerate(changes):
                            prefix += change
                            if prefix - k in first_index:
                                best = max(best, i - first_index[prefix - k])
                            if prefix not in first_index:
                                first_index[prefix] = i
                        return best
                """),
                "wrong": _code("""
                    def solve(changes, k):
                        first_index = {0: -1}
                        prefix = 0
                        best = 0
                        for i, change in enumerate(changes):
                            prefix += change
                            if prefix - k in first_index:
                                best = max(best, i - first_index[prefix - k])
                            first_index[prefix] = i
                        return best
                """),
                "wrong_explanation": (
                    "Overwrites each prefix sum's index on every occurrence, so it remembers the LATEST index "
                    "instead of the earliest — and the longest run needs the earliest. It passes when no "
                    "prefix sum repeats. Fix: only store a prefix the first time it appears."
                ),
            },
            "javascript": {
                "correct": _code("""
                    function solve(changes, k) {
                      const firstIndex = new Map([[0, -1]]);
                      let prefix = 0;
                      let best = 0;
                      for (let i = 0; i < changes.length; i++) {
                        prefix += changes[i];
                        if (firstIndex.has(prefix - k)) {
                          best = Math.max(best, i - firstIndex.get(prefix - k));
                        }
                        if (!firstIndex.has(prefix)) {
                          firstIndex.set(prefix, i);
                        }
                      }
                      return best;
                    }
                """),
                "wrong": _code("""
                    function solve(changes, k) {
                      const firstIndex = new Map([[0, -1]]);
                      let prefix = 0;
                      let best = 0;
                      for (let i = 0; i < changes.length; i++) {
                        prefix += changes[i];
                        if (firstIndex.has(prefix - k)) {
                          best = Math.max(best, i - firstIndex.get(prefix - k));
                        }
                        firstIndex.set(prefix, i);
                      }
                      return best;
                    }
                """),
                "wrong_explanation": "Overwrites the earliest index of each prefix sum. Fix: only set it the first time.",
            },
            "cpp": {
                "correct": _code("""
                    #include <unordered_map>
                    #include <algorithm>

                    int solve(vector<int> changes, int k) {
                        unordered_map<int, int> firstIndex;
                        firstIndex[0] = -1;
                        int prefix = 0;
                        int best = 0;
                        for (int i = 0; i < (int)changes.size(); i++) {
                            prefix += changes[i];
                            if (firstIndex.count(prefix - k)) {
                                best = max(best, i - firstIndex[prefix - k]);
                            }
                            if (!firstIndex.count(prefix)) {
                                firstIndex[prefix] = i;
                            }
                        }
                        return best;
                    }
                """),
                "wrong": _code("""
                    #include <unordered_map>
                    #include <algorithm>

                    int solve(vector<int> changes, int k) {
                        unordered_map<int, int> firstIndex;
                        firstIndex[0] = -1;
                        int prefix = 0;
                        int best = 0;
                        for (int i = 0; i < (int)changes.size(); i++) {
                            prefix += changes[i];
                            if (firstIndex.count(prefix - k)) {
                                best = max(best, i - firstIndex[prefix - k]);
                            }
                            firstIndex[prefix] = i;
                        }
                        return best;
                    }
                """),
                "wrong_explanation": "Overwrites the earliest index of each prefix sum. Fix: only set it the first time.",
            },
        },
    },
]


# ============================================================================
# CHALLENGE GATE — 3 problems for one demo roadmap node, Python only
# ============================================================================
# The real Challenge Gate is a 10-problem pool (4 easy / 4 medium / 2 hard)
# that must be fully cleared to complete a roadmap node. The demo keeps the
# same easy-to-hard progression at a presentable size: 1 easy, 1 medium,
# 1 hard. Solving all three completes the "Two Pointers" demo roadmap node
# through the real complete_roadmap_node path (real XP), which is also what
# unlocks Assessment 2 (see ASSESSMENTS below).
#
# Python only, to keep a 3-language authoring and verification matrix out of
# a section where the point being demonstrated is the gate mechanic itself.
CHALLENGE_NODE_KEY = "Two Pointers"

CHALLENGE_PROBLEMS = [
    {
        "difficulty": "easy",
        "title": "Unique Values in a Sorted Log",
        "description": (
            "values is sorted in non-decreasing order. Using two pointers, compact the unique values to "
            "the front of the list in place and return how many unique values there are."
        ),
        "examples": [
            {"input": "values = [1, 1, 2]", "output": "2"},
            {"input": "values = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]", "output": "5"},
            {"input": "values = [7]", "output": "1"},
        ],
        "constraints": ["0 <= len(values) <= 3 * 10^4", "values is sorted in non-decreasing order"],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": [[1, 1, 2]], "expected_output": 2},
            {"input": [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], "expected_output": 5},
            {"input": [[7]], "expected_output": 1},
            {"input": [[]], "expected_output": 0},
            {"input": [[2, 2, 2]], "expected_output": 1},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(values):
                        if not values:
                            return 0
                        slow = 0
                        for fast in range(1, len(values)):
                            if values[fast] != values[slow]:
                                slow += 1
                                values[slow] = values[fast]
                        return slow + 1
                """),
                "wrong": _code("""
                    def solve(values):
                        if not values:
                            return 0
                        slow = 0
                        for fast in range(1, len(values)):
                            if values[fast] != values[slow]:
                                slow += 1
                                values[slow] = values[fast]
                        return slow
                """),
                "wrong_explanation": (
                    "Off-by-one: `slow` is the INDEX of the last unique value, so the count is slow + 1. "
                    "Only the empty-list case passes."
                ),
            },
        },
    },
    {
        "difficulty": "medium",
        "title": "Palindrome With One Deletion",
        "description": (
            "Return 1 if text reads the same forwards and backwards after deleting at most one character, "
            "otherwise return 0."
        ),
        "examples": [
            {"input": 'text = "abca"', "output": "1", "explanation": "Delete 'b' or 'c'."},
            {"input": 'text = "abc"', "output": "0"},
            {"input": 'text = "eeeed"', "output": "1", "explanation": "Delete the final 'd'."},
        ],
        "constraints": ["1 <= len(text) <= 10^5", "text consists of lowercase English letters"],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": ["abca"], "expected_output": 1},
            {"input": ["racecar"], "expected_output": 1},
            {"input": ["abc"], "expected_output": 0},
            {"input": ["eeeed"], "expected_output": 1},
            {"input": ["cbbcc"], "expected_output": 1},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(text):
                        def is_palindrome(i, j):
                            while i < j:
                                if text[i] != text[j]:
                                    return False
                                i += 1
                                j -= 1
                            return True

                        left, right = 0, len(text) - 1
                        while left < right:
                            if text[left] != text[right]:
                                if is_palindrome(left + 1, right) or is_palindrome(left, right - 1):
                                    return 1
                                return 0
                            left += 1
                            right -= 1
                        return 1
                """),
                "wrong": _code("""
                    def solve(text):
                        def is_palindrome(i, j):
                            while i < j:
                                if text[i] != text[j]:
                                    return False
                                i += 1
                                j -= 1
                            return True

                        left, right = 0, len(text) - 1
                        while left < right:
                            if text[left] != text[right]:
                                if is_palindrome(left + 1, right):
                                    return 1
                                return 0
                            left += 1
                            right -= 1
                        return 1
                """),
                "wrong_explanation": (
                    "Missed case: on a mismatch it only tries deleting the LEFT character, never the right one, "
                    "so inputs like \"eeeed\" that need the right-hand deletion fail. Fix: try both sides."
                ),
            },
        },
    },
    {
        "difficulty": "hard",
        "title": "Rainwater Between Walls",
        "description": (
            "heights[i] is the height of a wall of width 1. After rain, water collects between taller walls. "
            "Return the total units of water trapped."
        ),
        "examples": [
            {"input": "heights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]", "output": "6"},
            {"input": "heights = [4, 2, 0, 3, 2, 5]", "output": "9"},
            {"input": "heights = [3, 0, 3]", "output": "3"},
        ],
        "constraints": ["1 <= len(heights) <= 2 * 10^4", "0 <= heights[i] <= 10^5"],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], "expected_output": 6},
            {"input": [[4, 2, 0, 3, 2, 5]], "expected_output": 9},
            {"input": [[3, 0, 3]], "expected_output": 3},
            {"input": [[1, 2, 3]], "expected_output": 0},
            {"input": [[5, 1, 1, 1, 4]], "expected_output": 9},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(heights):
                        left, right = 0, len(heights) - 1
                        left_max = right_max = 0
                        water = 0
                        while left < right:
                            if heights[left] < heights[right]:
                                left_max = max(left_max, heights[left])
                                water += left_max - heights[left]
                                left += 1
                            else:
                                right_max = max(right_max, heights[right])
                                water += right_max - heights[right]
                                right -= 1
                        return water
                """),
                "wrong": _code("""
                    def solve(heights):
                        left, right = 0, len(heights) - 1
                        left_max = right_max = 0
                        water = 0
                        while left < right:
                            if heights[left] < heights[right]:
                                water += left_max - heights[left]
                                left_max = max(left_max, heights[left])
                                left += 1
                            else:
                                water += right_max - heights[right]
                                right_max = max(right_max, heights[right])
                                right -= 1
                        return water
                """),
                "wrong_explanation": (
                    "Ordering bug: water is added BEFORE the running maximum is updated, so every new tallest "
                    "wall contributes negative water. Fix: update the maximum first, then add."
                ),
            },
        },
    },
]


# ============================================================================
# ASSESSMENTS — 2 fixed assessments, 3 questions each, Python only
# ============================================================================
# Served by /demo/assessments/*. Grading runs every question through the real
# run_submission; the integrity score is always recomputed server-side from
# demo_proctoring_logs with the real penalty weights; pass/flag/tier use the
# real assessment_service rules. Python only, matching the real assessment
# page, which is Python-only.
#
# unlock_rule — checked server-side on POST /demo/assessments/{key}/start
# (403 until met). Both rules mirror how the real system unlocks things: by
# completed ROADMAP progress, not by passing other assessments.
#   * assessment_1 mirrors a real cluster exactly: the real "Fundamentals"
#     cluster unlocks when Arrays AND Strings are completed on the roadmap.
#   * assessment_2 unlocks when the Two Pointers Challenge Gate is fully
#     solved. The alternative ("assessment_1 passed") was deliberately NOT
#     used: the real app never unlocks one assessment by passing another,
#     whereas clearing a challenge gate completes a roadmap node — the same
#     kind of event that unlocks every real cluster. It also gives the
#     presenter a strict, predictable order: roadmap -> Assessment 1 ->
#     Challenge Gate -> Assessment 2.
ASSESSMENTS = [
    {
        "key": "assessment_1",
        "name": "Fundamentals",
        "topics": ["Arrays", "Strings"],
        "unlock_rule": {
            "type": "roadmap_topics_completed",
            "topics": ["Arrays", "Strings"],
            "description": "Complete Arrays and Strings on the demo roadmap.",
        },
        "questions": [
            {
                "title": "Words Used Exactly Once",
                "description": (
                    "Return how many different words appear exactly once in sentence. Words are separated by "
                    "spaces and compared case-insensitively."
                ),
                "examples": [
                    {
                        "input": 'sentence = "the cat and the hat"',
                        "output": "3",
                        "explanation": "cat, and, hat.",
                    },
                    {
                        "input": 'sentence = "Go go GO"',
                        "output": "0",
                        "explanation": "All three are the same word.",
                    },
                ],
                "constraints": ["1 <= len(sentence) <= 10^4", "Comparison ignores letter case"],
                "expected_complexity": "O(n)",
                "test_cases": [
                    {"input": ["the cat and the hat"], "expected_output": 3},
                    {"input": ["Go go GO"], "expected_output": 0},
                    {"input": ["one two three"], "expected_output": 3},
                    {"input": ["a b a c b d"], "expected_output": 2},
                    {"input": ["Hello hello world"], "expected_output": 1},
                ],
                "solutions": {
                    "python": {
                        "correct": _code("""
                            def solve(sentence):
                                counts = {}
                                for word in sentence.lower().split():
                                    counts[word] = counts.get(word, 0) + 1
                                return sum(1 for c in counts.values() if c == 1)
                        """),
                        "wrong": _code("""
                            def solve(sentence):
                                counts = {}
                                for word in sentence.split():
                                    counts[word] = counts.get(word, 0) + 1
                                return sum(1 for c in counts.values() if c == 1)
                        """),
                        "wrong_explanation": (
                            "Missed requirement: compares words case-sensitively, so \"Go\" and \"go\" count as "
                            "different words. Fix: lowercase the sentence first."
                        ),
                    },
                },
            },
            {
                "title": "Second Highest Distinct Reading",
                "description": "Return the second highest DISTINCT value in readings, or -1 if there isn't one.",
                "examples": [
                    {"input": "readings = [4, 1, 7, 7, 3]", "output": "4", "explanation": "Distinct values: 7, 4, 3, 1."},
                    {"input": "readings = [5, 5, 5]", "output": "-1"},
                ],
                "constraints": ["1 <= len(readings) <= 10^5"],
                "expected_complexity": "O(n log n)",
                "test_cases": [
                    {"input": [[4, 1, 7, 7, 3]], "expected_output": 4},
                    {"input": [[5, 5, 5]], "expected_output": -1},
                    {"input": [[2, 9]], "expected_output": 2},
                    {"input": [[10, 8, 10, 9]], "expected_output": 9},
                ],
                "solutions": {
                    "python": {
                        "correct": _code("""
                            def solve(readings):
                                distinct = sorted(set(readings), reverse=True)
                                return distinct[1] if len(distinct) > 1 else -1
                        """),
                        "wrong": _code("""
                            def solve(readings):
                                ordered = sorted(readings, reverse=True)
                                return ordered[1] if len(ordered) > 1 else -1
                        """),
                        "wrong_explanation": (
                            "Missed requirement: duplicates aren't removed, so a repeated maximum is returned as "
                            "the \"second highest\". Fix: deduplicate with set() before sorting."
                        ),
                    },
                },
            },
            {
                "title": "Anagram Check",
                "description": (
                    "Return \"YES\" if first and second contain exactly the same letters the same number of "
                    "times (ignoring case), otherwise \"NO\"."
                ),
                "examples": [
                    {"input": 'first = "listen", second = "silent"', "output": '"YES"'},
                    {
                        "input": 'first = "aab", second = "abb"',
                        "output": '"NO"',
                        "explanation": "Same letters, different counts.",
                    },
                ],
                "constraints": ["1 <= len(first), len(second) <= 10^5", "letters only"],
                "expected_complexity": "O(n log n)",
                "test_cases": [
                    {"input": ["listen", "silent"], "expected_output": "YES"},
                    {"input": ["rat", "car"], "expected_output": "NO"},
                    {"input": ["aab", "abb"], "expected_output": "NO"},
                    {"input": ["Dormitory", "dirtyroom"], "expected_output": "YES"},
                    {"input": ["abc", "abcc"], "expected_output": "NO"},
                ],
                "solutions": {
                    "python": {
                        "correct": _code("""
                            def solve(first, second):
                                return "YES" if sorted(first.lower()) == sorted(second.lower()) else "NO"
                        """),
                        "wrong": _code("""
                            def solve(first, second):
                                return "YES" if set(first.lower()) == set(second.lower()) else "NO"
                        """),
                        "wrong_explanation": (
                            "Compares SETS of letters, which ignores how many times each letter appears, so "
                            "\"aab\" and \"abb\" look like anagrams. Fix: compare sorted letters (or counts)."
                        ),
                    },
                },
            },
        ],
    },
    {
        "key": "assessment_2",
        "name": "Lookups & Efficiency",
        "topics": ["Hash Maps", "Two Pointers"],
        "unlock_rule": {
            "type": "challenge_gate_passed",
            "node_key": CHALLENGE_NODE_KEY,
            "description": "Solve all 3 problems in the Two Pointers Challenge Gate.",
        },
        "questions": [
            {
                "title": "Two Readings That Sum to Target",
                "description": (
                    "Return the indices of the first pair of readings (in index order) that add up to target, "
                    "formatted as \"i,j\" with i < j. If no pair exists, return \"-1,-1\"."
                ),
                "examples": [
                    {"input": "nums = [2, 7, 11, 15], target = 9", "output": '"0,1"'},
                    {"input": "nums = [3, 3], target = 6", "output": '"0,1"'},
                ],
                "constraints": ["2 <= len(nums) <= 10^5", "An index cannot be used twice"],
                "expected_complexity": "O(n)",
                "test_cases": [
                    {"input": [[2, 7, 11, 15], 9], "expected_output": "0,1"},
                    {"input": [[3, 2, 4], 6], "expected_output": "1,2"},
                    {"input": [[3, 3], 6], "expected_output": "0,1"},
                    {"input": [[1, 2, 3], 7], "expected_output": "-1,-1"},
                ],
                "solutions": {
                    "python": {
                        "correct": _code("""
                            def solve(nums, target):
                                index_of = {}
                                for i, x in enumerate(nums):
                                    if target - x in index_of:
                                        return f"{index_of[target - x]},{i}"
                                    index_of[x] = i
                                return "-1,-1"
                        """),
                        "wrong": _code("""
                            def solve(nums, target):
                                index_of = {}
                                for i, x in enumerate(nums):
                                    index_of[x] = i
                                    if target - x in index_of:
                                        return f"{index_of[target - x]},{i}"
                                return "-1,-1"
                        """),
                        "wrong_explanation": (
                            "Ordering bug: stores the current index before checking, so a value can pair with "
                            "itself (answering \"0,0\"). Fix: check for the complement first, then store."
                        ),
                    },
                },
            },
            {
                "title": "Closest Pair Sum in Sorted Prices",
                "description": (
                    "values is sorted ascending. Using two pointers, return the sum of two different values "
                    "that is closest to target. If two sums are equally close, keep the one found first."
                ),
                "examples": [
                    {"input": "values = [1, 3, 4, 7, 10], target = 15", "output": "14", "explanation": "4 + 10."},
                    {"input": "values = [5, 6], target = 1", "output": "11"},
                ],
                "constraints": ["2 <= len(values) <= 10^5", "values is sorted ascending"],
                "expected_complexity": "O(n)",
                "test_cases": [
                    {"input": [[1, 3, 4, 7, 10], 15], "expected_output": 14},
                    {"input": [[1, 2, 3, 4], 10], "expected_output": 7},
                    {"input": [[5, 6], 1], "expected_output": 11},
                    {"input": [[1, 4, 6, 9], 11], "expected_output": 10},
                    {"input": [[2, 5, 8, 12], 14], "expected_output": 14},
                ],
                "solutions": {
                    "python": {
                        "correct": _code("""
                            def solve(values, target):
                                left, right = 0, len(values) - 1
                                best = values[left] + values[right]
                                while left < right:
                                    total = values[left] + values[right]
                                    if abs(total - target) < abs(best - target):
                                        best = total
                                    if total < target:
                                        left += 1
                                    elif total > target:
                                        right -= 1
                                    else:
                                        return total
                                return best
                        """),
                        "wrong": _code("""
                            def solve(values, target):
                                left, right = 0, len(values) - 1
                                best = values[left] + values[right]
                                while left < right:
                                    total = values[left] + values[right]
                                    if abs(total - target) < abs(best - target):
                                        best = total
                                    if total < target:
                                        right -= 1
                                    else:
                                        left += 1
                                return best
                        """),
                        "wrong_explanation": (
                            "Moves the wrong pointer: when the sum is too SMALL it shrinks the larger value, making "
                            "the sum even smaller. Fix: a sum below target moves `left` up; above target moves "
                            "`right` down."
                        ),
                    },
                },
            },
            {
                "title": "Longest Consecutive Streak",
                "description": (
                    "Return the length of the longest sequence of consecutive integers that can be formed from "
                    "the values in nums, in any order. Duplicates don't extend a streak."
                ),
                "examples": [
                    {
                        "input": "nums = [100, 4, 200, 1, 3, 2]",
                        "output": "4",
                        "explanation": "1, 2, 3, 4.",
                    },
                    {"input": "nums = [1, 2, 0, 1]", "output": "3", "explanation": "0, 1, 2."},
                ],
                "constraints": ["0 <= len(nums) <= 10^5"],
                "expected_complexity": "O(n)",
                "test_cases": [
                    {"input": [[100, 4, 200, 1, 3, 2]], "expected_output": 4},
                    {"input": [[1, 2, 0, 1]], "expected_output": 3},
                    {"input": [[]], "expected_output": 0},
                    {"input": [[5]], "expected_output": 1},
                    {"input": [[9, 1, 4, 7, 3, 2, 2, 5]], "expected_output": 5},
                ],
                "solutions": {
                    "python": {
                        "correct": _code("""
                            def solve(nums):
                                values = set(nums)
                                best = 0
                                for x in values:
                                    if x - 1 not in values:
                                        length = 1
                                        while x + length in values:
                                            length += 1
                                        best = max(best, length)
                                return best
                        """),
                        "wrong": _code("""
                            def solve(nums):
                                if not nums:
                                    return 0
                                ordered = sorted(nums)
                                best = current = 1
                                for i in range(1, len(ordered)):
                                    if ordered[i] == ordered[i - 1] + 1:
                                        current += 1
                                        best = max(best, current)
                                    else:
                                        current = 1
                                return best
                        """),
                        "wrong_explanation": (
                            "Missed edge case: a duplicate value resets the streak (in [0, 1, 1, 2] the second 1 "
                            "breaks it), so streaks containing repeats come out too short. Fix: deduplicate "
                            "first, or skip equal neighbours without resetting."
                        ),
                    },
                },
            },
        ],
    },
]


# ============================================================================
# MOCK INTERVIEW TOPICS — 3 fixed topics, one question each, Python only
# ============================================================================
# POST /demo/interview/start takes one of these topic names (case-insensitive)
# and always serves that topic's single question. Python only, matching the
# real Mock Interview page, which has no language switcher.
MOCK_INTERVIEW_TOPICS = [
    {
        "topic": "Arrays",
        "difficulty": "easy",
        "title": "Merge Two Sorted Lists",
        "description": "a and b are each sorted ascending. Return a single list containing every value from both, sorted.",
        "examples": [
            {"input": "a = [1, 3, 5], b = [2, 4, 6]", "output": "[1, 2, 3, 4, 5, 6]"},
            {"input": "a = [], b = [1]", "output": "[1]"},
        ],
        "constraints": ["0 <= len(a), len(b) <= 10^4", "a and b are sorted ascending"],
        "expected_complexity": "O(n + m)",
        "test_cases": [
            {"input": [[1, 3, 5], [2, 4, 6]], "expected_output": [1, 2, 3, 4, 5, 6]},
            {"input": [[], [1]], "expected_output": [1]},
            {"input": [[1, 1], [1]], "expected_output": [1, 1, 1]},
            {"input": [[0, 9], [1, 2, 3]], "expected_output": [0, 1, 2, 3, 9]},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(a, b):
                        merged = []
                        i = j = 0
                        while i < len(a) and j < len(b):
                            if a[i] <= b[j]:
                                merged.append(a[i])
                                i += 1
                            else:
                                merged.append(b[j])
                                j += 1
                        merged.extend(a[i:])
                        merged.extend(b[j:])
                        return merged
                """),
                "wrong": _code("""
                    def solve(a, b):
                        merged = []
                        i = j = 0
                        while i < len(a) and j < len(b):
                            if a[i] <= b[j]:
                                merged.append(a[i])
                                i += 1
                            else:
                                merged.append(b[j])
                                j += 1
                        merged.extend(a[i:])
                        return merged
                """),
                "wrong_explanation": (
                    "Forgets the leftover tail of b, so whenever a runs out first the rest of b is dropped. "
                    "Fix: extend with b[j:] as well."
                ),
            },
        },
    },
    {
        "topic": "Strings",
        "difficulty": "medium",
        "title": "Balanced Brackets",
        "description": (
            "text contains only the characters ()[]{}. Return \"YES\" if every bracket is closed by the "
            "matching type in the correct order, otherwise \"NO\"."
        ),
        "examples": [
            {"input": 'text = "()[]{}"', "output": '"YES"'},
            {"input": 'text = "([)]"', "output": '"NO"'},
        ],
        "constraints": ["1 <= len(text) <= 10^4", "text contains only ()[]{}"],
        "expected_complexity": "O(n)",
        "test_cases": [
            {"input": ["()[]{}"], "expected_output": "YES"},
            {"input": ["([)]"], "expected_output": "NO"},
            {"input": ["{[]}"], "expected_output": "YES"},
            {"input": ["(("], "expected_output": "NO"},
            {"input": ["{{}"], "expected_output": "NO"},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(text):
                        pairs = {")": "(", "]": "[", "}": "{"}
                        stack = []
                        for ch in text:
                            if ch in pairs:
                                if not stack or stack.pop() != pairs[ch]:
                                    return "NO"
                            else:
                                stack.append(ch)
                        return "YES" if not stack else "NO"
                """),
                "wrong": _code("""
                    def solve(text):
                        pairs = {")": "(", "]": "[", "}": "{"}
                        stack = []
                        for ch in text:
                            if ch in pairs:
                                if not stack or stack.pop() != pairs[ch]:
                                    return "NO"
                            else:
                                stack.append(ch)
                        return "YES"
                """),
                "wrong_explanation": (
                    "Missed edge case: never checks for brackets still open at the end, so \"((\" is accepted. "
                    "Fix: only answer YES if the stack is empty."
                ),
            },
        },
    },
    {
        "topic": "Hash Maps",
        "difficulty": "medium",
        "title": "Count Anagram Groups",
        "description": "Return how many groups of anagrams the list of words forms. Words in a group use exactly the same letters.",
        "examples": [
            {
                "input": 'words = ["eat", "tea", "tan", "ate", "nat", "bat"]',
                "output": "3",
                "explanation": "{eat, tea, ate}, {tan, nat}, {bat}.",
            },
            {"input": 'words = ["aab", "abb", "bab"]', "output": "2", "explanation": "{aab}, {abb, bab}."},
        ],
        "constraints": ["1 <= len(words) <= 10^4", "words contain lowercase letters only"],
        "expected_complexity": "O(n * k log k)",
        "test_cases": [
            {"input": [["eat", "tea", "tan", "ate", "nat", "bat"]], "expected_output": 3},
            {"input": [["a"]], "expected_output": 1},
            {"input": [["aab", "abb", "bab"]], "expected_output": 2},
            {"input": [["abc", "aabbcc", "cab"]], "expected_output": 2},
            {"input": [["listen", "silent", "enlist", "google"]], "expected_output": 2},
        ],
        "solutions": {
            "python": {
                "correct": _code("""
                    def solve(words):
                        groups = {}
                        for word in words:
                            key = "".join(sorted(word))
                            groups[key] = groups.get(key, 0) + 1
                        return len(groups)
                """),
                "wrong": _code("""
                    def solve(words):
                        groups = {}
                        for word in words:
                            key = "".join(sorted(set(word)))
                            groups[key] = groups.get(key, 0) + 1
                        return len(groups)
                """),
                "wrong_explanation": (
                    "Builds the key from the SET of letters, so words with the same letters in different "
                    "amounts (\"aab\" vs \"abb\") land in one group. Fix: sort every letter, duplicates included."
                ),
            },
        },
    },
]


# ============================================================================
# SEEDED EXAMPLES — created once on first activation
# ============================================================================
# One example "How others solved this" comment per practice problem, authored
# by a demo cohort account (DEMO_COHORT key). Gives the discussion panel
# something real to show before the presenter posts.
EXAMPLE_DISCUSSION_COMMENTS = {
    "easy-first-repeated-reading": ("student-a", "A set made this O(n) for me. With a list it timed out on big inputs."),
    "easy-reverse-word-order": ("student-b", "split() with no argument handles the repeated spaces for free."),
    "easy-largest-temperature-rise": ("student-c", "Tracking the lowest reading so far means one pass is enough."),
    "medium-pairs-that-hit-target": ("student-a", "Look up the complement BEFORE recording the current number."),
    "medium-affordable-gift-pairs": ("student-c", "After sorting, every index between left and right pairs with left."),
    "medium-busiest-stretch-of-hours": ("student-b", "Add the entering hour, subtract the leaving hour — no re-summing."),
    "hard-longest-unique-run": ("student-c", "The \"abba\" case caught me: never let the left edge move backwards."),
    "hard-widest-water-tank": ("student-a", "Always move the shorter wall; moving the taller one can't help."),
    "hard-longest-balanced-ledger-run": ("student-b", "Store only the FIRST index of each prefix sum."),
}

# The example teacher comment for My Submissions. On first activation the
# owner gets one example submission of this problem, graded for real through
# run_submission using its correct solution, with this comment attached. (If
# Piston is unreachable at activation, this is skipped and retried on the
# next activation — it is never faked.)
EXAMPLE_TEACHER_COMMENT = {
    "problem_key": "easy-largest-temperature-rise",
    "language": "python",
    "comment": (
        "Clean single pass. Nice touch starting best at 0 so falling temperatures return 0 — that's the "
        "edge case most submissions miss."
    ),
}


# ============================================================================
# INTEGRITY TESTING GUIDE — shown inline on the active demo assessment page
# ============================================================================
# Served with GET /demo/assessments so the in-app guide and docs/demo.md come
# from the same text. event_type values match the real detectors and the real
# INTEGRITY_EVENT_PENALTIES keys in assessment_service.py.
INTEGRITY_TESTING_GUIDE = [
    {
        "event_type": "tab_switch",
        "label": "Tab switching",
        "how_to_trigger": "Switch to another browser tab or window, then come back.",
    },
    {
        "event_type": "paste",
        "label": "Large paste",
        "how_to_trigger": "Paste a block of 30 or more characters into the code editor.",
    },
    {
        "event_type": "camera_alert",
        "label": "Camera disabled / no face",
        "how_to_trigger": "Cover the camera, turn it off, or step out of frame for a few seconds.",
    },
    {
        "event_type": "keystroke_alert",
        "label": "Unusual typing rhythm",
        "how_to_trigger": (
            "Type a long run of characters at a fast, perfectly even pace (for example, hold one key down), "
            "which looks like scripted input rather than human typing."
        ),
    },
]


# ============================================================================
# LOOKUP HELPERS
# ============================================================================

def get_practice_problem(problem_key: str) -> dict | None:
    return next((p for p in PRACTICE_PROBLEMS if p["key"] == problem_key), None)


def get_assessment(assessment_key: str) -> dict | None:
    return next((a for a in ASSESSMENTS if a["key"] == assessment_key), None)


def get_interview_topic(topic: str) -> dict | None:
    """Case-insensitive, whitespace-tolerant match on the topic name."""
    wanted = (topic or "").strip().lower()
    return next((t for t in MOCK_INTERVIEW_TOPICS if t["topic"].lower() == wanted), None)


def get_cohort_member(member_key: str) -> dict | None:
    return next((m for m in DEMO_COHORT if m["key"] == member_key), None)
