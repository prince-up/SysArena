from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from services.security import hash_password, verify_password

router = APIRouter()


class AuthRequest(BaseModel):
    email: str
    password: str
    name: str | None = None


class AuthResponse(BaseModel):
    id: int
    email: str
    name: str | None = None


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: AuthRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    if payload.name:
        user.name = payload.name
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthResponse(id=user.id, email=user.email, name=user.name)


@router.post("/login", response_model=AuthResponse)
async def login(payload: AuthRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return AuthResponse(id=user.id, email=user.email, name=user.name)
