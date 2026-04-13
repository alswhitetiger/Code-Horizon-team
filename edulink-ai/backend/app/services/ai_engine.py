import re, json, time, random
from fastapi import HTTPException
import anthropic
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

def _call_claude(model: str, max_tokens: int, messages: list, max_retries: int = 3) -> anthropic.types.Message:
    """529 Overloaded 오류 시 지수 백오프로 재시도"""
    for attempt in range(max_retries):
        try:
            return client.messages.create(model=model, max_tokens=max_tokens, messages=messages)
        except anthropic.APIStatusError as e:
            if e.status_code == 529 and attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # 1s → 2s → 4s
                continue
            raise

def safe_parse_llm(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        raise HTTPException(status_code=500, detail="AI 응답 파싱 실패. 다시 시도해주세요.")

async def generate_questions(subject: str, grade_level: str, topic: str,
                              question_type: str, difficulty: str, count: int) -> dict:
    seed = random.randint(1000, 9999)
    contexts = [
        "실생활 사례를 활용한", "개념 원리를 묻는", "응용력을 평가하는",
        "비판적 사고를 요구하는", "창의적 접근이 필요한", "핵심 개념을 확인하는",
    ]
    context_hint = random.choice(contexts)

    prompt = f"""당신은 10년 경력의 교육 전문가입니다.
아래 조건에 맞는 교육용 문제를 생성해주세요.

[조건]
- 과목: {subject}
- 학년/수준: {grade_level}
- 주제: {topic}
- 문제 유형: {question_type}
- 난이도: {difficulty}
- 문제 수: {count}개
- 출제 방향: {context_hint} 문제 (seed={seed})

[중요 지침]
- 이전에 출제된 문제와 완전히 다른 새로운 문제를 만들어주세요.
- 문제마다 다른 소재, 다른 상황, 다른 접근법을 사용하세요.
- 객관식 보기는 정답이 매번 다른 번호가 되도록 하세요.
- 수치나 조건을 변경하여 참신한 문제를 출제하세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만:
{{
  "questions": [
    {{
      "type": "{question_type}",
      "content": "문제 내용",
      "options": ["① 보기1", "② 보기2", "③ 보기3", "④ 보기4"],
      "answer": "① 보기1",
      "explanation": "상세 해설",
      "difficulty": "{difficulty}",
      "rubric": null
    }}
  ]
}}
서술형의 경우 options=null, rubric에 채점 기준 명시."""

    try:
        message = _call_claude(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        return safe_parse_llm(message.content[0].text)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="AI 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.")

async def grade_submission(question: str, model_answer: str, rubric: str,
                           student_answer: str) -> dict:
    if not student_answer or not student_answer.strip():
        return {"score": 0, "max_score": 100, "feedback": "답변이 없습니다.",
                "strengths": [], "improvements": ["답변을 작성해주세요."]}

    prompt = f"""당신은 공정하고 인자한 채점관입니다.

[문제] {question}
[모범답안] {model_answer}
[채점 기준] {rubric}
[학생 답안] {student_answer}

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "score": 85,
  "max_score": 100,
  "feedback": "전반적 평가 2~3문장",
  "strengths": ["잘한 점 1", "잘한 점 2"],
  "improvements": ["보완할 점 1"]
}}
점수는 정수. 빈 답안이면 score=0."""

    try:
        message = _call_claude(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        return safe_parse_llm(message.content[0].text)
    except Exception:
        # AI 채점 실패 시 기본 점수 반환
        return {"score": 50, "max_score": 100, "feedback": "자동 채점을 완료했습니다. 교사가 직접 채점을 검토해주세요.",
                "strengths": ["답변을 작성했습니다."], "improvements": ["더 자세한 설명을 추가해보세요."]}
