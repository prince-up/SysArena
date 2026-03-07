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
```

### Backend
```
cd ai-system-design-simulator/backend
pip install fastapi uvicorn sqlalchemy psycopg2 redis
uvicorn main:app --reload
```

### Redis
Run Redis locally (default: `redis://localhost:6379/0`).

### Health Check
```
GET http://localhost:8000/health/redis
```

## API Endpoints
- `POST /interview/chat`
- `GET /interview/history/{session_id}`
- `POST /interview/clear/{session_id}`
- `GET /health/redis`

## Screenshots
- Landing page
- Dashboard
- Interview chat
- Results

## Deployment
- Frontend: Vercel
- Backend: Render / Railway / AWS
- Database: Supabase / AWS RDS
