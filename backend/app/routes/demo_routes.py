"""Demo Mode routes (/demo/*).

PRIMARY SECURITY BOUNDARY
-------------------------
Every route on `router` is owner-only. require_owner is attached at the
ROUTER level, so FastAPI resolves it before any other dependency or handler
code on every gated route — and a route added to this router later cannot
forget it. Each route also receives the owner through Depends(require_owner);
FastAPI caches that within the request, so the check runs exactly once.
A non-owner gets the same generic 403 whatever they try.

The one exception is `public_router`'s GET /demo/verify/{uuid}: public by
design (like the real /verify/{uuid}), and it only ever returns a fixed
"this is a demo credential" notice.

Routes are plain `def` rather than `async def`: grading runs blocking Piston
HTTP calls, and sync routes run in FastAPI's threadpool, so a slow grading
request never stalls other users' requests.

Static paths are declared before parameterized ones, and the catch-all
POST /demo/{scope}/reset is declared last.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import get_current_user
from app.schemas.demo_schemas import (
    DemoAssessmentSubmitRequest,
    DemoChallengeSubmitRequest,
    DemoCommentRequest,
    DemoCredentialIssueRequest,
    DemoInterviewStartRequest,
    DemoInterviewSubmitRequest,
    DemoPasscodeRequest,
    DemoPracticeSubmitRequest,
    DemoProctoringLogRequest,
    DemoToggleRequest,
)
from app.services import demo_service


def require_owner(current_user: dict = Depends(get_current_user)) -> dict:
    """THE security boundary of Demo Mode: only the account whose email
    matches settings.OWNER_EMAIL may use any gated /demo/* route. An unset
    OWNER_EMAIL matches nobody. Authentication itself (valid, unexpired
    session) is get_current_user, which runs first."""
    if not demo_service.is_owner(current_user):
        raise HTTPException(status_code=403, detail="Demo Mode is only available to the project owner.")
    return current_user


router = APIRouter(prefix="/demo", tags=["demo"], dependencies=[Depends(require_owner)])
public_router = APIRouter(prefix="/demo", tags=["demo"])


# --- Public ---------------------------------------------------------------

@public_router.get("/verify/{verify_uuid}")
def verify_demo_credential(verify_uuid: str):
    """Where every demo credential's QR code and link points. Always the same
    demo notice; never looks up or reveals any credential data."""
    return demo_service.demo_verification_notice()


# --- Access: passcode, status, on/off ----------------------------------------

@router.post("/verify-passcode")
def verify_passcode(payload: DemoPasscodeRequest, current_user: dict = Depends(require_owner)):
    """Second gate, same shape as POST /admin/verify-provider-passcode."""
    return demo_service.verify_passcode(current_user, payload.passcode)


@router.get("/status")
def status(current_user: dict = Depends(require_owner)):
    """Demo Mode on/off state and persona, for the frontend DemoModeContext."""
    return demo_service.get_status(current_user)


@router.post("/toggle")
def toggle(payload: DemoToggleRequest, current_user: dict = Depends(require_owner)):
    """Switches Demo Mode on (passcode required, seeds first-activation data)
    or off (no passcode needed)."""
    return demo_service.set_enabled(current_user, payload.enabled)


@router.post("/exit")
def exit_demo(current_user: dict = Depends(require_owner)):
    """Same effect as toggling off. A separate endpoint purely so the
    prominent "Exit Demo" button has one obvious, single-purpose call."""
    return demo_service.set_enabled(current_user, False)


# --- Dashboard ----------------------------------------------------------------

@router.get("/dashboard/charts")
def dashboard_charts(current_user: dict = Depends(require_owner)):
    """Demo equivalent of GET /profile/analytics/user-charts."""
    return demo_service.get_dashboard_charts(current_user)


# --- Roadmap ------------------------------------------------------------------

@router.get("/roadmap")
def roadmap(current_user: dict = Depends(require_owner)):
    """Demo equivalent of GET /roadmap/ — the fixed 5-topic demo roadmap."""
    return demo_service.get_roadmap(current_user)


@router.get("/roadmap/topic-progress")
def roadmap_topic_progress(current_user: dict = Depends(require_owner)):
    """Demo equivalent of GET /roadmap/topic-progress."""
    return demo_service.get_topic_progress(current_user)


@router.post("/roadmap/{topic}/start")
def roadmap_start(topic: str, current_user: dict = Depends(require_owner)):
    """Demo equivalent of POST /roadmap/{node_id}/start, addressed by topic."""
    return demo_service.start_topic(current_user, topic)


@router.post("/roadmap/{topic}/complete")
def roadmap_complete(topic: str, current_user: dict = Depends(require_owner)):
    """Demo equivalent of POST /roadmap/{node_id}/complete — awards real XP."""
    return demo_service.complete_topic(current_user, topic)


# --- Practice + discussions -------------------------------------------------

@router.get("/practice")
def practice_catalog(current_user: dict = Depends(require_owner)):
    """List of fixed practice problems (no test cases or solutions), so the
    Practice page can choose one without hardcoding keys."""
    return demo_service.get_practice_catalog()


@router.post("/practice/submit")
def practice_submit(payload: DemoPracticeSubmitRequest, current_user: dict = Depends(require_owner)):
    """Demo equivalent of POST /submissions/execute — real grading + analysis."""
    return demo_service.submit_practice(current_user, payload.problem_key, payload.language, payload.source_code)


@router.get("/practice/{problem_key}")
def practice_problem(problem_key: str, current_user: dict = Depends(require_owner)):
    """One fixed practice problem, in the same public shape as a generated one."""
    return demo_service.get_practice_problem(problem_key)


@router.get("/discussions/{problem_key}")
def discussions(problem_key: str, current_user: dict = Depends(require_owner)):
    """Demo equivalent of GET /problems/{id}/discussions."""
    return demo_service.list_discussions(problem_key)


@router.post("/discussions/{problem_key}")
def add_discussion(problem_key: str, payload: DemoCommentRequest, current_user: dict = Depends(require_owner)):
    """Demo equivalent of POST /problems/{id}/discussions."""
    return demo_service.add_discussion(current_user, problem_key, payload.comment)


# --- Challenge Gate -----------------------------------------------------------

@router.post("/challenge/submit-question")
def challenge_submit(payload: DemoChallengeSubmitRequest, current_user: dict = Depends(require_owner)):
    """Demo equivalent of POST /challenges/{node_id}/submit-question."""
    return demo_service.submit_challenge_question(
        current_user, payload.node_key, payload.question_index, payload.code, payload.language
    )


@router.get("/challenge/{node_key}")
def challenge_get(node_key: str, current_user: dict = Depends(require_owner)):
    """Demo equivalent of GET /challenges/{node_id} — creates the session on first visit."""
    return demo_service.get_or_start_challenge(current_user, node_key)


@router.post("/challenge/{node_key}")
def challenge_start(node_key: str, current_user: dict = Depends(require_owner)):
    """Explicit start. Idempotent: returns the existing session if there is one."""
    return demo_service.get_or_start_challenge(current_user, node_key)


# --- Mock Interview -----------------------------------------------------------

@router.post("/interview/start")
def interview_start(payload: DemoInterviewStartRequest, current_user: dict = Depends(require_owner)):
    """Demo equivalent of POST /interviews/start, for one of the 3 fixed topics."""
    return demo_service.start_interview(current_user, payload.topic)


@router.post("/interview/{session_id}/submit")
def interview_submit(session_id: str, payload: DemoInterviewSubmitRequest, current_user: dict = Depends(require_owner)):
    """Demo equivalent of POST /interviews/{id}/submit."""
    return demo_service.submit_interview(current_user, session_id, payload.language, payload.source_code)


# --- Assessments + proctoring -----------------------------------------------

@router.get("/assessments")
def assessments(current_user: dict = Depends(require_owner)):
    """Demo equivalent of GET /assessments/available-clusters, plus unlock
    requirements and the inline integrity-testing guide."""
    return demo_service.list_assessments(current_user)


@router.post("/assessments/{assessment_key}/start")
def assessment_start(assessment_key: str, current_user: dict = Depends(require_owner)):
    """Starts a demo assessment; 403 unless its unlock_rule is satisfied."""
    return demo_service.start_assessment(current_user, assessment_key)


@router.post("/assessments/{attempt_id}/submit")
def assessment_submit(attempt_id: str, payload: DemoAssessmentSubmitRequest, current_user: dict = Depends(require_owner)):
    """Grades all questions; integrity score is computed server-side from
    demo_proctoring_logs and never taken from the client."""
    return demo_service.submit_assessment(current_user, attempt_id, payload.language, payload.solutions)


@router.post("/assessments/{attempt_id}/proctoring-log")
def assessment_proctoring_log(
    attempt_id: str, payload: DemoProctoringLogRequest, current_user: dict = Depends(require_owner)
):
    """Demo equivalent of POST /assessments/{id}/proctoring-log."""
    return demo_service.log_proctoring_event(current_user, attempt_id, payload.event_type, payload.severity)


# --- Credentials --------------------------------------------------------------

@router.get("/credentials")
def credentials(current_user: dict = Depends(require_owner)):
    """Demo equivalent of GET /credentials/mine."""
    return demo_service.list_credentials(current_user)


@router.post("/credentials/issue")
def credentials_issue(payload: DemoCredentialIssueRequest, current_user: dict = Depends(require_owner)):
    """Presenter-triggered demo credential (any tier)."""
    return demo_service.issue_credential(current_user, payload.badge_level, payload.assessment_key)


# --- My Submissions + teacher comments ------------------------------------------

@router.get("/submissions/mine")
def my_submissions(current_user: dict = Depends(require_owner)):
    """Demo equivalent of GET /submissions/mine."""
    return demo_service.list_my_submissions(current_user)


@router.get("/submissions/{submission_id}/comments")
def submission_comments(submission_id: str, current_user: dict = Depends(require_owner)):
    """Demo equivalent of GET /submissions/{id}/comments."""
    return demo_service.list_submission_comments(current_user, submission_id)


@router.post("/submissions/{submission_id}/comments")
def add_submission_comment(submission_id: str, payload: DemoCommentRequest, current_user: dict = Depends(require_owner)):
    """Demo equivalent of POST /submissions/{id}/comments."""
    return demo_service.add_submission_comment(current_user, submission_id, payload.comment)


# --- Demo cohort ----------------------------------------------------------------

@router.get("/cohort/overview")
def cohort_overview(current_user: dict = Depends(require_owner)):
    """Demo Student A/B/C plus the owner's live persona row."""
    return demo_service.get_cohort_overview(current_user)


@router.get("/cohort/leaderboard")
def cohort_leaderboard(current_user: dict = Depends(require_owner)):
    """Leaderboard over the demo cohort plus the persona row only."""
    return demo_service.get_cohort_leaderboard(current_user)


@router.get("/cohort/students/{student_id}/timeline")
def cohort_student_timeline(student_id: str, current_user: dict = Depends(require_owner)):
    """Timeline for a demo cohort row only — 404 for any real student id."""
    return demo_service.get_cohort_student_timeline(current_user, student_id)


# --- Resets (declared last: {scope} is a catch-all path segment) --------------

@router.post("/{scope}/reset")
def reset(scope: str, current_user: dict = Depends(require_owner)):
    """Resets one of the nine demo scopes: dashboard, roadmap, practice,
    challenge, interview, submissions, assessment, credentials, cohort."""
    return demo_service.reset_scope(current_user, scope)
