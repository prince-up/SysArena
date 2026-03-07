from fastapi import APIRouter, Depends
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

@router.get("", response_model=list[QuestionResponse])
async def list_questions(db: Session = Depends(get_db)) -> list[QuestionResponse]:
    items = db.query(QuestionModel).order_by(QuestionModel.id).all()
    return [
        QuestionResponse(
            id=item.id,
            title=item.title,
            description=item.description,
            difficulty=item.difficulty,
        )
        for item in items
    ]
