from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import require_role
from app.models.user import User
from app.models.career import CareerGoal
from app.schemas.career import CareerGoalCreate, CareerChatRequest, CareerQuestionsRequest
from app.services.career_ai import get_career_guidance, chat_about_career, generate_career_questions
import uuid

router = APIRouter(prefix="/api/career", tags=["career"])


# ─────────────────────────────────────────
# 학생 전용 엔드포인트
# ─────────────────────────────────────────

@router.get("/goal")
async def get_my_goal(
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db)
):
    """내 진로 목표 조회"""
    result = await db.execute(select(CareerGoal).where(CareerGoal.student_id == current_user.id))
    goal = result.scalar_one_or_none()
    if not goal:
        return None
    return {
        "id": goal.id,
        "careerName": goal.career_name,
        "reason": goal.reason,
        "updatedAt": goal.updated_at.isoformat() if goal.updated_at else None,
    }


@router.post("/goal")
async def set_goal(
    body: CareerGoalCreate,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db)
):
    """진로 목표 설정/수정"""
    result = await db.execute(select(CareerGoal).where(CareerGoal.student_id == current_user.id))
    existing = result.scalar_one_or_none()
    if existing:
        existing.career_name = body.career_name
        existing.reason = body.reason
    else:
        goal = CareerGoal(
            id=str(uuid.uuid4()),
            student_id=current_user.id,
            career_name=body.career_name,
            reason=body.reason,
        )
        db.add(goal)
    await db.commit()
    return {"message": "진로 목표가 저장되었습니다.", "careerName": body.career_name}


@router.get("/guidance")
async def career_guidance(
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db)
):
    """내 진로 목표에 대한 AI 안내 정보"""
    result = await db.execute(select(CareerGoal).where(CareerGoal.student_id == current_user.id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="진로 목표를 먼저 설정해주세요.")
    guidance = await get_career_guidance(goal.career_name)
    return {"careerName": goal.career_name, "guidance": guidance}


@router.post("/chat")
async def career_chat(
    body: CareerChatRequest,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db)
):
    """진로 AI 채팅"""
    result = await db.execute(select(CareerGoal).where(CareerGoal.student_id == current_user.id))
    goal = result.scalar_one_or_none()
    career_name = goal.career_name if goal else "미설정"

    history = [{"role": m.role, "content": m.content} for m in body.history]
    reply = await chat_about_career(career_name, history, body.message)
    return {"reply": reply}


@router.post("/questions")
async def career_questions(
    body: CareerQuestionsRequest,
    current_user: User = Depends(require_role("student")),
):
    """진로 연계 예상 문제 생성"""
    questions = await generate_career_questions(body.career_name, body.subject, body.count)
    return {"careerName": body.career_name, "questions": questions}


# ─────────────────────────────────────────
# 교사 전용 엔드포인트
# ─────────────────────────────────────────

@router.get("/teacher/students")
async def get_students_careers(
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db)
):
    """담당 강의 학생들의 진로 목표 현황"""
    from app.models.course import Course, CourseEnrollment
    from sqlalchemy import select as sa_select

    # 교사의 강의에 등록된 학생 ID 조회
    course_result = await db.execute(
        sa_select(Course).where(Course.teacher_id == current_user.id)
    )
    courses = course_result.scalars().all()
    course_ids = [c.id for c in courses]

    if not course_ids:
        return []

    enroll_result = await db.execute(
        sa_select(CourseEnrollment).where(CourseEnrollment.course_id.in_(course_ids))
    )
    enrollments = enroll_result.scalars().all()
    student_ids = list({e.student_id for e in enrollments})

    # 학생 정보 + 진로 목표 조회
    student_result = await db.execute(
        sa_select(User).where(User.id.in_(student_ids))
    )
    students = student_result.scalars().all()

    career_result = await db.execute(
        sa_select(CareerGoal).where(CareerGoal.student_id.in_(student_ids))
    )
    goals = {g.student_id: g for g in career_result.scalars().all()}

    return [
        {
            "studentId": s.id,
            "studentName": s.name,
            "careerName": goals[s.id].career_name if s.id in goals else None,
            "reason": goals[s.id].reason if s.id in goals else None,
        }
        for s in students
    ]


@router.post("/teacher/questions")
async def teacher_generate_questions(
    body: CareerQuestionsRequest,
    current_user: User = Depends(require_role("teacher")),
):
    """교사용: 특정 진로를 위한 수업 연계 문제 생성"""
    questions = await generate_career_questions(body.career_name, body.subject, body.count)
    return {"careerName": body.career_name, "subject": body.subject, "questions": questions}
