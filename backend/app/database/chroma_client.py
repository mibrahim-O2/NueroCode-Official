import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions

from app.config.settings import settings

# anonymized_telemetry=False stops ChromaDB from attempting to call its
# bundled PostHog telemetry client at all. The "capture() takes 1
# positional argument but 3 were given" warning was a version mismatch
# between chromadb's bundled telemetry call and the installed posthog
# package — cosmetic (caught internally, never raised, never affected
# actual requests), but disabling it outright removes the noise instead
# of just tolerating it.
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