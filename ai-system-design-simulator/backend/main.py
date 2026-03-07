from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from redis.exceptions import RedisError

from routes import interview
from services.session_store import ping_redis

app = FastAPI()

app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:3000"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(interview.router, prefix="/interview", tags=["interview"])


@app.get("/health/redis")
async def redis_health() -> dict[str, str]:
	try:
		ping_redis()
		return {"status": "ok"}
	except RedisError as exc:
		raise HTTPException(status_code=503, detail="Redis unavailable") from exc
