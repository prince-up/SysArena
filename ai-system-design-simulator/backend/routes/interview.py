from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from redis.exceptions import RedisError

from services.ai_service import ask_next_question
from services.session_store import append_message, clear_session, get_messages

router = APIRouter()


class InterviewRequest(BaseModel):
    session_id: str
    question_title: str
    user_answer: str


class InterviewResponse(BaseModel):
    ai_reply: str


class Message(BaseModel):
    role: str
    text: str


@router.post("/chat", response_model=InterviewResponse)
async def chat_interview(payload: InterviewRequest) -> InterviewResponse:
    try:
        append_message(payload.session_id, "user", payload.user_answer)
        ai_reply = ask_next_question(payload.question_title, payload.user_answer)
        append_message(payload.session_id, "ai", ai_reply)
        return InterviewResponse(ai_reply=ai_reply)
    except RedisError as exc:
        raise HTTPException(
            status_code=503,
            detail="Redis unavailable. Try again in a moment.",
        ) from exc


@router.get("/history/{session_id}", response_model=list[Message])
async def interview_history(
    session_id: str, question_title: str | None = None
) -> list[Message]:
    try:
        messages = get_messages(session_id)
        if not messages and question_title:
            seed_text = f"{question_title}. Start with a high-level architecture."
            append_message(session_id, "ai", seed_text)
            messages = get_messages(session_id)
        return [Message(**item) for item in messages]
    except RedisError as exc:
        raise HTTPException(
            status_code=503,
            detail="Redis unavailable. Unable to load history.",
        ) from exc


@router.post("/clear/{session_id}")
async def clear_history(session_id: str) -> dict[str, str]:
    try:
        clear_session(session_id)
        return {"status": "cleared"}
    except RedisError as exc:
        raise HTTPException(
            status_code=503,
            detail="Redis unavailable. Unable to clear history.",
        ) from exc
