"""RAG-grounded chatbot: retrieves the student's own semantically similar
past submissions from ChromaDB and uses them as grounding context for a
hint-only response.

Direct-answer requests are refused deterministically via pattern match
BEFORE ever calling the AI provider — a reliable guardrail layer on top
of (not instead of) the system prompt's own instruction, since LLMs
aren't perfectly consistent about following prompt-only guardrails.
"""

import re

from app.ai.provider_factory import get_ai_provider
from app.database.chroma_client import submissions_collection

DIRECT_ANSWER_PATTERNS = re.compile(
    r"\b(give me the (code|answer|solution)|write the code|solve (it|this) for me|"
    r"just tell me the answer|full solution|complete solution|exact code)\b",
    re.IGNORECASE,
)

REFUSAL_MESSAGE = (
    "I can't give you the direct solution — that's part of the learning here. "
    "What I can do is help you think through it: what part of the problem feels "
    "unclear right now? Is it figuring out the approach, or getting the code to work?"
)

CHATBOT_SYSTEM_PROMPT = """You are the NeuroCode Mentor, a supportive AI coding tutor. A student \
is working on a practice problem and has asked for help.

STRICT RULES — follow these exactly:
- NEVER write or reveal a complete solution, even partially. Do not output runnable code that \
solves the problem.
- Give conceptual hints, ask guiding questions, point out relevant data structures/algorithms, or \
explain WHY an approach works — never HOW to write the final code.
- If grounding context from the student's own past submissions is provided below, reference it \
specifically (e.g. "in your last attempt you used a nested loop for the lookup — that's the part \
worth reconsidering") rather than giving generic advice.
- If the student directly asks for the answer, redirect them to think through the next step \
themselves.
- Keep responses to 2-4 sentences. Be warm and encouraging, never condescending."""


def _retrieve_context(user_id: str, topic: str | None, message: str) -> list[str]:
    try:
        where = {"user_id": user_id} if not topic else {"$and": [{"user_id": user_id}, {"topic": topic}]}
        result = submissions_collection().query(query_texts=[message], n_results=3, where=where)
        return result.get("documents", [[]])[0]
    except Exception:
        return []


def ask_chatbot(user_id: str, message: str, topic: str | None) -> dict:
    if DIRECT_ANSWER_PATTERNS.search(message):
        return {"reply": REFUSAL_MESSAGE, "grounded": False, "refused": True}

    context_snippets = _retrieve_context(user_id, topic, message)
    grounded = len(context_snippets) > 0

    context_block = (
        "\n\n".join(f"Past submission {i + 1}:\n{snippet[:500]}" for i, snippet in enumerate(context_snippets))
        if context_snippets
        else "No relevant past submissions found."
    )

    user_prompt = (
        f"Current topic: {topic or 'unspecified'}\n\n"
        f"Student's own relevant past submissions:\n{context_block}\n\n"
        f"Student's question: {message}"
    )

    provider = get_ai_provider()
    reply = provider.generate(CHATBOT_SYSTEM_PROMPT, user_prompt, max_tokens=250)

    return {"reply": reply, "grounded": grounded, "refused": False}