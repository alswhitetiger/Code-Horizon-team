#!/usr/bin/env python3
"""
문제 은행 시드 스크립트
각 주제별로 10개의 문제를 생성하여 question_bank 테이블에 저장합니다.

사용법:
    cd edulink-ai/backend
    python seed_question_bank.py

이미 10개 이상 저장된 주제는 건너뜁니다 (멱등성 보장).
"""
import asyncio
import json
import re
import sys
import time
import uuid

import anthropic
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# ── TOPICS 정의 (프론트엔드와 동일하게 유지) ─────────────────────────────────
TOPICS: dict[str, dict[str, list[str]]] = {
    "국어": {
        "중1": ["문학 감상 (시)", "문학 감상 (소설)", "문법 (품사)", "읽기와 이해", "쓰기와 표현"],
        "중2": ["문학 (현대시)", "문학 (현대소설)", "문법 (문장 성분)", "설득하는 글쓰기", "매체 읽기"],
        "중3": ["문학 (고전시가)", "문학 (고전소설)", "문법 (음운과 단어)", "논술과 토론", "매체 언어와 표현"],
        "고1": ["문학의 이해", "국어의 역사", "다양한 글 읽기", "화법과 작문 기초", "언어와 매체"],
        "고2": ["현대시 심화", "현대소설 심화", "독서와 문법", "화법과 토론", "매체 비평"],
        "고3": ["수능 국어 문학", "수능 국어 독서", "수능 국어 언어와 매체", "수능 국어 화법과 작문", "EBS 연계 문학"],
    },
    "수학": {
        "중1": ["소인수분해", "정수와 유리수", "문자와 식", "일차방정식", "좌표평면과 그래프", "기본 도형", "평면도형과 입체도형"],
        "중2": ["유리수와 순환소수", "식의 계산", "일차부등식", "연립방정식", "일차함수", "도형의 성질", "도형의 닮음", "확률"],
        "중3": ["제곱근과 실수", "다항식의 인수분해", "이차방정식", "이차함수", "삼각비", "원의 성질", "통계"],
        "고1": ["다항식", "방정식과 부등식", "도형의 방정식", "집합과 명제", "함수", "경우의 수"],
        "고2": ["수열", "지수와 로그", "삼각함수", "수열의 극한", "미분"],
        "고3": ["적분", "확률과 통계", "미적분 심화", "기하", "수능 수학 유형 분석"],
    },
    "영어": {
        "중1": ["be동사와 일반동사", "현재진행형", "의문문과 부정문", "명사와 관사", "형용사와 부사"],
        "중2": ["과거시제와 미래시제", "조동사", "비교급과 최상급", "to부정사", "동명사", "접속사"],
        "중3": ["현재완료", "수동태", "관계대명사", "분사", "가정법", "간접화법"],
        "고1": ["독해 (주제·요지)", "독해 (빈칸 추론)", "독해 (글의 순서·삽입)", "어법·어휘", "영작문 기초"],
        "고2": ["장문 독해", "어휘 심화", "영어 듣기 전략", "수능 유형 분석", "독해 전략 심화"],
        "고3": ["수능 영어 독해", "수능 영어 듣기", "수능 영어 어법", "수능 영어 어휘", "EBS 연계 독해"],
    },
    "과학탐구": {
        "중1": ["과학과 측정", "물질의 상태와 변화", "물질의 성질", "힘과 운동", "빛과 파동", "생물의 다양성", "지구의 구조"],
        "중2": ["물질의 구성 (원소·원자)", "전기와 자기", "태양계", "식물의 구조와 기능", "동물의 구조와 기능", "날씨와 기후"],
        "중3": ["화학 반응식", "역학적 에너지", "파동과 빛", "세포분열과 유전", "자극과 반응", "생태계와 환경"],
        "고1": ["물질의 규칙성", "역학적 시스템", "지구 시스템", "생명 시스템", "화학 변화", "에너지"],
        "고2": ["물리학 (역학)", "물리학 (전자기)", "화학 (원소와 주기율표)", "화학 (화학 결합)", "생명과학 (세포와 물질대사)", "생명과학 (유전)", "지구과학 (판 구조론)", "지구과학 (대기와 해양)"],
        "고3": ["물리학II (전자기학 심화)", "물리학II (광학)", "화학II (열역학)", "화학II (전기화학)", "생명과학II (세포 신호전달)", "생명과학II (진화)", "지구과학II (우주)", "수능 과탐 유형 분석"],
    },
    "사회탐구": {
        "중1": ["지리적 특성", "자연환경과 인간 생활", "인문환경", "문화의 다양성"],
        "중2": ["정치와 민주주의", "경제생활의 이해", "사회의 변동", "법과 생활"],
        "중3": ["사회 불평등", "문화와 다양성", "글로벌 이슈", "정치 제도와 참여"],
        "고1": ["행복의 의미", "자연환경과 인간", "생활공간과 사회", "인권과 헌법", "시장 경제와 금융", "민주주의와 정치", "세계화와 평화"],
        "고2": ["한국지리", "세계지리", "경제", "정치와 법", "사회·문화", "한국사 (근현대)", "생활과 윤리"],
        "고3": ["수능 한국지리", "수능 세계지리", "수능 경제", "수능 정치와 법", "수능 사회·문화", "수능 생활과 윤리", "수능 한국사"],
    },
}

# ── 환경 변수에서 설정 로드 ──────────────────────────────────────────────────
try:
    from app.core.config import settings
    DATABASE_URL = settings.DATABASE_URL
    ANTHROPIC_API_KEY = settings.ANTHROPIC_API_KEY
except Exception:
    import os
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5432/edulink")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

from app.models.question_bank import QuestionBank  # noqa: E402 (after sys.path setup)

ai_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


# ── Claude API 호출 ──────────────────────────────────────────────────────────
def _call_claude_sync(prompt: str, max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            msg = ai_client.messages.create(
                model="claude-opus-4-6",
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )
            return msg.content[0].text
        except anthropic.APIStatusError as e:
            if e.status_code == 529 and attempt < max_retries - 1:
                wait = 2 ** attempt
                print(f"    API 과부하 (529), {wait}초 후 재시도...")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError("Claude API 호출 실패")


def _parse_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"JSON 파싱 실패:\n{text[:300]}")


def generate_questions_for_topic(subject: str, grade_level: str, topic: str) -> list[dict]:
    """
    특정 주제에 대해 10개의 문제를 생성합니다.
    구성: 객관식 4개(보통2·어려움2) + 단답형 3개(쉬움1·보통1·어려움1) + 서술형 3개(보통2·어려움1)
    """
    prompt = f"""당신은 10년 경력의 교육 전문가입니다.
아래 조건에 맞는 교육용 문제 10개를 생성해주세요.

[조건]
- 과목: {subject}
- 학년: {grade_level}
- 주제/단원: {topic}
- 구성 (반드시 지킬 것):
  * 객관식 4개: 난이도 보통 2개, 어려움 2개
  * 단답형 3개: 난이도 쉬움 1개, 보통 1개, 어려움 1개
  * 서술형 3개: 난이도 보통 2개, 어려움 1개

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만:
{{
  "questions": [
    {{
      "type": "객관식",
      "content": "문제 내용을 여기에 작성합니다.",
      "options": ["① 보기1", "② 보기2", "③ 보기3", "④ 보기4"],
      "answer": "② 보기2",
      "explanation": "정답 해설을 상세히 작성합니다.",
      "difficulty": "보통",
      "rubric": null
    }},
    {{
      "type": "단답형",
      "content": "문제 내용을 여기에 작성합니다.",
      "options": null,
      "answer": "모범 답안",
      "explanation": "정답 해설을 상세히 작성합니다.",
      "difficulty": "쉬움",
      "rubric": null
    }},
    {{
      "type": "서술형",
      "content": "문제 내용을 여기에 작성합니다.",
      "options": null,
      "answer": "모범 답안 (2~3문장)",
      "explanation": "정답 해설을 상세히 작성합니다.",
      "difficulty": "보통",
      "rubric": "① 핵심 개념 언급 (40점) ② 논리적 설명 (40점) ③ 표현의 정확성 (20점)"
    }}
  ]
}}
- options 필드: 객관식은 4개 배열, 단답형/서술형은 반드시 null
- rubric 필드: 서술형만 채점 기준 작성, 나머지는 null
- 총 10개 문제를 모두 작성할 것"""

    text = _call_claude_sync(prompt)
    data = _parse_json(text)
    return data.get("questions", [])


# ── DB 시드 함수 ─────────────────────────────────────────────────────────────
async def seed_topic(session: AsyncSession, subject: str, grade_level: str, topic: str) -> int:
    """해당 주제에 문제가 10개 미만이면 생성하여 저장합니다. 저장된 개수를 반환합니다."""
    existing = await session.scalar(
        select(func.count(QuestionBank.id)).where(
            QuestionBank.subject == subject,
            QuestionBank.grade_level == grade_level,
            QuestionBank.topic == topic,
        )
    )
    if (existing or 0) >= 10:
        return 0  # 이미 충분함

    questions = generate_questions_for_topic(subject, grade_level, topic)
    saved = 0
    for q in questions:
        q_type = q.get("type", "객관식")
        difficulty = q.get("difficulty", "보통")
        content = (q.get("content") or "").strip()
        answer = (q.get("answer") or "").strip()
        explanation = (q.get("explanation") or "").strip()

        if not content or not answer:
            continue

        # 타입·난이도 유효성 보정
        if q_type not in ("객관식", "단답형", "서술형"):
            q_type = "객관식"
        if difficulty not in ("쉬움", "보통", "어려움"):
            difficulty = "보통"

        bank_q = QuestionBank(
            id=str(uuid.uuid4()),
            subject=subject,
            grade_level=grade_level,
            topic=topic,
            question_type=q_type,
            difficulty=difficulty,
            content=content,
            options=q.get("options"),
            answer=answer,
            explanation=explanation,
            rubric=q.get("rubric"),
        )
        session.add(bank_q)
        saved += 1

    await session.commit()
    return saved


async def main() -> None:
    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # 전체 주제 목록 구성
    all_topics: list[tuple[str, str, str]] = [
        (subject, grade, topic)
        for subject, grades in TOPICS.items()
        for grade, topic_list in grades.items()
        for topic in topic_list
    ]
    total = len(all_topics)
    print(f"\n🎯 총 {total}개 주제에 대한 문제 은행 시드를 시작합니다.\n")

    done = 0
    skipped = 0
    errors = 0

    async with AsyncSessionLocal() as session:
        for subject, grade, topic in all_topics:
            done += 1
            label = f"[{done:>3}/{total}] {subject} {grade} > {topic}"
            try:
                saved = await seed_topic(session, subject, grade, topic)
                if saved == 0:
                    skipped += 1
                    print(f"  ⏭️  {label}: 이미 존재, 건너뜀")
                else:
                    print(f"  ✅ {label}: {saved}개 저장")
            except Exception as exc:
                errors += 1
                print(f"  ❌ {label}: 오류 - {exc}", file=sys.stderr)

    await engine.dispose()
    print(f"\n완료: 총 {total}개 주제 / 저장 {total - skipped - errors}개 / 건너뜀 {skipped}개 / 오류 {errors}개\n")


if __name__ == "__main__":
    asyncio.run(main())
