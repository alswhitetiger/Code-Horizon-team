from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from app.core.database import get_db
from app.core.auth import require_role
from app.models.user import User
from app.models.course import Course, CourseEnrollment
from app.models.assessment import Assessment
from app.models.submission import Submission
from app.schemas.teacher import CourseCreate, QuestionGenerateRequest, AssessmentCreate, GradeRequest
from app.services.ai_engine import generate_questions
from app.services.assessment import auto_grade_submission
import uuid

router = APIRouter(prefix="/api/teacher", tags=["teacher"])

@router.get("/courses")
async def get_courses(current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).where(Course.teacher_id == current_user.id))
    courses = result.scalars().all()
    out = []
    for c in courses:
        count = await db.scalar(select(func.count(CourseEnrollment.id)).where(CourseEnrollment.course_id == c.id)) or 0
        out.append({"id": c.id, "title": c.title, "subject": c.subject, "gradeLevel": c.grade_level, "studentCount": count, "createdAt": c.created_at.isoformat()})
    return out

@router.post("/courses")
async def create_course(body: CourseCreate, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    course = Course(id=str(uuid.uuid4()), teacher_id=current_user.id, title=body.title, subject=body.subject, grade_level=body.grade_level)
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return {"id": course.id, "title": course.title, "subject": course.subject}

@router.get("/courses/{course_id}/stats")
async def course_stats(course_id: str, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    enrollments = await db.scalar(select(func.count(CourseEnrollment.id)).where(CourseEnrollment.course_id == course_id)) or 0
    assessments_result = await db.execute(select(Assessment).where(Assessment.course_id == course_id))
    assessments = assessments_result.scalars().all()
    assessment_ids = [a.id for a in assessments]
    total_submissions = 0
    avg_score = 0.0
    if assessment_ids:
        subs_result = await db.execute(select(Submission).where(Submission.assessment_id.in_(assessment_ids)))
        subs = subs_result.scalars().all()
        total_submissions = len(subs)
        scores = [s.ai_score for s in subs if s.ai_score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0.0
    return {"studentCount": enrollments, "assessmentCount": len(assessments), "totalSubmissions": total_submissions, "avgScore": round(avg_score, 1)}

@router.post("/questions/generate")
async def generate_questions_endpoint(body: QuestionGenerateRequest, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    result = await generate_questions(body.subject, body.grade_level, body.topic, body.question_type, body.difficulty, body.count)
    return result

@router.post("/assessments")
async def create_assessment(body: AssessmentCreate, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    assessment = Assessment(id=str(uuid.uuid4()), course_id=body.course_id, title=body.title, questions=body.questions, created_by=current_user.id)
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return {"id": assessment.id, "title": assessment.title, "courseId": assessment.course_id, "createdAt": assessment.created_at.isoformat()}

@router.get("/assessments/{assessment_id}/submissions")
async def get_submissions(assessment_id: str, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Submission).where(Submission.assessment_id == assessment_id))
    submissions = result.scalars().all()
    out = []
    for s in submissions:
        student = await db.get(User, s.student_id)
        out.append({"id": s.id, "studentId": s.student_id, "studentName": student.name if student else "Unknown",
                    "aiScore": s.ai_score, "aiFeedback": s.ai_feedback, "submittedAt": s.submitted_at.isoformat(),
                    "status": "채점완료" if s.ai_score is not None else "채점대기"})
    return out

@router.post("/submissions/{submission_id}/grade")
async def grade_submission_endpoint(submission_id: str, body: GradeRequest, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    submission = await db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if body.score is not None:
        submission.ai_score = body.score
    if body.feedback:
        submission.ai_feedback = body.feedback
    await db.commit()
    return {"message": "채점 완료", "score": submission.ai_score}
