"""
HuggingFace Inference API 기반 진로 AI 서비스
모델: Qwen/Qwen2.5-72B-Instruct (한국어 최고 성능)
"""
from huggingface_hub import InferenceClient
from app.core.config import settings
import asyncio
import json
import re

_client: InferenceClient | None = None


def _get_client() -> InferenceClient:
    global _client
    if _client is None:
        _client = InferenceClient(
            model="Qwen/Qwen2.5-72B-Instruct",
            token=settings.HF_TOKEN,
        )
    return _client


def _chat_sync(messages: list[dict], max_tokens: int = 1500) -> str:
    """동기 HTTP 호출 (asyncio.to_thread 로 실행)"""
    client = _get_client()
    response = client.chat_completion(
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


async def _chat(messages: list[dict], max_tokens: int = 1500) -> str:
    """비동기 래퍼 - 이벤트 루프 블로킹 방지"""
    try:
        return await asyncio.to_thread(_chat_sync, messages, max_tokens)
    except Exception as e:
        raise RuntimeError(f"HuggingFace API 호출 실패: {e}") from e


CAREER_SYSTEM_PROMPT = """당신은 대한민국 학생들의 진로를 안내하는 전문 AI 상담사입니다.
학생의 꿈과 목표를 존중하며, 실질적이고 친절한 조언을 한국어로 제공합니다.
진로에 필요한 학습 경로, 자격증, 대학 전공, 현실적인 직업 정보를 알려주세요.
짧고 명확하게 답변하되, 학생이 용기를 가질 수 있도록 긍정적인 톤을 유지하세요."""


async def get_career_guidance(career_name: str) -> dict:
    """진로 안내 정보 생성 (로드맵, 필요 역량, 관련 전공 등)"""
    messages = [
        {"role": "system", "content": CAREER_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"""'{career_name}'을(를) 꿈꾸는 학생에게 다음 정보를 JSON 형식으로 알려주세요:
{{
  "overview": "직업 한 줄 소개",
  "required_skills": ["필요 역량 1", "필요 역량 2", ...],
  "related_subjects": ["관련 학교 과목 1", "관련 학교 과목 2", ...],
  "related_majors": ["관련 대학 전공 1", "관련 대학 전공 2", ...],
  "certifications": ["관련 자격증/시험 1", ...],
  "roadmap": ["단계 1 (중학교)", "단계 2 (고등학교)", "단계 3 (대학교/취업)"],
  "encouragement": "학생을 위한 응원 메시지"
}}
JSON만 반환하고 다른 텍스트는 포함하지 마세요."""
        }
    ]
    try:
        raw = await _chat(messages, max_tokens=1000)
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    # 파싱 실패 시 기본 구조 반환
    return {
        "overview": f"{career_name}은(는) 전문성과 열정이 필요한 직업입니다.",
        "required_skills": ["전문 지식", "문제 해결 능력", "소통 능력", "꾸준한 학습"],
        "related_subjects": ["수학", "과학", "국어", "영어"],
        "related_majors": ["관련 학과 진학"],
        "certifications": [],
        "roadmap": ["기초 학습 (중학교)", "전공 탐색 및 준비 (고등학교)", "전문 교육 및 취업 (대학교)"],
        "encouragement": f"{career_name}의 꿈을 향해 힘차게 나아가세요! 매일 조금씩 성장하면 반드시 이룰 수 있습니다."
    }


async def chat_about_career(career_name: str, history: list[dict], new_message: str) -> str:
    """진로 관련 대화 (멀티턴 채팅)"""
    system = f"""{CAREER_SYSTEM_PROMPT}
현재 학생의 희망 직업: {career_name}
이 직업과 관련된 질문에 집중하여 답변하세요. 관련 없는 주제는 부드럽게 진로 주제로 돌아오세요."""

    messages = [{"role": "system", "content": system}]
    for msg in history[-8:]:  # 최근 8개 메시지만 컨텍스트에 포함
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": new_message})

    try:
        return await _chat(messages, max_tokens=800)
    except Exception:
        return "죄송합니다. 현재 AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요."


async def generate_career_questions(career_name: str, subject: str | None, count: int) -> list[dict]:
    """진로 연계 예상 문제 생성"""
    subject_hint = f"특히 '{subject}' 과목과 연계하여" if subject else ""
    messages = [
        {"role": "system", "content": CAREER_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"""'{career_name}'이(가) 되기 위해 필요한 지식을 평가하는 예상 문제 {count}개를 {subject_hint} 만들어주세요.
다음 JSON 배열 형식으로만 반환하세요:
[
  {{
    "type": "객관식" 또는 "단답형" 또는 "서술형",
    "content": "문제 내용",
    "options": ["보기1", "보기2", "보기3", "보기4"] (객관식만, 나머지는 null),
    "answer": "정답",
    "explanation": "해설",
    "career_relevance": "이 문제가 {career_name}에게 왜 중요한지 한 줄 설명"
  }}
]
JSON 배열만 반환하고 다른 텍스트는 포함하지 마세요."""
        }
    ]
    try:
        raw = await _chat(messages, max_tokens=2000)
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return []
