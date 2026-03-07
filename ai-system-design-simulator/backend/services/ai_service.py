def ask_next_question(system_question: str, user_answer: str) -> str:
    prompt = (
        "You are a senior system design interviewer at Google.\n\n"
        f"System design question: {system_question}\n"
        f"Candidate answer: {user_answer}\n\n"
        "Evaluate this system design answer and ask the next question. "
        "Provide brief feedback on scalability, database design, caching, and fault tolerance."
    )

    # TODO: Replace this stub with a real call to Gemini or OpenAI.
    return (
        "Feedback: Solid start. Consider adding a cache for hot reads and replication for HA. "
        "Next question: How will you model message storage and indexing?"
    )
