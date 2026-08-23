from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import get_current_user
from app.schemas.assessment_schemas import StartAssessmentRequest, SubmitAssessmentRequest, ProctoringLogRequest
from app.services.assessment_service import get_available_clusters, start_assessment, submit_assessment
from app.database.repositories import log_proctoring_event
from app.services.piston_service import PistonRuntimeUnavailableError, PistonExecutionError
from app.utils.provider_access import validate_provider_request

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.get("/available-clusters")
async def available_clusters(current_user: dict = Depends(get_current_user)):
    return get_available_clusters(current_user["id"])


@router.post("/start")
async def start(payload: StartAssessmentRequest, current_user: dict = Depends(get_current_user)):
    validate_provider_request(current_user, payload.provider)

    try:
        return start_assessment(current_user["id"], payload.cluster_name, provider_override=payload.provider)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except PistonRuntimeUnavailableError as exc:
        raise HTTPException(status_code=503, detail=f"Code execution service has no runtimes loaded: {exc}")
    except PistonExecutionError as exc:
        raise HTTPException(status_code=503, detail=f"Code execution service unreachable: {exc}")
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/{assessment_id}/submit")
async def submit(
    assessment_id: str, payload: SubmitAssessmentRequest, current_user: dict = Depends(get_current_user)
):
    try:
        return submit_assessment(
            current_user["id"], assessment_id, payload.language, payload.source_code, payload.integrity_score
        )
    except PermissionError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except TimeoutError as exc:
        raise HTTPException(status_code=408, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/{assessment_id}/proctoring-log")
async def proctoring_log(
    assessment_id: str, payload: ProctoringLogRequest, current_user: dict = Depends(get_current_user)
):
    log_proctoring_event(assessment_id, payload.event_type, payload.severity, payload.metadata)
    return {"logged": True}