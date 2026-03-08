import json
import time
from difflib import unified_diff

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.ai_service import (
    ask_next_question,
    ask_next_question_stream,
    score_answer,
    suggestions_from_scores,
)
from services.exporter import build_markdown, build_pdf
from services.session_store import (
    append_message,
    clear_session,
    get_messages,
    get_scores_for_session,
    list_sessions_for_user,
)

router = APIRouter()


class InterviewRequest(BaseModel):
    session_id: str
    question_title: str
    user_answer: str
    user_id: int | None = None


class InterviewResponse(BaseModel):
    ai_reply: str
    scores: dict[str, dict[str, str | int]] | None = None
    suggestions: list[str] | None = None


class SessionSummary(BaseModel):
    session_id: str
    question_title: str | None = None
    created_at: str


class CompareRequest(BaseModel):
    left_session_id: str
    right_session_id: str


class CompareResponse(BaseModel):
    diff: str


_rate_limit: dict[str, list[float]] = {}


def _check_rate_limit(key: str, limit: int = 30) -> None:
    now = time.time()
    window_start = now - 60
    timestamps = _rate_limit.get(key, [])
    timestamps = [ts for ts in timestamps if ts >= window_start]
    if len(timestamps) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Try again in a minute.",
            headers={"Retry-After": "60"},
        )
    timestamps.append(now)
    _rate_limit[key] = timestamps


class Message(BaseModel):
    role: str
    text: str


@router.post("/chat", response_model=InterviewResponse)
async def chat_interview(payload: InterviewRequest) -> InterviewResponse:
    _check_rate_limit(payload.session_id)
    scores = score_answer(payload.user_answer)
    suggestions = suggestions_from_scores(scores)
    append_message(
        payload.session_id,
        "user",
        payload.user_answer,
        question_title=payload.question_title,
        user_id=payload.user_id,
        scores=scores,
    )
    history = get_messages(payload.session_id)
    ai_reply = ask_next_question(
        payload.question_title, payload.user_answer, history
    )
    append_message(
        payload.session_id,
        "ai",
        ai_reply,
        question_title=payload.question_title,
        user_id=payload.user_id,
    )
    return InterviewResponse(ai_reply=ai_reply, scores=scores, suggestions=suggestions)


@router.post("/chat/stream")
async def chat_interview_stream(payload: InterviewRequest) -> StreamingResponse:
    _check_rate_limit(payload.session_id)
    scores = score_answer(payload.user_answer)
    suggestions = suggestions_from_scores(scores)
    append_message(
        payload.session_id,
        "user",
        payload.user_answer,
        question_title=payload.question_title,
        user_id=payload.user_id,
        scores=scores,
    )
    history = get_messages(payload.session_id)

    def event_stream():
        full_text = ""
        for chunk in ask_next_question_stream(
            payload.question_title, payload.user_answer, history
        ):
            full_text += chunk
            yield "event: chunk\n"
            yield f"data: {json.dumps({'delta': chunk})}\n\n"

        append_message(
            payload.session_id,
            "ai",
            full_text,
            question_title=payload.question_title,
            user_id=payload.user_id,
        )
        yield "event: done\n"
        yield (
            "data: "
            + json.dumps(
                {
                    "done": True,
                    "full_text": full_text,
                    "scores": scores,
                    "suggestions": suggestions,
                }
            )
            + "\n\n"
        )

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/history/{session_id}", response_model=list[Message])
async def interview_history(
    session_id: str, question_title: str | None = None
) -> list[Message]:
    messages = get_messages(session_id)
    if not messages and question_title:
        seed_text = f"{question_title}. Start with a high-level architecture."
        append_message(
            session_id,
            "ai",
            seed_text,
            question_title=question_title,
        )
        messages = get_messages(session_id)
    return [Message(**item) for item in messages]


@router.post("/clear/{session_id}")
async def clear_history(session_id: str) -> dict[str, str]:
    clear_session(session_id)
    return {"status": "cleared"}


@router.get("/sessions", response_model=list[SessionSummary])
async def list_sessions(user_id: int = Query(...)) -> list[SessionSummary]:
    items = list_sessions_for_user(user_id)
    return [
        SessionSummary(
            session_id=item.session_id,
            question_title=item.question_title,
            created_at=item.created_at.isoformat(),
        )
        for item in items
    ]


@router.get("/sessions/{session_id}/scores")
async def session_scores(session_id: str) -> dict[str, dict[str, str | int]]:
    return get_scores_for_session(session_id)


@router.post("/sessions/compare", response_model=CompareResponse)
async def compare_sessions(payload: CompareRequest) -> CompareResponse:
    left = get_messages(payload.left_session_id)
    right = get_messages(payload.right_session_id)
    left_text = "\n".join([f"{item['role']}: {item['text']}" for item in left])
    right_text = "\n".join([f"{item['role']}: {item['text']}" for item in right])
    diff_lines = unified_diff(
        left_text.splitlines(),
        right_text.splitlines(),
        fromfile=payload.left_session_id,
        tofile=payload.right_session_id,
        lineterm="",
    )
    diff = "\n".join(diff_lines)
    return CompareResponse(diff=diff)


@router.get("/export/{session_id}")
async def export_session(session_id: str, format: str = Query("md")):
    messages = get_messages(session_id)
    scores = get_scores_for_session(session_id)
    question_title = "Interview"
    if messages:
        question_title = messages[0].get("text", question_title).split(".")[0]

    suggestions = suggestions_from_scores(scores) if scores else []
    markdown_text = build_markdown(question_title, messages, scores, suggestions)
    if format == "pdf":
        pdf_bytes = build_pdf(markdown_text)
        headers = {
            "Content-Disposition": f"attachment; filename=interview-{session_id}.pdf"
        }
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers=headers,
        )

    headers = {
        "Content-Disposition": f"attachment; filename=interview-{session_id}.md"
    }
    return StreamingResponse(
        iter([markdown_text.encode("utf-8")]),
        media_type="text/markdown",
        headers=headers,
    )
