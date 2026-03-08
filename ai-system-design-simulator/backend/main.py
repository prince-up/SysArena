import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from redis.exceptions import RedisError
from dotenv import load_dotenv

from database import Base, engine
from models import interview as interview_models  # noqa: F401
from routes import auth, interview, questions
from seed_questions import seed_questions
from services.metrics import now_ms, record_request, snapshot
from services.session_store import ping_redis

app = FastAPI()

load_dotenv()

logging.basicConfig(level=logging.INFO)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=False,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(interview.router, prefix="/interview", tags=["interview"])
app.include_router(questions.router, prefix="/questions", tags=["questions"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])


@app.on_event("startup")
def startup() -> None:
	Base.metadata.create_all(bind=engine)
	seed_questions()


@app.get("/health/redis")
async def redis_health() -> dict[str, str]:
	try:
		ping_redis()
		return {"status": "ok"}
	except RedisError as exc:
		raise HTTPException(status_code=503, detail="Redis unavailable") from exc


@app.get("/health/metrics")
async def metrics_snapshot() -> dict[str, dict[str, float]]:
	return snapshot()


@app.middleware("http")
async def log_requests(request: Request, call_next):
	start = now_ms()
	response = await call_next(request)
	duration = now_ms() - start
	record_request(request.url.path, response.status_code, duration)
	logging.info("%s %s %s %.2fms", request.method, request.url.path, response.status_code, duration)
	return response
