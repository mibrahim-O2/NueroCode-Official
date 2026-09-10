import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.middleware.auth_middleware import get_current_user
from app.utils.provider_access import validate_provider_request
from app.ai.gemini_provider import GeminiQuotaExceededError
from app.services.piston_service import PistonExecutionError, PistonRuntimeUnavailableError
from app.services import challenge_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/challenges", tags=["challenges"])

_EXEC_UNAVAILABLE = "The code execution service is currently unavailable. Please try again shortly."
_EXEC_NO_RUNTIME = "The code execution service has no runtimes loaded right now. Please try again shortly."
_AI_RATE_LIMITED = "The AI provider is temporarily rate-limited. Please try again in a few minutes."


class SubmitQuestionPayload(BaseModel):
    question_index: int
    code: str
    language: str = "python"


def _validate_node_id(node_id: str) -> None:
    if not node_id or node_id == "undefined":
        raise HTTPException(status_code=400, detail="A valid node id is required.")


@router.get("/{node_id}")
async def get_node_challenge(
    node_id: str,
    provider: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
):
    _validate_node_id(node_id)
    # Same authorization gate Practice uses — a non-admin cannot select
    # openai/claude; None/"gemini" pass straight through.
    validate_provider_request(current_user, provider)
    try:
        return challenge_service.get_or_generate_challenge(
            current_user["id"], node_id, provider_override=provider
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except GeminiQuotaExceededError:
        raise HTTPException(status_code=429, detail=_AI_RATE_LIMITED)
    except PistonRuntimeUnavailableError:
        raise HTTPException(status_code=503, detail=_EXEC_NO_RUNTIME)
    except PistonExecutionError:
        raise HTTPException(status_code=503, detail=_EXEC_UNAVAILABLE)
    except RuntimeError:
        logger.exception("challenge generation failed for node=%s", node_id)
        raise HTTPException(status_code=502, detail="Challenge generation failed. Please try again.")
    except HTTPException:
        raise
    except Exception:
        logger.exception("unexpected error creating challenge for node=%s", node_id)
        raise HTTPException(status_code=500, detail="Something went wrong setting up the challenge.")


@router.post("/{node_id}/submit-question")
async def submit_challenge_question(
    node_id: str,
    payload: SubmitQuestionPayload,
    current_user: dict = Depends(get_current_user),
):
    _validate_node_id(node_id)
    try:
        return challenge_service.submit_challenge_question(
            current_user["id"],
            node_id,
            payload.question_index,
            payload.code,
            payload.language,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except PistonExecutionError:
        raise HTTPException(status_code=503, detail=_EXEC_UNAVAILABLE)
    except HTTPException:
        raise
    except Exception:
        logger.exception("unexpected error grading challenge question for node=%s", node_id)
        raise HTTPException(status_code=500, detail="Something went wrong grading your submission.")


@router.get("/{node_id}/history")
async def get_node_challenge_history(
    node_id: str,
    current_user: dict = Depends(get_current_user),
):
    _validate_node_id(node_id)
    try:
        return challenge_service.get_challenge_history(current_user["id"], node_id)
    except Exception:
        logger.exception("unexpected error loading challenge history for node=%s", node_id)
        raise HTTPException(status_code=500, detail="Could not load challenge history.")
