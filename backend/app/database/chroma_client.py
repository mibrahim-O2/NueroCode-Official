import logging
import os

os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

try:
    import posthog
    posthog.Posthog.capture = lambda self, *args, **kwargs: None
except (ImportError, AttributeError):
    pass


class _SuppressChromaTelemetryFilter(logging.Filter):
    """Discards ChromaDB's 'Failed to send telemetry event...' log lines
    before they're printed.

    Three earlier attempts tried to stop this error from happening in the
    first place (env var, ChromaSettings, patching posthog.Posthog.capture)
    — all targeted a SPECIFIC internal object, and all still left the
    message appearing, which means ChromaDB's actual telemetry wrapper is
    something other than what was patched. Rather than continue guessing
    at which internal function is responsible, this intercepts the
    already-caught, already-harmless error at the point it's about to be
    logged — which works regardless of which internal code path produced
    it. Attached to the root logger so it applies no matter which specific
    module inside chromadb emits the message.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        return "Failed to send telemetry event" not in record.getMessage()


logging.getLogger().addFilter(_SuppressChromaTelemetryFilter())

import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions

from app.config.settings import settings

_client = chromadb.PersistentClient(
    path=settings.CHROMA_DB_PATH,
    settings=ChromaSettings(anonymized_telemetry=False),
)

_embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)


def get_collection(name: str):
    return _client.get_or_create_collection(name=name, embedding_function=_embedding_fn)


def submissions_collection():
    return get_collection("neurocode_submissions")


def roadmap_collection():
    return get_collection("neurocode_roadmap")


def documents_collection():
    return get_collection("neurocode_documents")


def get_embedding_fn():
    """Exposes the shared sentence-transformer instance so other services
    (e.g. the recommendation engine) can embed text without loading the
    model a second time."""
    return _embedding_fn


def chroma_health_check() -> bool:
    try:
        _client.heartbeat()
        return True
    except Exception:
        return False