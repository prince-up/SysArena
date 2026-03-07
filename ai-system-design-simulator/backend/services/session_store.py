import json
import os

import redis
from redis.exceptions import RedisError

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


def append_message(session_id: str, role: str, text: str) -> None:
    payload = json.dumps({"role": role, "text": text})
    if _redis_available():
        try:
            redis_client.rpush(_session_key(session_id), payload)
            return
        except RedisError:
            pass

    _memory_store.setdefault(session_id, []).append({"role": role, "text": text})


def get_messages(session_id: str) -> list[dict[str, str]]:
    if _redis_available():
        try:
            items = redis_client.lrange(_session_key(session_id), 0, -1)
            return [json.loads(item) for item in items]
        except RedisError:
            pass

    return _memory_store.get(session_id, []).copy()


def ping_redis() -> None:
    try:
        redis_client.ping()
    except RedisError as exc:
        raise RedisError("Redis ping failed") from exc


def clear_session(session_id: str) -> None:
    if _redis_available():
        try:
            redis_client.delete(_session_key(session_id))
            return
        except RedisError:
            pass

    _memory_store.pop(session_id, None)
