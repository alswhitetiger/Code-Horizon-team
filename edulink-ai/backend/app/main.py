from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import auth, teacher, student, admin
from app.routers import career
import os, uuid

os.makedirs("uploads/videos", exist_ok=True)

app = FastAPI(title="EduLink AI API", version="1.0.0")


@app.on_event("startup")
async def startup_event():
    if settings.SEED_DEMO_DATA:
        await _seed_demo_data()


async def _seed_demo_data():
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.core.auth import hash_password
    from app.models.user import User

    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(User).where(User.email == "teacher@demo.com"))
        if existing.scalar_one_or_none():
            return

        demo_users = [
            User(id=str(uuid.uuid4()), email="teacher@demo.com",
                 password_hash=hash_password("demo1234"), name="김선생", role="teacher", is_verified=True),
            User(id=str(uuid.uuid4()), email="student@demo.com",
                 password_hash=hash_password("demo1234"), name="이학생", role="student", is_verified=True),
            User(id=str(uuid.uuid4()), email="admin@demo.com",
                 password_hash=hash_password("demo1234"), name="관리자", role="admin", is_verified=True),
        ]
        db.add_all(demo_users)
        await db.commit()
        print("[SEED] 데모 계정 생성 완료")

# CORS: credentials 사용 시 특정 origin만 허용해야 함 (브라우저 spec)
allowed_origins = [settings.FRONTEND_URL]
if settings.FRONTEND_URL != "http://localhost:3000":
    allowed_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(teacher.router)
app.include_router(student.router)
app.include_router(admin.router)
app.include_router(career.router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "EduLink AI"}
