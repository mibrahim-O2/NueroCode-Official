"""Small shared constants with no dependencies of their own.

Kept in a leaf module so both analysis_service.py and assessment_service.py
can import TOPIC_FIX_MAP at module load time without creating an import
cycle between the two services.
"""

# Maps a detected anti-pattern key (from app/ai/code_analysis.py) to the
# roadmap topic that most directly addresses it.
TOPIC_FIX_MAP = {
    "count_in_loop": "Hash Maps",
    "linear_membership_check": "Hash Maps",
}
