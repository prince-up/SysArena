# SysArena

AI system design interview simulator with a Next.js frontend and FastAPI backend.

## MVP Features
- User login/signup (mock auth)
- Select a system design question
- AI interviewer asks follow-up questions
- User answers in chat
- AI provides feedback

## Architecture
Frontend (Next.js) -> REST API -> Backend (FastAPI)

Backend services:
- PostgreSQL (users + interviews)
- Redis (chat sessions)
- Gemini / OpenAI API (AI interviewer)

## Project Structure
```
ai-system-design-simulator/
	frontend/
	backend/
database/
```

## Local Setup

### Frontend
```
cd ai-system-design-simulator/frontend
npm install
npm run dev
```

Create a `frontend/.env.local` file:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me
```

### Backend
```
cd ai-system-design-simulator/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Optional backend env vars:
```
ADMIN_EMAILS=admin@example.com,other@example.com
GROQ_API_KEY=your-key
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_API_KEY=your-key
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4o-mini
DATABASE_URL=postgresql://user:pass@localhost:5432/sysarena
```

If you want the interviewer to use a real AI API, set `GROQ_API_KEY`, `GEMINI_API_KEY`, or `OPENAI_API_KEY`. Without one of those keys, the backend still runs, but it uses the built-in demo responses.

### Redis
Run Redis locally (default: `redis://localhost:6379/0`).

### Health Check
```
GET http://localhost:8000/health/redis
```

## API Endpoints
- `POST /interview/chat`
- `POST /interview/chat/stream`
- `GET /interview/history/{session_id}`
- `POST /interview/clear/{session_id}`
- `GET /interview/sessions?user_id=...`
- `GET /interview/sessions/{session_id}/scores`
- `POST /interview/sessions/compare`
- `GET /interview/export/{session_id}?format=md|pdf`
- `POST /auth/register`
- `POST /auth/login`
- `GET /health/redis`
- `GET /health/metrics`

## Screenshots
- Landing page
- Dashboard
- Interview chat
- Results

## Deployment
- Frontend: Vercel
- Backend: Render / Railway / AWS
- Database: Supabase / AWS RDS
