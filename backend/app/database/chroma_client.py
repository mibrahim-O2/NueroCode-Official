import os

# This MUST be set before `import chromadb` below. ChromaDB can attempt
# to send its very first telemetry ping the moment it's imported — before
# our own settings or the ChromaSettings object further down ever get a
# chance to say "don't." Setting this environment variable first closes
# that timing gap.
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions

# Belt-and-suspenders fix: the environment variable above and the
# ChromaSettings object below both tell ChromaDB's own configuration
# system not to send telemetry, but testing confirmed some internal
# ChromaDB code paths (collection creation/add events specifically)
# attempted it regardless of both of those settings. This directly
# disables the exact function named in the error ("capture() takes 1
# positional argument but 3 were given") at its source, so no internal
# ChromaDB code path can ever trigger that warning again, regardless of
# which of its telemetry entry points it uses.
try:
    import posthog
    posthog.Posthog.capture = lambda self, *args, **kwargs: None
except (ImportError, AttributeError):
    pass

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