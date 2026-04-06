from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.assessment import Assessment
from app.models.submission import Submission
from app.services.ai_engine import grade_submission

async def auto_grade_submission(submission: Submission, db: AsyncSession) -> None:
    result = await db.execute(select(Assessment).where(Assessment.id == submission.assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        return

    questions = assessment.questions if isinstance(assessment.questions, list) else []
    total_score = 0
    per_question = []
    all_strengths = []
    all_improvements = []

    for q in questions:
        q_id = q.get("id", q.get("content", "")[:20])
        student_ans = submission.answers.get(q_id, "")
        rubric = q.get("rubric") or "정확성과 완성도를 기준으로 채점"

        grading = await grade_submission(
            question=q.get("content", ""),
            model_answer=q.get("answer", ""),
            rubric=rubric,
            student_answer=student_ans
        )
        per_question.append({
            "questionId": q_id,
            "score": grading.get("score", 0),
            "comment": grading.get("feedback", "")
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
        "perQuestion": per_question
    }
    await db.commit()
