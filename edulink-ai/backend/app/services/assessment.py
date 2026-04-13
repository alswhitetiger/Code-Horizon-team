import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.models.assessment import Assessment
from app.models.submission import Submission
from app.services.ai_engine import grade_submission

_engine = create_async_engine(settings.DATABASE_URL)
_Session = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


async def auto_grade_submission(submission_id: str) -> None:
    """Background task: 제출 ID를 받아 자체 DB 세션으로 AI 채점"""
    async with _Session() as db:
        submission = await db.get(Submission, submission_id)
        if not submission:
            return

        assessment = await db.get(Assessment, submission.assessment_id)
        if not assessment:
            return

        questions = assessment.questions if isinstance(assessment.questions, list) else []
        total_score = 0
        per_question = []
        all_strengths = []
        all_improvements = []

        for idx, q in enumerate(questions):
            q_id = q.get("id", q.get("content", "")[:20])
            # 프론트엔드 fallback key (q.id 없을 때 q_0, q_1... 형식)
            student_ans = submission.answers.get(q_id) or submission.answers.get(f"q_{idx}") or submission.answers.get(str(idx), "")
            rubric = q.get("rubric") or "정확성과 완성도를 기준으로 채점"

            grading = await grade_submission(
                question=q.get("content", ""),
                model_answer=q.get("answer", ""),
                rubric=rubric,
                student_answer=student_ans,
            )
            per_question.append({
                "questionId": q_id,
                "score": grading.get("score", 0),
                "comment": grading.get("feedback", ""),
            })
            total_score += grading.get("score", 0)
            all_strengths.extend(grading.get("strengths", []))
            all_improvements.extend(grading.get("improvements", []))

        avg_score = total_score / len(questions) if questions else 0
        submission.ai_score = round(avg_score, 1)
        submission.ai_feedback = f"전체 평균 점수: {avg_score:.1f}점"
        submission.ai_detail = {
            "strengths": list(set(all_strengths))[:3],
            "improvements": list(set(all_improvements))[:3],
            "perQuestion": per_question,
        }
        await db.commit()
