from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import require_role
from app.models.user import User
from app.models.course import Course
from app.services.analytics import get_dashboard_metrics, get_at_risk_students, generate_report

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/dashboard")
async def dashboard(current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    return await get_dashboard_metrics(db)

@router.get("/at-risk")
async def at_risk(threshold: int = Query(default=60), current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    return await get_at_risk_students(threshold, db)

@router.get("/report")
async def report(course_id: str = Query(default=None), period: str = Query(default="week"), current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    return await generate_report(period, course_id, db)

@router.get("/courses")
async def get_courses(current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course))
    courses = result.scalars().all()
    return [{"id": c.id, "title": c.title, "subject": c.subject, "teacherId": c.teacher_id, "createdAt": c.created_at.isoformat()} for c in courses]

@router.get("/students")
async def get_students(current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.role == "student"))
    students = result.scalars().all()
    return [{"id": s.id, "name": s.name, "email": s.email, "createdAt": s.created_at.isoformat()} for s in students]
