import json
import os

import redis
from redis.exceptions import RedisError

from database import SessionLocal
from models.interview import InterviewMessage, InterviewScore, InterviewSession

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
_memory_store: dict[str, list[dict[str, str]]] = {}


def _redis_available() -> bool:
    try:
        redis_client.ping()
        return True
    except RedisError:
        return False


def _session_key(session_id: str) -> str:
    return f"interview:{session_id}:messages"


def _ensure_session(
    db: SessionLocal,
    session_id: str,
    question_title: str | None,
    user_id: int | None,
) -> InterviewSession:
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.session_id == session_id)
        .first()
    )
    if session is None:
        session = InterviewSession(
            session_id=session_id,
            question_title=question_title,
            user_id=user_id,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    if question_title and session.question_title != question_title:
        session.question_title = question_title
        db.commit()

    if user_id and session.user_id != user_id:
        session.user_id = user_id
        db.commit()

    return session


def append_message(
    session_id: str,
    role: str,
    text: str,
    question_title: str | None = None,
    user_id: int | None = None,
    scores: dict[str, dict[str, str | int]] | None = None,
) -> None:
    payload = json.dumps({"role": role, "text": text})
    if _redis_available():
        try:
            redis_client.rpush(_session_key(session_id), payload)
        except RedisError:
            pass

    _memory_store.setdefault(session_id, []).append({"role": role, "text": text})

    db = SessionLocal()
    try:
        session = _ensure_session(db, session_id, question_title, user_id)
        message = InterviewMessage(session_id=session.id, role=role, text=text)
        db.add(message)
        db.commit()
        db.refresh(message)

        if scores:
            for category, detail in scores.items():
                db.add(
                    InterviewScore(
                        session_id=session.id,
                        message_id=message.id,
                        category=category,
                        score=int(detail.get("score", 0)),
                        notes=str(detail.get("notes", "")) or None,
                    )
                )
            db.commit()
    finally:
        db.close()


def _load_messages_from_db(session_id: str) -> list[dict[str, str]]:
    db = SessionLocal()
    try:
        session = (
            db.query(InterviewSession)
            .filter(InterviewSession.session_id == session_id)
            .first()
        )
        if session is None:
            return []

        messages = (
            db.query(InterviewMessage)
            .filter(InterviewMessage.session_id == session.id)
            .order_by(InterviewMessage.id)
            .all()
        )
        return [{"role": msg.role, "text": msg.text} for msg in messages]
    finally:
        db.close()


def get_messages(session_id: str) -> list[dict[str, str]]:
    if _redis_available():
        try:
            items = redis_client.lrange(_session_key(session_id), 0, -1)
            if items:
                return [json.loads(item) for item in items]
        except RedisError:
            pass

    messages = _load_messages_from_db(session_id)
    if messages and _redis_available():
        try:
            redis_client.delete(_session_key(session_id))
            for item in messages:
                redis_client.rpush(_session_key(session_id), json.dumps(item))
        except RedisError:
            pass

    if messages:
        _memory_store[session_id] = messages.copy()

    return _memory_store.get(session_id, messages).copy()


def ping_redis() -> None:
    try:
        redis_client.ping()
    except RedisError as exc:
        raise RedisError("Redis ping failed") from exc


def clear_session(session_id: str) -> None:
    if _redis_available():
        try:
            redis_client.delete(_session_key(session_id))
        except RedisError:
            pass

    _memory_store.pop(session_id, None)

    db = SessionLocal()
    try:
        session = (
            db.query(InterviewSession)
            .filter(InterviewSession.session_id == session_id)
            .first()
        )
        if session is None:
            return

        db.query(InterviewScore).filter(
            InterviewScore.session_id == session.id
        ).delete()
        db.query(InterviewMessage).filter(
            InterviewMessage.session_id == session.id
        ).delete()
        db.delete(session)
        db.commit()
    finally:
        db.close()


def list_sessions_for_user(user_id: int) -> list[InterviewSession]:
    db = SessionLocal()
    try:
        return (
            db.query(InterviewSession)
            .filter(InterviewSession.user_id == user_id)
            .order_by(InterviewSession.created_at.desc())
            .all()
        )
    finally:
        db.close()


def get_scores_for_session(session_id: str) -> dict[str, dict[str, str | int]]:
    db = SessionLocal()
    try:
        session = (
            db.query(InterviewSession)
            .filter(InterviewSession.session_id == session_id)
            .first()
        )
        if session is None:
            return {}
        items = (
            db.query(InterviewScore)
            .filter(InterviewScore.session_id == session.id)
            .order_by(InterviewScore.id.desc())
            .all()
        )
        scores: dict[str, dict[str, str | int]] = {}
        for item in items:
            if item.category not in scores:
                scores[item.category] = {
                    "score": item.score,
                    "notes": item.notes or "",
                }
        return scores
    finally:
        db.close()
