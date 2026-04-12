"""
정적 문제 은행 시드 스크립트 (Claude API 불필요)
과목별, 학년별, 주제별로 10개씩 샘플 문제를 question_bank 테이블에 저장합니다.
"""

import asyncio
import sys
import uuid

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

try:
    from app.core.config import settings
    DATABASE_URL = settings.DATABASE_URL
except Exception:
    import os
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://edulink:edulink1234@127.0.0.1:5432/edulink",
    )

from app.models.question_bank import QuestionBank

# 과목/학년/주제별로 10개씩 채워넣기 위한 데이터셋
TOPIC_DATA = [
    ("수학", "중1", "일차방정식"),
    ("수학", "중1", "정수와 유리수"),
    ("수학", "중1", "소인수분해"),
    ("수학", "중1", "문자와 식"),
    ("영어", "중1", "be동사와 일반동사"),
    ("영어", "중1", "현재진행형"),
    ("영어", "중1", "의문문과 부정문"),
    ("과학탐구", "중1", "힘과 운동"),
    ("과학탐구", "중1", "물질의 상태와 변화"),
    ("국어", "중1", "문법 (품사)"),
    ("국어", "중1", "문학 감상 (시)"),
    ("사회탐구", "중1", "지리적 특성"),
    ("사회탐구", "중1", "문화의 다양성"),
    
    # 중2 주요 주제 추가
    ("수학", "중2", "연립방정식"),
    ("수학", "중2", "일차함수"),
    ("영어", "중2", "to부정사"),
    ("영어", "중2", "동명사"),
    
    # 고1 주요 주제 추가
    ("수학", "고1", "다항식"),
    ("수학", "고1", "방정식과 부등식"),
    ("영어", "고1", "어법·어휘"),
]

def generate_10_questions(subject, grade, topic):
    qs = []
    # 10 questions: 4 Multiple Choice (객관식), 3 Short Answer (단답형), 3 Essay (서술형)
    for i in range(1, 11):
        if i <= 4:
            q_type = "객관식"
            difficulty = "보통" if i <= 2 else "어려움"
            options = ["① 보기 1", "② 보기 2", "③ 보기 3", "④ 보기 4"]
            answer = "② 보기 2"
        elif i <= 7:
            q_type = "단답형"
            difficulty = "쉬움" if i == 5 else ("보통" if i == 6 else "어려움")
            options = None
            answer = f"{topic} 정답 {i}"
        else:
            q_type = "서술형"
            difficulty = "보통" if i <= 9 else "어려움"
            options = None
            answer = f"{topic}에 대한 상세한 서술형 모범 답안입니다. {i}"
            
        qs.append({
            "subject": subject,
            "grade_level": grade,
            "topic": topic,
            "question_type": q_type,
            "difficulty": difficulty,
            "content": f"[{subject} {grade} {topic}] 문제 {i}: 이 주제에 대한 {difficulty} 난이도의 {q_type} 문제입니다.",
            "options": options,
            "answer": answer,
            "explanation": f"{topic}의 핵심 원리를 설명하는 {i}번 문제의 상세 해설입니다.",
            "rubric": "정확성(50%), 논리성(50%)" if q_type == "서술형" else None
        })
    return qs

async def main() -> None:
    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    total_saved = 0

    async with AsyncSessionLocal() as session:
        for subject, grade, topic in TOPIC_DATA:
            # 기존 문제 삭제 후 10개 새로 삽입 (사용자 요청에 따라 10개씩 맞춤)
            # await session.execute(delete(QuestionBank).where(QuestionBank.subject == subject, ...)) 
            # 여기서는 중복 방지만 처리
            
            qs = generate_10_questions(subject, grade, topic)
            for q_data in qs:
                existing = await session.scalar(
                    select(func.count(QuestionBank.id)).where(
                        QuestionBank.content == q_data["content"],
                        QuestionBank.subject == q_data["subject"],
                    )
                )
                if not existing:
                    q = QuestionBank(id=str(uuid.uuid4()), **q_data)
                    session.add(q)
                    total_saved += 1
        
        await session.commit()

    await engine.dispose()
    print(f"\n성공적으로 {total_saved}개의 문제를 시드했습니다. (주제당 10개)")

if __name__ == "__main__":
    asyncio.run(main())
