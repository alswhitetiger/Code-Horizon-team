from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import auth, teacher, student, admin
from app.routers import career
import os

os.makedirs("uploads/videos", exist_ok=True)

app = FastAPI(title="EduLink AI API", version="1.0.0")

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
