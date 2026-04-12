"""
Seed script for EduLink AI demo data.

Usage:
    python seed.py

Creates demo users:
    - teacher@demo.com  / demo1234  (role: teacher)
    - student@demo.com  / demo1234  (role: student)
    - admin@demo.com    / demo1234  (role: admin)

Also creates sample courses, assessments, enrollments, and submissions.
"""

import asyncio
import sys
import uuid
from datetime import datetime, timezone, timedelta

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.core.auth import hash_password
from app.core.database import Base
from app.models.user import User
from app.models.course import Course, CourseEnrollment
from app.models.assessment import Assessment
from app.models.submission import Submission
from app.models.learning_log import LearningLog

engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed():
    await create_tables()

    async with AsyncSessionLocal() as db:
        # ── Check if already seeded ──────────────────────────────────────────
        existing = await db.execute(select(User).where(User.email == "teacher@demo.com"))
        if existing.scalar_one_or_none():
            print("Seed data already exists. Skipping.")
            return

        # ── Users ────────────────────────────────────────────────────────────
        teacher_id = str(uuid.uuid4())
        student_id = str(uuid.uuid4())
        student2_id = str(uuid.uuid4())
        admin_id = str(uuid.uuid4())

        teacher = User(
            id=teacher_id,
            email="teacher@demo.com",
            password_hash=hash_password("demo1234"),
            name="김선생",
            role="teacher",
        )
        student = User(
            id=student_id,
            email="student@demo.com",
            password_hash=hash_password("demo1234"),
            name="이학생",
            role="student",
        )
        student2 = User(
            id=student2_id,
            email="student2@demo.com",
            password_hash=hash_password("demo1234"),
            name="박학생",
            role="student",
        )
        admin = User(
            id=admin_id,
            email="admin@demo.com",
            password_hash=hash_password("demo1234"),
            name="관리자",
            role="admin",
        )
        db.add_all([teacher, student, student2, admin])
        await db.flush()

        # ── Courses ──────────────────────────────────────────────────────────
        course1_id = str(uuid.uuid4())
        course2_id = str(uuid.uuid4())

        course1 = Course(
            id=course1_id,
            teacher_id=teacher_id,
            title="중학교 수학 기초",
            subject="수학",
            grade_level="중학교 1학년",
        )
        course2 = Course(
            id=course2_id,
            teacher_id=teacher_id,
            title="영어 독해 심화",
            subject="영어",
            grade_level="중학교 2학년",
        )
        db.add_all([course1, course2])
        await db.flush()

        # ── Enrollments ──────────────────────────────────────────────────────
        enrollment1 = CourseEnrollment(
            id=str(uuid.uuid4()),
            course_id=course1_id,
            student_id=student_id,
        )
        enrollment2 = CourseEnrollment(
            id=str(uuid.uuid4()),
            course_id=course2_id,
            student_id=student_id,
        )
        enrollment3 = CourseEnrollment(
            id=str(uuid.uuid4()),
            course_id=course1_id,
            student_id=student2_id,
        )
        db.add_all([enrollment1, enrollment2, enrollment3])
        await db.flush()

        # ── Assessments ──────────────────────────────────────────────────────
        assessment1_id = str(uuid.uuid4())
        assessment2_id = str(uuid.uuid4())

        sample_questions_math = [
            {
                "id": "q1",
                "type": "객관식",
                "content": "2x + 3 = 11 일 때, x의 값은?",
                "options": ["① 3", "② 4", "③ 5", "④ 6"],
                "answer": "② 4",
                "explanation": "2x = 8, x = 4",
                "difficulty": "쉬움",
                "rubric": None,
            },
            {
                "id": "q2",
                "type": "단답형",
                "content": "직각삼각형에서 빗변의 길이가 5, 한 변의 길이가 3일 때 나머지 변의 길이는?",
                "options": None,
                "answer": "4",
                "explanation": "피타고라스 정리: 3² + b² = 5²  →  b = 4",
                "difficulty": "보통",
                "rubric": None,
            },
        ]

        sample_questions_english = [
            {
                "id": "q1",
                "type": "서술형",
                "content": "다음 지문을 읽고 주제문을 한국어로 서술하시오. (Climate change is one of the most pressing issues...)",
                "options": None,
                "answer": "기후 변화는 현재 가장 시급한 문제 중 하나이다.",
                "explanation": "주제문은 글 전체의 핵심 내용을 담아야 합니다.",
                "difficulty": "보통",
                "rubric": "정확성 50점, 완성도 30점, 표현력 20점",
            }
        ]

        assessment1 = Assessment(
            id=assessment1_id,
            course_id=course1_id,
            title="1차 수학 형성평가",
            questions=sample_questions_math,
            created_by=teacher_id,
        )
        assessment2 = Assessment(
            id=assessment2_id,
            course_id=course2_id,
            title="영어 독해 평가",
            questions=sample_questions_english,
            created_by=teacher_id,
        )
        db.add_all([assessment1, assessment2])
        await db.flush()

        # ── Submissions ──────────────────────────────────────────────────────
        submission1 = Submission(
            id=str(uuid.uuid4()),
            assessment_id=assessment1_id,
            student_id=student_id,
            answers={"q1": "② 4", "q2": "4"},
            ai_score=95.0,
            ai_feedback="전체 평균 점수: 95.0점. 정확하게 풀었습니다.",
            ai_detail={
                "strengths": ["정확한 계산", "개념 이해 우수"],
                "improvements": [],
                "perQuestion": [
                    {"questionId": "q1", "score": 100, "comment": "정답입니다."},
                    {"questionId": "q2", "score": 90, "comment": "거의 정확합니다."},
                ],
            },
            submitted_at=datetime.now(timezone.utc) - timedelta(days=2),
        )
        submission2 = Submission(
            id=str(uuid.uuid4()),
            assessment_id=assessment1_id,
            student_id=student2_id,
            answers={"q1": "① 3", "q2": "3"},
            ai_score=30.0,
            ai_feedback="전체 평균 점수: 30.0점. 기초 개념 복습이 필요합니다.",
            ai_detail={
                "strengths": [],
                "improvements": ["일차방정식 풀이 연습 필요", "피타고라스 정리 재학습"],
                "perQuestion": [
                    {"questionId": "q1", "score": 30, "comment": "오답입니다."},
                    {"questionId": "q2", "score": 30, "comment": "오답입니다."},
                ],
            },
            submitted_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
        db.add_all([submission1, submission2])
        await db.flush()

        # ── Learning Logs ────────────────────────────────────────────────────
        now = datetime.now(timezone.utc)
        logs = [
            LearningLog(
                id=str(uuid.uuid4()),
                student_id=student_id,
                course_id=course1_id,
                event_type="page_view",
                duration_sec=600,
                metadata_={"page": "lesson_1"},
                logged_at=now - timedelta(days=1),
            ),
            LearningLog(
                id=str(uuid.uuid4()),
                student_id=student_id,
                course_id=course1_id,
                event_type="quiz_start",
                duration_sec=1200,
                metadata_={"assessment_id": assessment1_id},
                logged_at=now - timedelta(hours=5),
            ),
            LearningLog(
                id=str(uuid.uuid4()),
                student_id=student_id,
                course_id=course2_id,
                event_type="page_view",
                duration_sec=300,
                metadata_={"page": "lesson_2"},
                logged_at=now - timedelta(hours=2),
            ),
            LearningLog(
                id=str(uuid.uuid4()),
                student_id=student2_id,
                course_id=course1_id,
                event_type="page_view",
                duration_sec=120,
                metadata_={"page": "lesson_1"},
                logged_at=now - timedelta(days=10),
            ),
        ]
        db.add_all(logs)

        await db.commit()
        print("Seed data created successfully!")
        print()
        print("Demo accounts:")
        print("  teacher@demo.com  /  demo1234  (teacher)")
        print("  student@demo.com  /  demo1234  (student)")
        print("  student2@demo.com /  demo1234  (student)")
        print("  admin@demo.com    /  demo1234  (admin)")


if __name__ == "__main__":
    asyncio.run(seed())
