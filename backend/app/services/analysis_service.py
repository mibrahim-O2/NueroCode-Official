"""Orchestrates post-submission analysis: complexity/anti-pattern detection,
AI-generated feedback, ChromaDB embedding storage, and roadmap reordering
when a detected gap maps to a specific upcoming topic.
"""

from app.ai.code_analysis import analyze_code
from app.ai.provider_factory import get_ai_provider
from app.database.chroma_client import submissions_collection
from app.database.repositories import promote_roadmap_topic, update_submission_analysis

TOPIC_FIX_MAP = {
    "count_in_loop": "Hash Maps",
    "linear_membership_check": "Hash Maps",
}

FEEDBACK_SYSTEM_PROMPT = """You are a supportive coding mentor for NeuroCode, an educational \
platform. Given a static analysis of a student's submitted solution, write brief, encouraging, \
specific feedback (2-4 sentences). If issues were found, explain the concrete inefficiency in \
plain language and suggest the fix — do not just repeat the technical labels. If no issues were \
found (O(n) or better, no anti-patterns), give genuine positive feedback about their approach. \
Never mention that you are an AI or that this is automated. Speak directly to the student as \
"you"."""


def _build_feedback_prompt(topic: str, difficulty: str, analysis: dict, all_tests_passed: bool) -> str:
    patterns_text = (
        "; ".join(p["message"] for p in analysis["anti_patterns"])
        if analysis["anti_patterns"]
        else "none detected"
    )
    return (
        f"Topic: {topic}\n"
        f"Difficulty: {difficulty}\n"
        f"Tests passed: {all_tests_passed}\n"
        f"Detected complexity: {analysis['complexity']}\n"
        f"Detected inefficiencies: {patterns_text}\n\n"
        f"Write feedback for the student."
    )


def analyze_submission(
    submission_id: str,
    user_id: str,
    topic: str,
    difficulty: str,
    language: str,
    source_code: str,
    all_tests_passed: bool,
) -> dict:
    analysis = analyze_code(source_code, language)

    provider = get_ai_provider()
    feedback = provider.generate(
        FEEDBACK_SYSTEM_PROMPT,
        _build_feedback_prompt(topic, difficulty, analysis, all_tests_passed),
        max_tokens=300,
    )

    update_submission_analysis(
        submission_id=submission_id,
        complexity=analysis["complexity"],
        detected_patterns={
            "anti_patterns": analysis["anti_patterns"],
            "max_loop_depth": analysis["max_loop_depth"],
        },
        ai_feedback=feedback,
    )

    try:
        submissions_collection().add(
            ids=[submission_id],
            documents=[source_code],
            metadatas=[{
                "user_id": user_id,
                "topic": topic,
                "difficulty": difficulty,
                "language": language,
                "complexity": analysis["complexity"],
            }],
        )
    except Exception:
        # Embedding storage feeds Phase 10's recommendation engine — it's
        # supplementary and should never fail the submission response.
        pass

    reordered_topic = None
    for pattern in analysis["anti_patterns"]:
        fix_topic = TOPIC_FIX_MAP.get(pattern["key"])
        if not fix_topic or fix_topic == topic:
            continue
        if promote_roadmap_topic(user_id, current_topic=topic, target_topic=fix_topic):
            reordered_topic = fix_topic
            break

    return {
        "complexity": analysis["complexity"],
        "anti_patterns": analysis["anti_patterns"],
        "feedback": feedback,
        "reordered_topic": reordered_topic,
    }