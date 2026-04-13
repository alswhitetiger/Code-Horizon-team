from datetime import datetime, timezone, timedelta
import asyncio
import anthropic
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.user import User
from app.models.submission import Submission
from app.models.learning_log import LearningLog
from app.models.course import CourseEnrollment
from app.core.config import settings
from app.services.cache import get_cache, set_cache, make_cache_key, TTL
from app.services.learning import calculate_risk_score

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

async def get_dashboard_metrics(db: AsyncSession) -> dict:
    cache_key = make_cache_key("dashboard")
    cached = await get_cache(cache_key)
    if cached:
        return cached

    total_students = await db.scalar(
        select(func.count(User.id)).where(User.role == "student")
    ) or 0

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
    active_today = await db.scalar(
        select(func.count(func.distinct(LearningLog.student_id)))
        .where(LearningLog.logged_at >= today_start)
    ) or 0

    all_subs = await db.execute(select(Submission))
    submissions = all_subs.scalars().all()
    avg_score = 0.0
    if submissions:
        scores = [s.ai_score for s in submissions if s.ai_score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0.0

    metrics = {
        "totalStudents": total_students,
        "activeToday": active_today,
        "atRiskCount": 0,
        "avgProgressPct": 65.0,
        "totalSubmissions": len(submissions),
        "avgScore": round(avg_score, 1)
    }
    await set_cache(cache_key, metrics, TTL["dashboard"])
    return metrics

async def get_at_risk_students(threshold: int, db: AsyncSession) -> list:
    cache_key = make_cache_key("at_risk", threshold=threshold)
    cached = await get_cache(cache_key)
    if cached:
        return cached

    students_result = await db.execute(
        select(User).where(User.role == "student")
    )
    students = students_result.scalars().all()

    at_risk = []
    for student in students:
        logs_result = await db.execute(
            select(LearningLog).where(LearningLog.student_id == student.id)
        )
        logs = logs_result.scalars().all()

        subs_result = await db.execute(
            select(Submission).where(Submission.student_id == student.id)
        )
        subs = subs_result.scalars().all()

        risk = calculate_risk_score(logs, subs)
        if risk["risk_score"] >= threshold:
            last_active = max((l.logged_at for l in logs), default=datetime.now(timezone.utc))
            scores = [s.ai_score for s in subs if s.ai_score is not None]
            avg_score = sum(scores) / len(scores) if scores else 0

            at_risk.append({
                "studentId": student.id,
                "name": student.name,
                "riskScore": risk["risk_score"],
                "riskLevel": risk["risk_level"],
                "reasons": risk["reasons"],
                "lastActiveAt": last_active.isoformat(),
                "progressPct": min(len(subs) * 10, 100)
            })

    at_risk.sort(key=lambda x: x["riskScore"], reverse=True)
    await set_cache(cache_key, at_risk, TTL["at_risk"])
    return at_risk

async def generate_report(period: str, course_id: str | None, db: AsyncSession) -> dict:
    cache_key = make_cache_key("report", period=period, course_id=course_id)
    cached = await get_cache(cache_key)
    if cached:
        return cached

    metrics = await get_dashboard_metrics(db)
    at_risk = await get_at_risk_students(60, db)

    active_rate = round(metrics["activeToday"] / metrics["totalStudents"] * 100, 1) if metrics["totalStudents"] > 0 else 0
    at_risk_summary = f"총 {len(at_risk)}명의 이탈 위험 학생이 감지되었습니다."

    prompt = f"""당신은 교육 데이터 분석 전문가입니다.

[분석 기간] {period}
[핵심 지표]
- 총 학생수: {metrics['totalStudents']}명
- 오늘 활성: {metrics['activeToday']}명 ({active_rate}%)
- 이탈 위험: {metrics['atRiskCount']}명
- 평균 진도: {metrics['avgProgressPct']}%
- 평균 점수: {metrics['avgScore']}점
- 총 제출: {metrics['totalSubmissions']}건

[이탈 위험 현황] {at_risk_summary}

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "summary": "전체 현황 2문장 요약",
  "highlights": ["주목할 점 1", "주목할 점 2", "주목할 점 3"],
  "concerns": ["우려 사항1", "우려 사항2"],
  "recommendations": ["권고 조치1", "권고 조치2", "권고 조치3"],
  "generated_at": "{datetime.now(timezone.utc).isoformat()}"
}}"""

    try:
        message = await asyncio.to_thread(
            client.messages.create,
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )

        import re, json
        text = message.content[0].text
        try:
            result = json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', text, re.DOTALL)
            result = json.loads(match.group()) if match else _fallback_report(metrics, at_risk, period)
    except Exception:
        result = _fallback_report(metrics, at_risk, period)

    await set_cache(cache_key, result, TTL["report"])
    return result


def _fallback_report(metrics: dict, at_risk: list, period: str) -> dict:
    active_rate = round(metrics["activeToday"] / metrics["totalStudents"] * 100, 1) if metrics["totalStudents"] > 0 else 0
    return {
        "summary": f"총 {metrics['totalStudents']}명의 학생 중 오늘 {metrics['activeToday']}명({active_rate}%)이 활동했습니다. 평균 점수는 {metrics['avgScore']}점이며 총 {metrics['totalSubmissions']}건의 제출이 있었습니다.",
        "highlights": [
            f"총 학생 수: {metrics['totalStudents']}명",
            f"오늘 활성 학생: {metrics['activeToday']}명 ({active_rate}%)",
            f"전체 제출 건수: {metrics['totalSubmissions']}건",
        ],
        "concerns": [
            f"이탈 위험 학생 {len(at_risk)}명 모니터링 필요",
        ] if at_risk else ["특이사항 없음"],
        "recommendations": [
            "정기적인 학습 현황 점검 권장",
            "이탈 위험 학생 개별 상담 실시",
            "우수 학생 성과 공유로 동기 부여",
        ],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
