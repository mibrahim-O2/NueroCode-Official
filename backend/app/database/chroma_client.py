import os

os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

# Critical ordering fix: this patch MUST run BEFORE `import chromadb`.
# ChromaDB builds its own internal telemetry client as part of its own
# import-time setup, and grabs a direct reference to Posthog's capture
# function at that exact moment. Patching it AFTER `import chromadb` (as
# tried previously) is too late — ChromaDB has already captured its own
# reference to the original, broken function by then, and re-patching
# the class afterward doesn't reach back and fix that already-grabbed
# reference. Patching posthog FIRST guarantees ChromaDB's own setup
# picks up our safe, no-op version from the very start.
try:
    import posthog
    posthog.Posthog.capture = lambda self, *args, **kwargs: None
except (ImportError, AttributeError):
    pass

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