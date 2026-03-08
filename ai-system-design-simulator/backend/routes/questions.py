import os

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.question import Question as QuestionModel

router = APIRouter()


class QuestionResponse(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    tags: list[str] = []


class QuestionRequest(BaseModel):
    title: str
    description: str
    difficulty: str
    tags: list[str] = []


def _require_admin(x_user_email: str | None) -> None:
    allowlist = os.getenv("ADMIN_EMAILS", "").strip()
    if not allowlist:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access not configured",
        )
    allowed = {item.strip().lower() for item in allowlist.split(",") if item.strip()}
    if not x_user_email or x_user_email.lower() not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )

@router.get("", response_model=list[QuestionResponse])
async def list_questions(db: Session = Depends(get_db)) -> list[QuestionResponse]:
    items = db.query(QuestionModel).order_by(QuestionModel.id).all()
    return [
        QuestionResponse(
            id=item.id,
            title=item.title,
            description=item.description,
            difficulty=item.difficulty,
            tags=[tag for tag in (item.tags or "").split(",") if tag],
        )
        for item in items
    ]


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    payload: QuestionRequest,
    db: Session = Depends(get_db),
    x_user_email: str | None = Header(default=None),
) -> QuestionResponse:
    _require_admin(x_user_email)
    item = QuestionModel(
        title=payload.title,
        description=payload.description,
        difficulty=payload.difficulty,
        tags=",".join(payload.tags),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return QuestionResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        difficulty=item.difficulty,
        tags=payload.tags,
    )


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    payload: QuestionRequest,
    db: Session = Depends(get_db),
    x_user_email: str | None = Header(default=None),
) -> QuestionResponse:
    _require_admin(x_user_email)
    item = db.query(QuestionModel).filter(QuestionModel.id == question_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Question not found")

    item.title = payload.title
    item.description = payload.description
    item.difficulty = payload.difficulty
    item.tags = ",".join(payload.tags)
    db.commit()
    db.refresh(item)
    return QuestionResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        difficulty=item.difficulty,
        tags=payload.tags,
    )


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    x_user_email: str | None = Header(default=None),
) -> None:
    _require_admin(x_user_email)
    item = db.query(QuestionModel).filter(QuestionModel.id == question_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(item)
    db.commit()
