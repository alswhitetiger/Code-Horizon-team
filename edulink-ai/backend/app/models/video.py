from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.sql import func
from app.core.database import Base


class CourseVideo(Base):
    __tablename__ = "course_videos"

    id = Column(String, primary_key=True)
    course_id = Column(String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VideoProgress(Base):
    __tablename__ = "video_progress"

    id = Column(String, primary_key=True)
    video_id = Column(String, ForeignKey("course_videos.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    watched_seconds = Column(Float, default=0.0)
    total_seconds = Column(Float, default=0.0)
    completed = Column(Boolean, default=False)
    last_updated_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("video_id", "student_id"),)
