"""Computed on-demand from existing roadmap/submission timestamps — no
background job system exists in NeuroCode (a deliberate architectural
fact noted during FYP-2 planning), so this runs synchronously whenever
Dashboard loads rather than via a scheduled task."""

from datetime import datetime, timezone

from app.config.settings import settings
from app.database.repositories import get_roadmap_for_user, get_last_submission_date_for_topic


def get_due_reviews(user_id: str) -> list[dict]:
    nodes = get_roadmap_for_user(user_id)
    due = []
    now = datetime.now(timezone.utc)

    for node in nodes:
        if node["status"] != "completed" or not node.get("completed_at"):
            continue
        completed_at = datetime.fromisoformat(node["completed_at"].replace("Z", "+00:00"))
        days_since_completion = (now - completed_at).days
        if days_since_completion < settings.REVIEW_DUE_DAYS:
            continue

        last_practice = get_last_submission_date_for_topic(user_id, node["topic"])
        if last_practice:
            days_since_practice = (now - last_practice).days
            if days_since_practice < settings.REVIEW_DUE_DAYS:
                continue  # actively practicing this topic — don't nag

        due.append({"topic": node["topic"], "days_since_completion": days_since_completion})

    return due