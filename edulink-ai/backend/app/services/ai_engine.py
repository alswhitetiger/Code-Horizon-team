import re, json
from fastapi import HTTPException
import anthropic
from app.core.config import settings
from app.services.cache import get_cache, set_cache, make_cache_key, TTL

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

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
    cache_key = make_cache_key("questions", subject=subject, grade_level=grade_level,
                                topic=topic, question_type=question_type,
                                difficulty=difficulty, count=count)
    cached = await get_cache(cache_key)
    if cached:
        return cached

    prompt = f"""당신은 10년 경력의 교육 전문가입니다.
아래 조건에 맞는 교육용 문제를 생성해주세요.

[조건]
- 과목: {subject}
- 학년/수준: {grade_level}
- 주제: {topic}
- 문제 유형: {question_type}
- 난이도: {difficulty}
- 문제 수: {count}개

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

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}]
    )
    result = safe_parse_llm(message.content[0].text)
    await set_cache(cache_key, result, TTL["questions"])
    return result

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

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return safe_parse_llm(message.content[0].text)
