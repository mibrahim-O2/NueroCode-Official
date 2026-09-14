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
    demo_routes,
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
# Demo Mode. public_router holds only GET /demo/verify/{uuid}, which is
# deliberately unauthenticated (like the real /verify/{uuid}) and always
# answers "this is a demo credential". Every other /demo/* route lives on
# `router`, whose owner-only check runs before anything else in each route.
app.include_router(demo_routes.public_router)
app.include_router(demo_routes.router)

_INSECURE_DEFAULTS = [
    name
    for name, is_default in (
        ("JWT_SECRET", settings.JWT_SECRET == "dev-secret-change-me"),
        ("PROVIDER_SWITCH_PASSCODE", settings.PROVIDER_SWITCH_PASSCODE == "neurocode-dev-passcode"),
        # Demo Mode settings have no default at all, so "insecure" here means
        # "unset". They're flagged in this same block on purpose: an unset
        # OWNER_EMAIL / DEMO_MODE_PASSCODE silently leaves Demo Mode locked
        # for everyone, and that should be obvious at boot, not discovered
        # mid-presentation.
        ("OWNER_EMAIL", not settings.OWNER_EMAIL.strip()),
        ("DEMO_MODE_PASSCODE", not settings.DEMO_MODE_PASSCODE.strip()),
    )
    if is_default
]
if _INSECURE_DEFAULTS:
    import logging
    # Message reworded to cover both cases now in this list — placeholder
    # secrets (a security risk) and unset Demo Mode settings (feature locked).
    logging.getLogger(__name__).warning(
        "Insecure or missing settings: %s. A placeholder JWT_SECRET / PROVIDER_SWITCH_PASSCODE lets "
        "anyone forge sessions or unlock the provider switch; an unset OWNER_EMAIL / DEMO_MODE_PASSCODE "
        "leaves Demo Mode locked for everyone. Set these in the environment before any real deployment.",
        ", ".join(_INSECURE_DEFAULTS),
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
