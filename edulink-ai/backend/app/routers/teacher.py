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
from app.services.question_bank import get_questions_from_bank
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


class InviteRequest(BaseModel):
    email: str

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
    # 1순위: 문제 은행에서 조회
    bank_questions = await get_questions_from_bank(
        db, body.subject, body.grade_level, body.topic,
        body.question_type, body.difficulty, body.count
    )
    if len(bank_questions) >= body.count:
        return {"questions": bank_questions, "source": "bank"}

    # 2순위: 문제 은행에 부족하면 AI로 생성 (부족분만큼)
    needed = body.count - len(bank_questions)
    ai_result = await generate_questions(
        body.subject, body.grade_level, body.topic,
        body.question_type, body.difficulty, needed
    )
    combined = bank_questions + (ai_result.get("questions") or [])
    return {"questions": combined, "source": "mixed" if bank_questions else "ai"}

@router.post("/assessments")
async def create_assessment(body: AssessmentCreate, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    assessment = Assessment(id=str(uuid.uuid4()), course_id=body.course_id, title=body.title, questions=body.questions, created_by=current_user.id)
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return {"id": assessment.id, "title": assessment.title, "courseId": assessment.course_id, "createdAt": assessment.created_at.isoformat()}

@router.get("/submissions")
async def get_all_submissions(current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    """교사의 모든 강의에 속한 제출 답안 전체 조회"""
    courses_result = await db.execute(select(Course).where(Course.teacher_id == current_user.id))
    courses = courses_result.scalars().all()
    if not courses:
        return []
    course_ids = [c.id for c in courses]
    assessments_result = await db.execute(select(Assessment).where(Assessment.course_id.in_(course_ids)))
    assessments = assessments_result.scalars().all()
    if not assessments:
        return []
    assessment_ids = [a.id for a in assessments]
    result = await db.execute(select(Submission).where(Submission.assessment_id.in_(assessment_ids)))
    submissions = result.scalars().all()
    # student_id 목록으로 한번에 조회 (N+1 방지)
    student_ids = list({s.student_id for s in submissions})
    students_result = await db.execute(select(User).where(User.id.in_(student_ids)))
    students_map = {u.id: u for u in students_result.scalars().all()}
    out = []
    for s in submissions:
        student = students_map.get(s.student_id)
        out.append({
            "id": s.id, "assessmentId": s.assessment_id,
            "studentId": s.student_id, "studentName": student.name if student else "Unknown",
            "answers": s.answers or {},
            "aiScore": s.ai_score, "aiFeedback": s.ai_feedback,
            "submittedAt": s.submitted_at.isoformat(),
            "status": "채점완료" if s.ai_score is not None else "채점대기"
        })
    return out


@router.get("/assessments/{assessment_id}/submissions")
async def get_submissions(assessment_id: str, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Submission).where(Submission.assessment_id == assessment_id))
    submissions = result.scalars().all()
    # student_id 목록으로 한번에 조회 (N+1 방지)
    student_ids = list({s.student_id for s in submissions})
    students_result = await db.execute(select(User).where(User.id.in_(student_ids)))
    students_map = {u.id: u for u in students_result.scalars().all()}
    out = []
    for s in submissions:
        student = students_map.get(s.student_id)
        out.append({
            "id": s.id, "studentId": s.student_id,
            "studentName": student.name if student else "Unknown",
            "answers": s.answers or {},
            "aiScore": s.ai_score, "aiFeedback": s.ai_feedback,
            "submittedAt": s.submitted_at.isoformat(),
            "status": "채점완료" if s.ai_score is not None else "채점대기"
        })
    return out

@router.get("/courses/{course_id}/students")
async def get_course_students(course_id: str, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).join(CourseEnrollment, CourseEnrollment.student_id == User.id)
        .where(CourseEnrollment.course_id == course_id)
    )
    students = result.scalars().all()
    return [{"id": s.id, "name": s.name, "email": s.email} for s in students]


@router.post("/courses/{course_id}/invite")
async def invite_student(course_id: str, body: InviteRequest, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    # 코스 소유권 확인
    course = await db.get(Course, course_id)
    if not course or course.teacher_id != current_user.id:
        raise HTTPException(status_code=404, detail="강의를 찾을 수 없습니다.")
    # 학생 조회
    result = await db.execute(select(User).where(User.email == body.email))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="해당 이메일의 사용자가 없습니다.")
    if student.role not in ("student",):
        raise HTTPException(status_code=400, detail="학생 계정만 초대할 수 있습니다.")
    # 이미 등록 여부 확인
    existing = await db.scalar(
        select(func.count(CourseEnrollment.id))
        .where(CourseEnrollment.course_id == course_id, CourseEnrollment.student_id == student.id)
    )
    if existing:
        raise HTTPException(status_code=400, detail="이미 등록된 학생입니다.")
    enrollment = CourseEnrollment(id=str(uuid.uuid4()), course_id=course_id, student_id=student.id)
    db.add(enrollment)
    await db.commit()
    return {"message": f"{student.name}({student.email}) 학생을 초대했습니다.", "student": {"id": student.id, "name": student.name, "email": student.email}}


@router.delete("/courses/{course_id}/students/{student_id}")
async def remove_student(course_id: str, student_id: str, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CourseEnrollment).where(CourseEnrollment.course_id == course_id, CourseEnrollment.student_id == student_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="등록 정보를 찾을 수 없습니다.")
    await db.delete(enrollment)
    await db.commit()
    return {"message": "학생을 제거했습니다."}


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
