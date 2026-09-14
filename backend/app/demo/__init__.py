"""Demo Mode package.

Holds the fixed, hand-authored content for Demo Mode (demo_content.py) and
the script that proves every "correct" solution genuinely passes — and every
"wrong" one genuinely fails — through the real Piston grading pipeline
(verify_demo_content.py).

Only WHAT problem or question exists is demo-specific. Everything that
grades, analyzes, scores or awards lives in the real services and is reused
unchanged by app/services/demo_service.py.
"""
