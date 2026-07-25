import chromadb
from chromadb.utils import embedding_functions

from app.config.settings import settings

_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)

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