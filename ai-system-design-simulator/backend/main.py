from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from redis.exceptions import RedisError
from dotenv import load_dotenv

from routes import interview, questions
from services.session_store import ping_redis

app = FastAPI()

load_dotenv()

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=False,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(interview.router, prefix="/interview", tags=["interview"])
app.include_router(questions.router, prefix="/questions", tags=["questions"])


@app.get("/health/redis")
async def redis_health() -> dict[str, str]:
	try:
		ping_redis()
		return {"status": "ok"}
	except RedisError as exc:
		raise HTTPException(status_code=503, detail="Redis unavailable") from exc
