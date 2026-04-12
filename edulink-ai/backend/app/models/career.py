from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class CareerGoal(Base):
    __tablename__ = "career_goals"

    id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    career_name = Column(String(100), nullable=False)   # 예: "의사", "소프트웨어 엔지니어"
    reason = Column(Text)                               # 이 직업을 꿈꾸는 이유
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
