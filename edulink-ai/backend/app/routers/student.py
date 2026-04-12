from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.auth import require_role
from app.models.user import User
from app.models.course import Course, CourseEnrollment
from app.models.assessment import Assessment
from app.models.submission import Submission
from app.models.learning_log import LearningLog
from app.models.video import CourseVideo, VideoProgress
from app.schemas.student import SubmissionCreate, LearningLogCreate
from app.services.assessment import auto_grade_submission
from app.services.learning import get_student_recommendations, calculate_risk_score
from pydantic import BaseModel
import uuid
import os

router = APIRouter(prefix="/api/student", tags=["student"])

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

class VideoProgressUpdate(BaseModel):
    watched_seconds: float
    total_seconds: float
    completed: bool = False

@router.get("/courses")
async def get_courses(current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).join(CourseEnrollment, Course.id == CourseEnrollment.course_id).where(CourseEnrollment.student_id == current_user.id))
    courses = result.scalars().all()
    return [{"id": c.id, "title": c.title, "subject": c.subject, "gradeLevel": c.grade_level, "createdAt": c.created_at.isoformat()} for c in courses]

@router.get("/assessments/{assessment_id}")
async def get_assessment(assessment_id: str, current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment: raise HTTPException(status_code=404, detail="시험을 찾을 수 없습니다.")
    sub_result = await db.execute(select(Submission).where(Submission.assessment_id == assessment_id, Submission.student_id == current_user.id))
    existing_sub = sub_result.scalar_one_or_none()
    return {"id": assessment.id, "title": assessment.title, "questions": assessment.questions, "submitted": existing_sub is not None, "submission": {"score": existing_sub.ai_score, "feedback": existing_sub.ai_feedback} if existing_sub else None}

@router.get("/courses/{course_id}/assessments")
async def get_course_assessments(course_id: str, current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment).where(Assessment.course_id == course_id))
    assessments = result.scalars().all()
    out = []
    for a in assessments:
        sub_count = await db.scalar(select(func.count(Submission.id)).where(Submission.assessment_id == a.id, Submission.student_id == current_user.id))
        out.append({"id": a.id, "title": a.title, "questionCount": len(a.questions), "submitted": sub_count > 0})
    return out

@router.post("/submissions")
async def submit_assessment(body: SubmissionCreate, background_tasks: BackgroundTasks, current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Submission).where(Submission.assessment_id == body.assessment_id, Submission.student_id == current_user.id))
    if existing.scalar_one_or_none(): raise HTTPException(status_code=400, detail="이미 제출한 시험입니다.")
    submission = Submission(id=str(uuid.uuid4()), assessment_id=body.assessment_id, student_id=current_user.id, answers=body.answers)
    db.add(submission)
    await db.commit()
    background_tasks.add_task(auto_grade_submission, submission.id)
    return {"message": "제출되었습니다. AI 채점이 곧 진행됩니다.", "submissionId": submission.id}

@router.get("/progress")
async def get_progress(current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    subs_result = await db.execute(select(Submission).where(Submission.student_id == current_user.id))
    subs = subs_result.scalars().all()
    avg_score = sum(s.ai_score for s in subs if s.ai_score is not None) / len([s for s in subs if s.ai_score is not None]) if subs else 0
    return {"totalSubmissions": len(subs), "avgScore": round(avg_score, 1), "studyDays": 5, "progressPct": 45}

@router.get("/recommendations")
async def recommendations(current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    return await get_student_recommendations(current_user.id, db)

@router.post("/logs")
async def create_log(body: LearningLogCreate, current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    log = LearningLog(id=str(uuid.uuid4()), student_id=current_user.id, action=body.action, metadata_json=body.metadata)
    db.add(log)
    await db.commit()
    return {"status": "ok"}

@router.get("/courses/{course_id}/videos")
async def get_course_videos_student(
    course_id: str,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CourseVideo).where(CourseVideo.course_id == course_id))
    videos = result.scalars().all()
    out = []
    for v in videos:
        prog_result = await db.execute(
            select(VideoProgress).where(VideoProgress.video_id == v.id, VideoProgress.student_id == current_user.id)
        )
        p = prog_result.scalar_one_or_none()
        pct = round(p.watched_seconds / p.total_seconds * 100, 1) if p and p.total_seconds > 0 else 0
        out.append({
            "id": v.id,
            "title": v.title,
            "description": v.description or "",
            "url": f"{BACKEND_URL}/uploads/{v.file_path}",
            "myProgress": {
                "watchedSeconds": p.watched_seconds if p else 0,
                "totalSeconds": p.total_seconds if p else 0,
                "completed": p.completed if p else False,
                "watchedPct": pct,
            } if p else None
        })
    return out

@router.put("/videos/{video_id}/progress")
async def update_video_progress(
    video_id: str,
    body: VideoProgressUpdate,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VideoProgress).where(VideoProgress.video_id == video_id, VideoProgress.student_id == current_user.id)
    )
    progress = result.scalar_one_or_none()
    if progress:
        progress.watched_seconds = body.watched_seconds
        progress.total_seconds = body.total_seconds
        progress.completed = body.completed
    else:
        progress = VideoProgress(
            id=str(uuid.uuid4()),
            video_id=video_id,
            student_id=current_user.id,
            watched_seconds=body.watched_seconds,
            total_seconds=body.total_seconds,
            completed=body.completed,
        )
        db.add(progress)
    await db.commit()
    return {"message": "진도가 저장되었습니다."}
