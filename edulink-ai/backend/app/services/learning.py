from datetime import datetime, timezone
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.learning_log import LearningLog
from app.models.submission import Submission
from app.models.course import CourseEnrollment
from app.models.assessment import Assessment

def calculate_risk_score(logs: list, submissions: list) -> dict:
    score = 0
    reasons = []
    now = datetime.now(timezone.utc)

    if logs:
        last_log = max(logs, key=lambda l: l.logged_at)
        days_inactive = (now - last_log.logged_at.replace(tzinfo=timezone.utc) if last_log.logged_at.tzinfo is None else now - last_log.logged_at).days
        if days_inactive >= 7:
            score += 40; reasons.append(f"{days_inactive}일간 미접속")
        elif days_inactive >= 3:
            score += 20; reasons.append(f"{days_inactive}일간 미접속")
    else:
        score += 40; reasons.append("학습 기록 없음")

    if len(submissions) == 0:
        score += 30; reasons.append("제출 기록 없음")
    elif len(submissions) <= 1:
        score += 15; reasons.append("제출 횟수 매우 낮음")

    recent = sorted(submissions, key=lambda s: s.submitted_at, reverse=True)[:5]
    scores = [s.ai_score for s in recent if s.ai_score is not None]
    if scores:
        avg = sum(scores) / len(scores)
        if avg < 40:
            score += 20; reasons.append(f"평균 점수 {avg:.0f}점")
        elif avg < 60:
            score += 10; reasons.append(f"평균 점수 {avg:.0f}점")

    durations = [l.duration_sec for l in logs if l.duration_sec > 0]
    if durations and (sum(durations) / len(durations)) < 300:
        score += 10; reasons.append("평균 세션 5분 미만")

    final = min(score, 100)
    return {
        "risk_score": final,
        "risk_level": "높음" if final >= 70 else "보통" if final >= 40 else "낮음",
        "reasons": reasons
    }

async def get_student_recommendations(student_id: str, db: AsyncSession) -> list:
    result = await db.execute(
        select(Submission).where(Submission.student_id == student_id)
        .order_by(Submission.submitted_at.desc()).limit(10)
    )
    submissions = result.scalars().all()

    weak_subjects = []
    for sub in submissions:
        if sub.ai_score is not None and sub.ai_score < 60:
            ass_result = await db.execute(
                select(Assessment).where(Assessment.id == sub.assessment_id)
            )
            assessment = ass_result.scalar_one_or_none()
            if assessment:
                weak_subjects.append(assessment.course_id)

    recommendations = []
    for i, course_id in enumerate(set(weak_subjects[:3])):
        recommendations.append({
            "id": f"rec_{i}",
            "title": "약점 보완 학습",
            "type": "보충학습",
            "subject": "해당 과목",
            "reason": "최근 낮은 점수 기록",
            "estimatedMinutes": 30
        })

    if not recommendations:
        recommendations.append({
            "id": "rec_default",
            "title": "오늘의 학습 추천",
            "type": "문제풀기",
            "subject": "전체",
            "reason": "꾸준한 학습을 위한 추천",
            "estimatedMinutes": 20
        })

    return recommendations
