from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import require_role
from app.models.user import User
from app.models.course import Course, CourseEnrollment
from app.models.assessment import Assessment
from app.models.submission import Submission
from app.models.learning_log import LearningLog
from app.schemas.student import SubmissionCreate, LearningLogCreate
from app.services.assessment import auto_grade_submission
from app.services.learning import get_student_recommendations, calculate_risk_score
import uuid

router = APIRouter(prefix="/api/student", tags=["student"])

@router.get("/courses")
async def get_courses(current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course).join(CourseEnrollment, Course.id == CourseEnrollment.course_id)
        .where(CourseEnrollment.student_id == current_user.id)
    )
    courses = result.scalars().all()
    return [{"id": c.id, "title": c.title, "subject": c.subject, "gradeLevel": c.grade_level, "createdAt": c.created_at.isoformat()} for c in courses]

@router.get("/assessments/{assessment_id}")
async def get_assessment(assessment_id: str, current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="시험을 찾을 수 없습니다.")
    sub_result = await db.execute(
        select(Submission).where(Submission.assessment_id == assessment_id, Submission.student_id == current_user.id)
    )
    already_submitted = sub_result.scalar_one_or_none() is not None
    if already_submitted:
        raise HTTPException(status_code=400, detail="이미 제출한 시험입니다.")
    return {
        "id": assessment.id,
        "title": assessment.title,
        "courseId": assessment.course_id,
        "questions": assessment.questions or [],
        "createdAt": assessment.created_at.isoformat(),
    }

@router.get("/courses/{course_id}/assessments")
async def get_assessments(course_id: str, current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment).where(Assessment.course_id == course_id))
    assessments = result.scalars().all()
    out = []
    for a in assessments:
        sub_result = await db.execute(
            select(Submission).where(Submission.assessment_id == a.id, Submission.student_id == current_user.id)
        )
        submitted = sub_result.scalar_one_or_none()
        out.append({
            "id": a.id, "title": a.title, "questionCount": len(a.questions) if a.questions else 0,
            "createdAt": a.created_at.isoformat(),
            "submitted": submitted is not None,
            "score": submitted.ai_score if submitted else None
        })
    return out

@router.post("/submissions")
async def submit(body: SubmissionCreate, background_tasks: BackgroundTasks, current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(Submission).where(Submission.assessment_id == body.assessment_id, Submission.student_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 제출한 시험입니다.")
    submission = Submission(
        id=str(uuid.uuid4()), assessment_id=body.assessment_id,
        student_id=current_user.id, answers=body.answers
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    background_tasks.add_task(auto_grade_submission, submission, db)
    return {"id": submission.id, "message": "제출 완료. AI 채점이 진행 중입니다."}

@router.get("/progress")
async def get_progress(current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    subs_result = await db.execute(select(Submission).where(Submission.student_id == current_user.id))
    submissions = subs_result.scalars().all()
    scores = [s.ai_score for s in submissions if s.ai_score is not None]
    avg_score = sum(scores) / len(scores) if scores else 0
    logs_result = await db.execute(select(LearningLog).where(LearningLog.student_id == current_user.id))
    logs = logs_result.scalars().all()
    study_days = len(set(l.logged_at.date() for l in logs))
    return {
        "totalSubmissions": len(submissions),
        "avgScore": round(avg_score, 1),
        "studyDays": study_days,
        "progressPct": min(len(submissions) * 10, 100)
    }

@router.get("/recommendations")
async def get_recommendations(current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    return await get_student_recommendations(current_user.id, db)

@router.post("/logs")
async def log_event(body: LearningLogCreate, current_user: User = Depends(require_role("student")), db: AsyncSession = Depends(get_db)):
    log = LearningLog(
        id=str(uuid.uuid4()), student_id=current_user.id, course_id=body.course_id,
        event_type=body.event_type, duration_sec=body.duration_sec, metadata_=body.metadata
    )
    db.add(log)
    await db.commit()
    return {"message": "logged"}
