import os

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
    prompt = (
        "You are a senior system design interviewer at Google.\n\n"
        f"System design question: {system_question}\n"
        f"Candidate answer: {user_answer}\n\n"
        "Evaluate this system design answer and ask the next question. "
        "Be direct about mistakes or missing pieces. "
        "Provide brief feedback on scalability, database design, caching, and fault tolerance."
    )

    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    if not api_key or genai is None:
        return _fallback_reply(user_answer, system_question, history)

    genai.configure(api_key=api_key)
    resolved_model = _resolve_model_name(model_name)
    model = genai.GenerativeModel(resolved_model)
    context_lines = []
    for item in history or []:
        role = item.get("role", "user")
        text = item.get("text", "")
        context_lines.append(f"{role.upper()}: {text}")

    history_block = "\n".join(context_lines[-12:])
    full_prompt = f"{prompt}\n\nConversation so far:\n{history_block}"
    try:
        response = model.generate_content(full_prompt)
        return (response.text or "").strip() or _fallback_reply(
            user_answer, system_question, history
        )
    except Exception:
        return _fallback_reply(user_answer, system_question, history)
