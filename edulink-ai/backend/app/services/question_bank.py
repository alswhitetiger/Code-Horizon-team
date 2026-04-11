import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.question_bank import QuestionBank


async def get_questions_from_bank(
    db: AsyncSession,
    subject: str,
    grade_level: str,
    topic: str,
    question_type: str,
    difficulty: str,
    count: int,
) -> list[dict]:
    """
    문제 은행에서 조건에 맞는 문제를 랜덤 샘플링하여 반환합니다.
    요청 수보다 적은 경우 가진 만큼만 반환합니다.
    """
    result = await db.execute(
        select(QuestionBank).where(
            QuestionBank.subject == subject,
            QuestionBank.grade_level == grade_level,
            QuestionBank.topic == topic,
            QuestionBank.question_type == question_type,
            QuestionBank.difficulty == difficulty,
        )
    )
    rows = result.scalars().all()
    if not rows:
        return []

    sample_size = min(count, len(rows))
    selected = random.sample(rows, sample_size)

    return [
        {
            "id": q.id,
            "type": q.question_type,
            "content": q.content,
            "options": q.options,
            "answer": q.answer,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
            "rubric": q.rubric,
        }
        for q in selected
    ]


async def count_questions_in_bank(
    db: AsyncSession,
    subject: str,
    grade_level: str,
    topic: str,
) -> int:
    return await db.scalar(
        select(func.count(QuestionBank.id)).where(
            QuestionBank.subject == subject,
            QuestionBank.grade_level == grade_level,
            QuestionBank.topic == topic,
        )
    ) or 0
