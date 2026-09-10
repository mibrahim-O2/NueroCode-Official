"""Adaptive roadmap recommendation: combines the student's recent
submission performance with ChromaDB topic-concept embeddings to
recommend which locked roadmap topic to prioritize next.

Falls back to straight positional order when there's no struggle signal
yet — a student with no failed/inefficient submissions gets "continue
in order," not a fabricated recommendation.
"""

import logging

from sklearn.metrics.pairwise import cosine_similarity

from app.database.chroma_client import roadmap_collection, get_embedding_fn
from app.database.repositories import get_roadmap_for_user, get_recent_submissions

logger = logging.getLogger(__name__)

# Must match the topic names seeded in roadmap_nodes (Phase 6's DEFAULT_TOPICS).
TOPIC_CONCEPTS = {
    "Arrays": "Contiguous indexed storage, iteration, in-place updates, basic traversal patterns.",
    "Strings": "Character sequences, substring operations, pattern matching, immutability considerations.",
    "Hash Maps": "O(1) average lookups, key-value storage, avoiding repeated linear scans, frequency counting.",
    "Two Pointers": "Two indices moving through a sequence, sorted-array techniques, avoiding nested loops for pair problems.",
    "Sliding Window": "Maintaining a contiguous subrange efficiently, avoiding recomputation across overlapping subarrays.",
    "Stacks & Queues": "LIFO/FIFO ordering, matching and balancing problems, monotonic stack techniques.",
    "Recursion & Backtracking": "Breaking problems into subproblems, base cases, exploring and undoing choices.",
    "Trees": "Hierarchical structures, traversal orders, recursive tree processing.",
    "Graphs": "Nodes and edges, BFS/DFS traversal, connectivity and shortest-path reasoning.",
    "Dynamic Programming": "Overlapping subproblems, memoization, building solutions from smaller solved subproblems.",
}


def _ensure_roadmap_concepts_seeded() -> None:
    collection = roadmap_collection()
    if collection.count() >= len(TOPIC_CONCEPTS):
        return
    collection.upsert(ids=list(TOPIC_CONCEPTS.keys()), documents=list(TOPIC_CONCEPTS.values()))


def _build_struggle_text(submissions: list[dict]) -> str | None:
    struggle_signals = []
    for s in submissions:
        execution_result = s.get("execution_result") or {}
        detected_patterns = s.get("detected_patterns") or {}
        anti_patterns = detected_patterns.get("anti_patterns") or []
        failed = not execution_result.get("all_passed", True)
        if failed or anti_patterns:
            pattern_text = " ".join(p.get("message", "") for p in anti_patterns)
            struggle_signals.append(f"{s.get('topic', '')} {s.get('complexity', '')} {pattern_text}")
    return " ".join(struggle_signals) if struggle_signals else None


def _positional_recommendation(locked_nodes: list[dict]) -> dict:
    """The default 'continue in order' recommendation — used when there's
    no struggle signal yet, and also as the graceful fallback if the
    ChromaDB-backed similarity path is unavailable."""
    next_node = min(locked_nodes, key=lambda n: n["position"])
    return {
        "recommended_topic": next_node["topic"],
        "reason": "You're on track — continue with your roadmap in order.",
        "confidence": None,
    }


def recommend_next_topic(user_id: str) -> dict:
    nodes = get_roadmap_for_user(user_id)
    locked_nodes = [n for n in nodes if n["status"] == "locked"]

    if not locked_nodes:
        return {"recommended_topic": None, "reason": "No upcoming topics left to recommend.", "confidence": None}

    recent_submissions = get_recent_submissions(user_id, limit=10)
    struggle_text = _build_struggle_text(recent_submissions)

    if not struggle_text:
        return _positional_recommendation(locked_nodes)

    # Any ChromaDB / embedding failure degrades to the positional
    # recommendation rather than 500-ing the endpoint (analysis_service
    # and chatbot_service already swallow Chroma errors the same way).
    try:
        _ensure_roadmap_concepts_seeded()

        embedder = get_embedding_fn()
        query_vector = embedder([struggle_text])[0]

        locked_topics = [n["topic"] for n in locked_nodes]
        concept_data = roadmap_collection().get(ids=locked_topics, include=["embeddings"])
        available_ids = concept_data.get("ids", [])
        available_vectors = concept_data.get("embeddings", [])

        if not available_ids:
            return _positional_recommendation(locked_nodes)

        similarities = cosine_similarity([query_vector], available_vectors)[0]
        best_index = int(similarities.argmax())
        best_topic = available_ids[best_index]
    except Exception:
        logger.warning("recommendation: ChromaDB path failed, falling back to positional order", exc_info=True)
        return _positional_recommendation(locked_nodes)

    return {
        "recommended_topic": best_topic,
        "reason": (
            f"Your recent submissions suggest {best_topic} would directly help with patterns "
            "you've been running into."
        ),
        "confidence": round(float(similarities[best_index]), 3),
    }