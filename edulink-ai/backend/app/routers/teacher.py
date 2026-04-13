from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from app.core.database import get_db
from app.core.auth import require_role
from app.models.user import User
from app.models.course import Course, CourseEnrollment
from app.models.assessment import Assessment
from app.models.submission import Submission
from app.models.video import CourseVideo, VideoProgress
from app.schemas.teacher import CourseCreate, QuestionGenerateRequest, AssessmentCreate, GradeRequest
from app.services.ai_engine import generate_questions
from app.services.question_bank import get_questions_from_bank
import uuid
import os
import shutil

router = APIRouter(prefix="/api/teacher", tags=["teacher"])

def _video_dict(v: CourseVideo) -> dict:
    BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
    return {
        "id": v.id,
        "courseId": v.course_id,
        "title": v.title,
        "description": v.description or "",
        "url": f"{BACKEND_URL}/uploads/{v.file_path}",
        "fileSize": v.file_size,
        "mimeType": v.mime_type,
        "createdAt": v.created_at.isoformat(),
    }

@router.get("/courses")
async def get_courses(current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).where(Course.teacher_id == current_user.id))
    courses = result.scalars().all()
    out = []
    for c in courses:
        enroll_count = await db.scalar(select(func.count(CourseEnrollment.id)).where(CourseEnrollment.course_id == c.id))
        out.append({"id": c.id, "title": c.title, "subject": c.subject, "gradeLevel": c.grade_level, "studentCount": enroll_count, "createdAt": c.created_at.isoformat()})
    return out

@router.get("/courses/{course_id}/stats")
async def get_course_stats(course_id: str, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    course = await db.get(Course, course_id)
    if not course or course.teacher_id != current_user.id:
        raise HTTPException(status_code=404, detail="Course not found")
    enrollments = await db.scalar(select(func.count(CourseEnrollment.id)).where(CourseEnrollment.course_id == course_id))
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
    bank_questions = await get_questions_from_bank(
        db, body.subject, body.grade_level, body.topic,
        body.question_type, body.difficulty, body.count
    )
    if len(bank_questions) >= body.count:
        return {"questions": bank_questions, "source": "bank"}
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
    courses_result = await db.execute(select(Course).where(Course.teacher_id == current_user.id))
    courses = courses_result.scalars().all()
    if not courses: return []
    course_ids = [c.id for c in courses]
    assessments_result = await db.execute(select(Assessment).where(Assessment.course_id.in_(course_ids)))
    assessments = assessments_result.scalars().all()
    if not assessments: return []
    assessment_ids = [a.id for a in assessments]
    result = await db.execute(select(Submission).where(Submission.assessment_id.in_(assessment_ids)))
    submissions = result.scalars().all()
    out = []
    for s in submissions:
        student = await db.get(User, s.student_id)
        assessment = await db.get(Assessment, s.assessment_id)
        course = await db.get(Course, assessment.course_id) if assessment else None
        out.append({
            "id": s.id, "assessmentId": s.assessment_id,
            "assessmentTitle": assessment.title if assessment else s.assessment_id,
            "courseTitle": course.title if course else "",
            "studentId": s.student_id, "studentName": student.name if student else s.student_id,
            "answers": s.answers, "aiScore": s.ai_score, "aiFeedback": s.ai_feedback,
            "submittedAt": s.submitted_at.isoformat(), "status": "채점완료" if s.ai_score is not None else "채점대기"
        })
    return out

@router.get("/submissions/{submission_id}")
async def get_submission_detail(submission_id: str, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    submission = await db.get(Submission, submission_id)
    if not submission: raise HTTPException(status_code=404, detail="제출 정보를 찾을 수 없습니다.")
    student = await db.get(User, submission.student_id)
    assessment = await db.get(Assessment, submission.assessment_id)
    course = await db.get(Course, assessment.course_id) if assessment else None
    return {
        "id": submission.id,
        "assessmentId": submission.assessment_id,
        "assessmentTitle": assessment.title if assessment else "",
        "questions": assessment.questions if assessment else [],
        "courseId": course.id if course else None,
        "courseTitle": course.title if course else "",
        "studentId": submission.student_id,
        "studentName": student.name if student else submission.student_id,
        "answers": submission.answers,
        "aiScore": submission.ai_score,
        "aiFeedback": submission.ai_feedback,
        "aiDetail": submission.ai_detail,
        "submittedAt": submission.submitted_at.isoformat(),
        "status": "채점완료" if submission.ai_score is not None else "채점대기",
    }

@router.get("/assessments/{assessment_id}/submissions")
async def get_submissions(assessment_id: str, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Submission).where(Submission.assessment_id == assessment_id))
    submissions = result.scalars().all()
    out = []
    for s in submissions:
        student = await db.get(User, s.student_id)
        out.append({
            "id": s.id, "studentId": s.student_id, "studentName": student.name,
            "answers": s.answers, "aiScore": s.ai_score, "aiFeedback": s.ai_feedback,
            "submittedAt": s.submitted_at.isoformat(), "status": "채점완료" if s.ai_score is not None else "채점대기"
        })
    return out

@router.get("/courses/{course_id}/students")
async def get_course_students(course_id: str, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).join(CourseEnrollment, CourseEnrollment.student_id == User.id).where(CourseEnrollment.course_id == course_id))
    students = result.scalars().all()
    return [{"id": s.id, "name": s.name, "email": s.email} for s in students]

@router.post("/courses/{course_id}/invite")
async def invite_student(course_id: str, body: dict, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    email = body.get("email", "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="이메일을 입력해주세요.")
    course = await db.get(Course, course_id)
    if not course or course.teacher_id != current_user.id:
        raise HTTPException(status_code=404, detail="강의를 찾을 수 없습니다.")
    student_result = await db.execute(select(User).where(User.email == email, User.role == "student"))
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="해당 이메일의 학생을 찾을 수 없습니다.")
    existing = await db.scalar(select(CourseEnrollment).where(CourseEnrollment.course_id == course_id, CourseEnrollment.student_id == student.id))
    if existing:
        raise HTTPException(status_code=400, detail="이미 등록된 학생입니다.")
    enrollment = CourseEnrollment(id=str(uuid.uuid4()), course_id=course_id, student_id=student.id)
    db.add(enrollment)
    await db.commit()
    return {"message": f"{student.name} 학생이 추가되었습니다.", "studentId": student.id, "name": student.name, "email": student.email}

@router.delete("/courses/{course_id}/students/{student_id}")
async def remove_student(course_id: str, student_id: str, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    course = await db.get(Course, course_id)
    if not course or course.teacher_id != current_user.id:
        raise HTTPException(status_code=404, detail="강의를 찾을 수 없습니다.")
    enrollment = await db.scalar(select(CourseEnrollment).where(CourseEnrollment.course_id == course_id, CourseEnrollment.student_id == student_id))
    if not enrollment:
        raise HTTPException(status_code=404, detail="등록된 학생이 아닙니다.")
    await db.delete(enrollment)
    await db.commit()
    return {"message": "학생이 제거되었습니다."}

@router.post("/courses")
async def create_course(body: dict, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    title = body.get("title", "").strip()
    subject = body.get("subject", "").strip()
    if not title or not subject:
        raise HTTPException(status_code=400, detail="제목과 과목을 입력해주세요.")
    course = Course(id=str(uuid.uuid4()), teacher_id=current_user.id, title=title, subject=subject, grade_level=body.get("gradeLevel") or body.get("grade_level"))
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return {"id": course.id, "title": course.title, "subject": course.subject, "gradeLevel": course.grade_level, "studentCount": 0, "createdAt": course.created_at.isoformat()}

@router.post("/submissions/{submission_id}/grade")
async def grade_submission_endpoint(submission_id: str, body: GradeRequest, current_user: User = Depends(require_role("teacher")), db: AsyncSession = Depends(get_db)):
    submission = await db.get(Submission, submission_id)
    if not submission: raise HTTPException(status_code=404, detail="Submission not found")
    if body.score is not None: submission.ai_score = body.score
    if body.feedback: submission.ai_feedback = body.feedback
    await db.commit()
    return {"message": "채점 완료", "score": submission.ai_score}

@router.post("/courses/{course_id}/videos")
async def upload_video(
    course_id: str,
    title: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if not course or course.teacher_id != current_user.id:
        raise HTTPException(status_code=404, detail="강의를 찾을 수 없습니다.")

    video_id = str(uuid.uuid4())
    original_name = file.filename or "video"
    ext = os.path.splitext(original_name)[1] or ".mp4"
    relative_path = f"videos/{video_id}{ext}"
    full_path = f"uploads/{relative_path}"

    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    file_size = os.path.getsize(full_path)

    video = CourseVideo(
        id=video_id,
        course_id=course_id,
        title=title,
        description=description,
        file_path=relative_path,
        original_filename=original_name,
        file_size=file_size,
        mime_type=file.content_type,
        created_by=current_user.id,
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)
    return _video_dict(video)

@router.get("/courses/{course_id}/videos")
async def get_course_videos_teacher(
    course_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CourseVideo).where(CourseVideo.course_id == course_id))
    videos = result.scalars().all()
    return [_video_dict(v) for v in videos]

@router.delete("/videos/{video_id}")
async def delete_video(
    video_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    video = await db.get(CourseVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="동영상을 찾을 수 없습니다.")
    course = await db.get(Course, video.course_id)
    if not course or course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    full_path = f"uploads/{video.file_path}"
    if os.path.exists(full_path):
        os.remove(full_path)

    await db.delete(video)
    await db.commit()
    return {"message": "삭제되었습니다."}

@router.get("/videos/{video_id}/progress")
async def get_video_progress_teacher(
    video_id: str,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
):
    video = await db.get(CourseVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="동영상을 찾을 수 없습니다.")
    course = await db.get(Course, video.course_id)
    if not course or course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    students_result = await db.execute(
        select(User).join(CourseEnrollment, CourseEnrollment.student_id == User.id)
        .where(CourseEnrollment.course_id == video.course_id)
    )
    students = students_result.scalars().all()

    progress_result = await db.execute(
        select(VideoProgress).where(VideoProgress.video_id == video_id)
    )
    progress_map = {p.student_id: p for p in progress_result.scalars().all()}

    out = []
    for s in students:
        p = progress_map.get(s.id)
        pct = round(p.watched_seconds / p.total_seconds * 100, 1) if p and p.total_seconds > 0 else 0
        out.append({
            "studentId": s.id,
            "studentName": s.name,
            "watchedSeconds": p.watched_seconds if p else 0,
            "totalSeconds": p.total_seconds if p else 0,
            "completed": p.completed if p else False,
            "watchedPct": pct,
            "lastUpdatedAt": p.last_updated_at.isoformat() if p else None,
        })
    return out
