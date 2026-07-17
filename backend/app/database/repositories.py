from app.services.supabase_service import supabase


# --- Roadmap -----------------------------------------------------------

def create_roadmap_node(user_id: str, topic: str, difficulty: str, position: int) -> dict:
    data = {
        "user_id": user_id,
        "topic": topic,
        "difficulty": difficulty,
        "status": "locked",
        "position": position,
        "xp_earned": 0,
    }
    return supabase.table("roadmap_nodes").insert(data).execute().data[0]


def get_roadmap_for_user(user_id: str) -> list[dict]:
    return (
        supabase.table("roadmap_nodes")
        .select("*")
        .eq("user_id", user_id)
        .order("position")
        .execute()
        .data
    )


# --- Submissions ---------------------------------------------------------

def create_submission(user_id: str, language: str, topic: str, difficulty: str, source_code: str,
                       execution_result: dict | None = None, complexity: str | None = None,
                       detected_patterns: dict | None = None, ai_feedback: str | None = None) -> dict:
    data = {
        "user_id": user_id,
        "language": language,
        "topic": topic,
        "difficulty": difficulty,
        "source_code": source_code,
        "execution_result": execution_result,
        "complexity": complexity,
        "detected_patterns": detected_patterns,
        "ai_feedback": ai_feedback,
    }
    return supabase.table("submissions").insert(data).execute().data[0]


# --- Assessments -----------------------------------------------------------

def create_assessment(user_id: str, topic_cluster: str, generated_question: dict) -> dict:
    data = {
        "user_id": user_id,
        "topic_cluster": topic_cluster,
        "generated_question": generated_question,
        "status": "in_progress",
    }
    return supabase.table("assessments").insert(data).execute().data[0]


def complete_assessment(assessment_id: str, submitted_code: str, execution_result: dict,
                         assessment_score: float, integrity_score: float, duration: int) -> dict:
    data = {
        "submitted_code": submitted_code,
        "execution_result": execution_result,
        "assessment_score": assessment_score,
        "integrity_score": integrity_score,
        "duration": duration,
        "status": "completed",
    }
    return supabase.table("assessments").update(data).eq("id", assessment_id).execute().data[0]


# --- Credentials -----------------------------------------------------------

def create_credential(user_id: str, assessment_id: str, badge_level: str, topics_mastered: list,
                       assessment_score: float, integrity_score: float, qr_code: str | None = None) -> dict:
    data = {
        "user_id": user_id,
        "assessment_id": assessment_id,
        "badge_level": badge_level,
        "topics_mastered": topics_mastered,
        "assessment_score": assessment_score,
        "integrity_score": integrity_score,
        "qr_code": qr_code,
    }
    return supabase.table("credentials").insert(data).execute().data[0]


def get_credential_by_verify_uuid(verify_uuid: str) -> dict | None:
    result = supabase.table("credentials").select("*").eq("verify_uuid", verify_uuid).execute()
    return result.data[0] if result.data else None


# --- Proctoring -----------------------------------------------------------

def log_proctoring_event(assessment_id: str, event_type: str, severity: str = "low",
                          metadata: dict | None = None) -> dict:
    data = {
        "assessment_id": assessment_id,
        "event_type": event_type,
        "severity": severity,
        "metadata": metadata,
    }
    return supabase.table("proctoring_logs").insert(data).execute().data[0]


# --- Learning Analytics -----------------------------------------------------

def upsert_learning_analytics(user_id: str, insights: dict) -> dict:
    data = {"user_id": user_id, **insights}
    return (
        supabase.table("learning_analytics")
        .upsert(data, on_conflict="user_id")
        .execute()
        .data[0]
    )