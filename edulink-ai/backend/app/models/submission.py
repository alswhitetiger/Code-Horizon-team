import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Float, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Submission(Base):
    __tablename__ = "submissions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id: Mapped[str] = mapped_column(String, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    answers: Mapped[dict] = mapped_column(JSONB, nullable=False)
    ai_score: Mapped[float] = mapped_column(Float, nullable=True)
    ai_feedback: Mapped[str] = mapped_column(Text, nullable=True)
    ai_detail: Mapped[dict] = mapped_column(JSONB, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
