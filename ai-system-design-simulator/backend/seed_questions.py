from database import Base, SessionLocal, engine
from models.question import Question

SEED_QUESTIONS = [
    {
        "title": "Design WhatsApp",
        "description": "Build a global, real-time messaging platform.",
        "difficulty": "Medium",
    },
    {
        "title": "Design Instagram",
        "description": "Photo sharing with feeds, storage, and CDN.",
        "difficulty": "Medium",
    },
    {
        "title": "Design Uber",
        "description": "Dispatch, location tracking, and surge pricing.",
        "difficulty": "Hard",
    },
    {
        "title": "Design YouTube",
        "description": "Video upload, transcoding, and playback at scale.",
        "difficulty": "Hard",
    },
    {
        "title": "Design URL Shortener",
        "description": "Short link creation, analytics, and cache strategy.",
        "difficulty": "Easy",
    },
]


def seed_questions() -> None:
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        existing = session.query(Question).count()
        if existing:
            return
        for item in SEED_QUESTIONS:
            session.add(Question(**item))
        session.commit()
    finally:
        session.close()


if __name__ == "__main__":
    seed_questions()
    print("Seeded questions.")
