from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.routes import (
    auth_routes,
    roadmap_routes,
    leaderboard_routes,
    problem_routes,
    submission_routes,
    recommendation_routes,
    chatbot_routes,
    proctoring_routes,
    assessment_routes,
    credential_routes,
    admin_routes,
    interview_routes,
    submission_comment_routes,
    solution_routes,
    review_routes,
    discussion_routes,
    profile_routes,
    challenge_routes,
)
from app.database.chroma_client import chroma_health_check
from app.services.supabase_service import supabase
from app.services.piston_service import get_available_runtimes, PistonExecutionError

app = FastAPI(
    title="NeuroCode API",
    description="AI-powered gamified coding education platform — Backend Service",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_routes.router)
app.include_router(roadmap_routes.router)
app.include_router(challenge_routes.router)
app.include_router(leaderboard_routes.router)
app.include_router(problem_routes.router)
app.include_router(submission_routes.router)
app.include_router(recommendation_routes.router)
app.include_router(chatbot_routes.router)
app.include_router(proctoring_routes.router)
app.include_router(assessment_routes.router)
app.include_router(credential_routes.router)
app.include_router(admin_routes.router)
app.include_router(interview_routes.router)
app.include_router(submission_comment_routes.router)
app.include_router(solution_routes.router)
app.include_router(review_routes.router)
app.include_router(discussion_routes.router)
app.include_router(profile_routes.router)

_INSECURE_DEFAULTS = [
    name
    for name, is_default in (
        ("JWT_SECRET", settings.JWT_SECRET == "dev-secret-change-me"),
        ("PROVIDER_SWITCH_PASSCODE", settings.PROVIDER_SWITCH_PASSCODE == "neurocode-dev-passcode"),
    )
    if is_default
]
if _INSECURE_DEFAULTS:
    import logging
    logging.getLogger(__name__).warning(
        "%s still %s the built-in placeholder value — anyone can forge sessions / "
        "unlock the provider switch. Override %s in the environment before any real deployment.",
        " and ".join(_INSECURE_DEFAULTS),
        "use" if len(_INSECURE_DEFAULTS) > 1 else "uses",
        "them" if len(_INSECURE_DEFAULTS) > 1 else "it",
    )

@app.get("/health")
def health_check():
    try:
        supabase.table("users").select("id").limit(1).execute()
        supabase_status = "connected"
    except Exception:
        supabase_status = "unreachable"

    chroma_status = "connected" if chroma_health_check() else "unreachable"

    try:
        runtimes = get_available_runtimes()
        piston_status = "connected" if runtimes else "connected but no runtimes loaded"
    except PistonExecutionError:
        piston_status = "unreachable"

    return {
        "status": "ok",
        "supabase": supabase_status,
        "chromadb": chroma_status,
        "piston": piston_status,
    }


@app.get("/")
def root():
    return {"message": "NeuroCode API — Where Intelligence Meets Code"}
