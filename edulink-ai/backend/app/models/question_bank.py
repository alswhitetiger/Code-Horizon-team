import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class QuestionBank(Base):
    __tablename__ = "question_bank"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    subject: Mapped[str] = mapped_column(String(100), nullable=False)
    grade_level: Mapped[str] = mapped_column(String(50), nullable=False)
    topic: Mapped[str] = mapped_column(String(200), nullable=False)
    question_type: Mapped[str] = mapped_column(String(20), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    rubric: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_qbank_subject_grade_topic", "subject", "grade_level", "topic"),
        Index("ix_qbank_type_diff", "question_type", "difficulty"),
    )
