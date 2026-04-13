import asyncio
import json
import re
import anthropic
from app.core.config import settings

_client: anthropic.Anthropic | None = None

def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


def _call_sync(system: str, user: str, max_tokens: int = 1500) -> str:
    client = _get_client()
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return msg.content[0].text.strip()


async def _call(system: str, user: str, max_tokens: int = 1500) -> str:
    return await asyncio.to_thread(_call_sync, system, user, max_tokens)


SYSTEM = """당신은 대한민국 중고등학생의 진로를 안내하는 전문 AI 상담사입니다.
학생의 꿈을 존중하며 실질적이고 따뜻한 조언을 한국어로 제공합니다."""


async def get_career_guidance(career_name: str) -> dict:
    user = f"""'{career_name}'을(를) 꿈꾸는 학생에게 아래 JSON 형식으로만 답변하세요. 다른 텍스트 없이 순수 JSON만:
{{
  "overview": "직업 한 줄 소개",
  "required_skills": ["역량1", "역량2", "역량3", "역량4"],
  "related_subjects": ["과목1", "과목2", "과목3"],
  "related_majors": ["전공1", "전공2", "전공3"],
  "certifications": ["자격증/시험1", "자격증/시험2"],
  "roadmap": ["중학교 단계", "고등학교 단계", "대학교/취업 단계"],
  "encouragement": "학생 응원 메시지 1~2문장"
}}"""
    try:
        raw = await _call(SYSTEM, user, max_tokens=1000)
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return {
        "overview": f"{career_name}은(는) 전문성과 열정이 필요한 직업입니다.",
        "required_skills": ["전문 지식", "문제 해결 능력", "소통 능력", "꾸준한 학습"],
        "related_subjects": ["수학", "과학", "국어", "영어"],
        "related_majors": ["관련 학과"],
        "certifications": [],
        "roadmap": ["기초 학습 (중학교)", "전공 탐색 (고등학교)", "전문 교육 (대학교)"],
        "encouragement": f"{career_name}의 꿈을 향해 힘차게 나아가세요!"
    }


async def chat_about_career(career_name: str, history: list[dict], new_message: str) -> str:
    system = f"""{SYSTEM}
현재 학생의 희망 직업: {career_name}
이 직업과 관련된 질문에 집중하여 답변하세요."""

    messages = []
    for msg in history[-8:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": new_message})

    try:
        client = _get_client()
        msg = await asyncio.to_thread(
            client.messages.create,
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            system=system,
            messages=messages,
        )
        return msg.content[0].text.strip()
    except Exception:
        return "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."


async def generate_career_questions(career_name: str, subject: str | None, count: int) -> list[dict]:
    subject_hint = f"특히 '{subject}' 과목과 연계하여" if subject else ""
    user = f"""'{career_name}'이(가) 되기 위해 필요한 지식을 평가하는 예상 문제 {count}개를 {subject_hint} JSON 배열로만 반환하세요:
[
  {{
    "type": "객관식",
    "content": "문제 내용",
    "options": ["① 보기1", "② 보기2", "③ 보기3", "④ 보기4"],
    "answer": "① 보기1",
    "explanation": "해설",
    "career_relevance": "이 문제가 {career_name}에게 왜 중요한지"
  }}
]
JSON 배열만 반환하세요."""
    try:
        raw = await _call(SYSTEM, user, max_tokens=2000)
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return []
