from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import require_role, hash_password
from app.models.user import User
from app.models.course import Course
from app.services.analytics import get_dashboard_metrics, get_at_risk_students, generate_report
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(prefix="/api/admin", tags=["admin"])


class CreateUserRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str  # student | teacher | admin


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None

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


@router.get("/users")
async def get_all_users(role: Optional[str] = Query(default=None), current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    result = await db.execute(query.order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "createdAt": u.created_at.isoformat()} for u in users]


@router.post("/users")
async def create_user(body: CreateUserRequest, current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
    if body.role not in ("student", "teacher", "admin"):
        raise HTTPException(status_code=400, detail="유효하지 않은 역할입니다.")
    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=body.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


@router.patch("/users/{user_id}")
async def update_user(user_id: str, body: UpdateUserRequest, current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if body.name:
        user.name = body.name
    if body.role:
        if body.role not in ("student", "teacher", "admin"):
            raise HTTPException(status_code=400, detail="유효하지 않은 역할입니다.")
        user.role = body.role
    await db.commit()
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="자기 자신은 삭제할 수 없습니다.")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    await db.delete(user)
    await db.commit()
    return {"message": "사용자를 삭제했습니다."}
