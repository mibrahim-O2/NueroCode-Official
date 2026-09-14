"""Builds the dashboard analytics payload — activity heatmap, per-topic solved
counts and XP progression — from rows that have already been fetched.

Extracted from profile_routes.get_user_charts with no behavior change, so
the SAME chart logic serves two data sources:
  * the real dashboard (GET /profile/analytics/user-charts), fed from the
    real submissions + roadmap_nodes tables, and
  * the Demo Mode dashboard (GET /demo/dashboard/charts), fed from the
    separate demo_submissions + demo_roadmap_progress tables.
Only where the rows come from differs; how rows become charts never forks.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from app.database.repositories import _parse_timestamp

# Bounded to the last ~12 months — the exact window the activity heatmap
# renders — so a very heavy user can never make the submissions query grow
# without limit. Shared so the demo dashboard queries the same window.
CHARTS_WINDOW_DAYS = 372
CHARTS_ROW_LIMIT = 2000


def charts_window_start() -> str:
    return (datetime.now(timezone.utc) - timedelta(days=CHARTS_WINDOW_DAYS)).isoformat()


def empty_charts_response(total_xp: int = 0, level: int = 1) -> Dict[str, Any]:
    return {
        "heatmap": [],
        "practice": [],
        "progression": [],
        "current_xp": total_xp,
        "level": level,
    }


def build_user_charts(user_data: dict, submissions: list[dict], completed_nodes: list[dict]) -> Dict[str, Any]:
    """user_data needs xp, level and created_at; each submission needs
    created_at, topic and execution_result; each completed node needs
    completed_at and xp_earned."""
    total_xp = int(user_data.get("xp") or 0)
    current_level = int(user_data.get("level") or max(1, total_xp // 100 + 1))
    account_created_at = user_data.get("created_at")

    # Activity heatmap + per-topic solved counts come from submissions.
    # Every attempt counts toward the activity heatmap (that's just "were
    # they working"); only genuinely passing attempts count toward the
    # per-topic solved total. Pass/fail truth lives in execution_result
    # (the same field has_passing_submission() in repositories.py trusts),
    # NOT in verdict/status/xp_awarded/is_passed columns, which submissions
    # are never actually written with by create_submission().
    activity_map: Dict[str, int] = {}
    topic_map: Dict[str, int] = {}

    for sub in submissions:
        raw_dt = sub.get("created_at")
        if not raw_dt:
            continue
        date_str = str(raw_dt).split("T")[0].split(" ")[0]

        activity_map[date_str] = activity_map.get(date_str, 0) + 1

        passed = bool((sub.get("execution_result") or {}).get("all_passed"))
        if passed:
            topic = sub.get("topic") or "General"
            topic_map[topic] = topic_map.get(topic, 0) + 1

    heatmap_data = [{"date": k, "count": v} for k, v in sorted(activity_map.items())]
    practice_data = [
        {"topic": k, "solved": v}
        for k, v in sorted(topic_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # XP progression timeline. XP is only ever granted when a roadmap
    # node is completed (see complete_roadmap_node -> update_user_progress
    # in repositories.py) — there is no per-submission XP award anywhere
    # in this codebase. So the real chronological XP timeline comes from
    # completed nodes' completed_at + xp_earned, grouped and summed by day,
    # not from submissions.
    progression = []
    today_dt = datetime.now(timezone.utc)
    completed_nodes = [n for n in completed_nodes if n.get("completed_at")]

    if completed_nodes:
        # Group same-day completions together so two topics finished on
        # the same day produce one point, not two overlapping ones.
        daily_xp_gain: Dict[str, int] = {}
        for node in completed_nodes:
            date_str = str(node["completed_at"]).split("T")[0].split(" ")[0]
            daily_xp_gain[date_str] = daily_xp_gain.get(date_str, 0) + int(node.get("xp_earned") or 0)

        running_xp = 0
        for d_str in sorted(daily_xp_gain.keys()):
            running_xp += daily_xp_gain[d_str]
            dt = datetime.strptime(d_str, "%Y-%m-%d")
            progression.append({
                "date": dt.strftime("%b %d, %Y"),
                "shortDay": dt.strftime("%b %d"),
                "xp": running_xp,
                "level": max(1, running_xp // 100 + 1),
            })

        # Covers XP granted outside node completion (admin adjustments,
        # test-mode stat sets) so the line still reaches the user's real
        # current total instead of silently under-reporting it.
        if running_xp < total_xp:
            progression.append({
                "date": f"Today ({today_dt.strftime('%b %d')})",
                "shortDay": "Today",
                "xp": total_xp,
                "level": current_level,
            })
    else:
        start_date_label = "Joined"
        if account_created_at:
            try:
                acc_dt = _parse_timestamp(str(account_created_at))
                start_date_label = acc_dt.strftime("%b %d")
            except Exception:
                pass

        progression = [
            {
                "date": f"Start ({start_date_label})",
                "shortDay": start_date_label,
                "xp": 0,
                "level": 1,
            },
            {
                "date": f"Today ({today_dt.strftime('%b %d')})",
                "shortDay": "Today",
                "xp": total_xp,
                "level": current_level,
            },
        ]

    return {
        "heatmap": heatmap_data,
        "practice": practice_data,
        "progression": progression,
        "current_xp": total_xp,
        "level": current_level,
    }
