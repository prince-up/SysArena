import json
import os
import urllib.request
from collections.abc import Generator

try:
    from groq import Groq
except ImportError:  # pragma: no cover - optional dependency
    Groq = None

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None


def _fallback_reply(
    user_answer: str,
    system_question: str,
    history: list[dict[str, str]] | None = None,
) -> str:
    user_turns = [item for item in (history or []) if item.get("role") == "user"]
    turn_index = max(len(user_turns) - 1, 0)

    answer_lower = user_answer.lower()
    missing = []
    if not any(term in answer_lower for term in ("requirements", "sla", "scope")):
        missing.append("requirements")
    if not any(term in answer_lower for term in ("api", "endpoint", "contract")):
        missing.append("api design")
    if not any(term in answer_lower for term in ("schema", "table", "index")):
        missing.append("data model")
    if not any(term in answer_lower for term in ("cache", "redis", "memcached")):
        missing.append("caching")
    if not any(term in answer_lower for term in ("replication", "failover", "dr", "backup")):
        missing.append("fault tolerance")

    if len(user_answer.strip()) < 20:
        feedback_prefix = "Your answer is too shallow and misses key design details."
    elif missing:
        feedback_prefix = (
            "This is incomplete. You missed critical areas: "
            + ", ".join(missing[:3])
            + "."
        )
    else:
        feedback_prefix = "Decent direction, but it still lacks concrete trade-offs."

    question_bank = [
        (
            "Solid start. Consider adding a cache for hot reads and replication for HA.",
            "How will you model message storage and indexing?",
        ),
        (
            "Good direction. Think about write amplification and long-term storage costs.",
            "How will you handle fan-out and timeline delivery?",
        ),
        (
            "Nice. Watch for hotspots and uneven shards.",
            "What caching strategy would you use for recent conversations?",
        ),
        (
            "Makes sense. Consider backpressure and retries.",
            "How will you ensure fault tolerance and disaster recovery?",
        ),
        (
            "Good. Tie this back to SLAs and observability.",
            "What metrics and alerts would you add for this system?",
        ),
    ]

    feedback, next_question = question_bank[min(turn_index, len(question_bank) - 1)]
    return f"Feedback: {feedback_prefix} {feedback} Next question: {next_question}"


def _build_prompt(
    system_question: str,
    user_answer: str,
    history: list[dict[str, str]] | None = None,
) -> str:
    prompt = (
        "You are a senior system design interviewer at Google.\n\n"
        f"System design question: {system_question}\n"
        f"Candidate answer: {user_answer}\n\n"
        "Evaluate this system design answer and ask the next question. "
        "Be direct about mistakes or missing pieces. "
        "Provide brief feedback on scalability, database design, caching, and fault tolerance."
    )

    context_lines = []
    for item in history or []:
        role = item.get("role", "user")
        text = item.get("text", "")
        context_lines.append(f"{role.upper()}: {text}")

    history_block = "\n".join(context_lines[-12:])
    return f"{prompt}\n\nConversation so far:\n{history_block}"


def _compatible_messages(prompt: str) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "You are a senior system design interviewer at Google. "
                "Be direct, technical, and concise."
            ),
        },
        {"role": "user", "content": prompt},
    ]


def _compatible_api_key() -> str | None:
    return os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")


def _compatible_base_url() -> str:
    return (
        os.getenv("GROQ_BASE_URL")
        or os.getenv("OPENAI_BASE_URL")
        or "https://api.groq.com/openai/v1"
    )


def _compatible_model() -> str:
    return (
        os.getenv("GROQ_MODEL")
        or os.getenv("OPENAI_MODEL")
        or "openai/gpt-oss-120b"
    )


def _groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set")
    if Groq is None:
        raise ValueError("groq package is not installed")

    base_url = os.getenv("GROQ_BASE_URL")
    if base_url:
        normalized = base_url.rstrip("/")
        if normalized.endswith("/openai/v1"):
            normalized = normalized[: -len("/openai/v1")]
        return Groq(api_key=api_key, base_url=normalized)

    return Groq(api_key=api_key)


def _openai_headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def _ask_compatible(prompt: str) -> str:
    if os.getenv("GROQ_API_KEY"):
        client = _groq_client()
        response = client.chat.completions.create(
            model=_compatible_model(),
            messages=_compatible_messages(prompt),
            temperature=0.4,
        )
        choices = getattr(response, "choices", None) or []
        if not choices:
            raise ValueError("Groq response did not include a choice")
        message = getattr(choices[0], "message", None)
        content = getattr(message, "content", "") if message is not None else ""
        return str(content).strip()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("No compatible API key is set")

    payload = {
        "model": _compatible_model(),
        "messages": _compatible_messages(prompt),
        "temperature": 0.4,
    }
    request = urllib.request.Request(
        f"{_compatible_base_url()}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers=_openai_headers(api_key),
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=60) as response:
        data = json.loads(response.read().decode("utf-8"))

    choices = data.get("choices") or []
    if not choices:
        raise ValueError("OpenAI response did not include a choice")
    message = choices[0].get("message") or {}
    return str(message.get("content", "")).strip()


def _stream_compatible(prompt: str) -> Generator[str, None, None]:
    if os.getenv("GROQ_API_KEY"):
        client = _groq_client()
        stream = client.chat.completions.create(
            model=_compatible_model(),
            messages=_compatible_messages(prompt),
            temperature=0.4,
            stream=True,
        )
        for chunk in stream:
            choices = getattr(chunk, "choices", None) or []
            if not choices:
                continue
            delta = getattr(choices[0], "delta", None)
            content = getattr(delta, "content", None) if delta is not None else None
            if content:
                yield content
        return

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("No compatible API key is set")

    payload = {
        "model": _compatible_model(),
        "messages": _compatible_messages(prompt),
        "temperature": 0.4,
        "stream": True,
    }
    request = urllib.request.Request(
        f"{_compatible_base_url()}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers=_openai_headers(api_key),
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=60) as response:
        for raw_line in response:
            line = raw_line.decode("utf-8", errors="ignore").strip()
            if not line.startswith("data: "):
                continue

            event = line[6:].strip()
            if event == "[DONE]":
                break

            try:
                payload = json.loads(event)
            except json.JSONDecodeError:
                continue

            choices = payload.get("choices") or []
            if not choices:
                continue
            delta = choices[0].get("delta") or {}
            content = delta.get("content")
            if content:
                yield content


def score_answer(user_answer: str) -> dict[str, dict[str, str | int]]:
    answer_lower = user_answer.lower()
    scores: dict[str, dict[str, str | int]] = {}

    def has_any(terms: tuple[str, ...]) -> bool:
        return any(term in answer_lower for term in terms)

    categories = {
        "requirements": (
            ("requirements", "sla", "scope", "latency", "throughput"),
            "Call out core requirements and SLAs.",
        ),
        "api_design": (
            ("api", "endpoint", "contract", "request", "response"),
            "Define APIs and payloads clearly.",
        ),
        "data_model": (
            ("schema", "table", "index", "partition", "shard"),
            "Specify the data model and indexing.",
        ),
        "caching": (
            ("cache", "redis", "memcached", "ttl"),
            "Explain caching strategy and invalidation.",
        ),
        "reliability": (
            ("replication", "failover", "dr", "backup", "retry"),
            "Discuss resilience and failure modes.",
        ),
    }

    for key, (terms, note) in categories.items():
        present = has_any(terms)
        score = 4 if present else 2
        if len(user_answer.strip()) < 20:
            score = 1
        scores[key] = {
            "score": score,
            "notes": note,
        }

    return scores


def suggestions_from_scores(
    scores: dict[str, dict[str, str | int]]
) -> list[str]:
    suggestions = []
    for key, detail in scores.items():
        score = int(detail.get("score", 0))
        if score >= 3:
            continue
        if key == "requirements":
            suggestions.append("List core requirements, SLAs, and scale targets.")
        elif key == "api_design":
            suggestions.append("Define key APIs and payloads for reads/writes.")
        elif key == "data_model":
            suggestions.append("Sketch the data model, partitions, and indexes.")
        elif key == "caching":
            suggestions.append("Explain cache placement, TTLs, and invalidation.")
        elif key == "reliability":
            suggestions.append("Cover replication, failover, and disaster recovery.")
    if not suggestions:
        suggestions.append("Add deeper trade-offs and capacity estimates.")
    return suggestions


def _resolve_model_name(preferred: str) -> str:
    if genai is None:
        return preferred

    try:
        models = list(genai.list_models())
    except Exception:
        return preferred

    candidates = [
        model
        for model in models
        if "generateContent" in (model.supported_generation_methods or [])
    ]

    if preferred:
        for model in candidates:
            short_name = model.name.split("/")[-1]
            if preferred in (model.name, short_name):
                return short_name

    for fallback_name in (
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
    ):
        for model in candidates:
            short_name = model.name.split("/")[-1]
            if fallback_name in (model.name, short_name):
                return short_name

    return preferred


def ask_next_question(
    system_question: str,
    user_answer: str,
    history: list[dict[str, str]] | None = None,
) -> str:
    prompt = _build_prompt(system_question, user_answer, history)

    try:
        return _ask_compatible(prompt)
    except Exception:
        pass

    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    if not api_key or genai is None:
        return _fallback_reply(user_answer, system_question, history)

    genai.configure(api_key=api_key)
    resolved_model = _resolve_model_name(model_name)
    model = genai.GenerativeModel(resolved_model)
    try:
        response = model.generate_content(prompt)
        return (response.text or "").strip() or _fallback_reply(
            user_answer, system_question, history
        )
    except Exception:
        return _fallback_reply(user_answer, system_question, history)


def ask_next_question_stream(
    system_question: str,
    user_answer: str,
    history: list[dict[str, str]] | None = None,
) -> Generator[str, None, None]:
    prompt = _build_prompt(system_question, user_answer, history)

    try:
        yield from _stream_compatible(prompt)
        return
    except Exception:
        pass

    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    if not api_key or genai is None:
        fallback = _fallback_reply(user_answer, system_question, history)
        yield from _chunk_text(fallback)
        return

    genai.configure(api_key=api_key)
    resolved_model = _resolve_model_name(model_name)
    model = genai.GenerativeModel(resolved_model)
    try:
        response = model.generate_content(prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception:
        fallback = _fallback_reply(user_answer, system_question, history)
        yield from _chunk_text(fallback)


def _chunk_text(text: str, size: int = 40) -> Generator[str, None, None]:
    for index in range(0, len(text), size):
        yield text[index : index + size]
