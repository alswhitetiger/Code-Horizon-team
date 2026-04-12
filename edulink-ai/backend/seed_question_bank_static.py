"""
정적 문제 은행 시드 스크립트 (Claude API 불필요)
주요 과목별 샘플 문제를 question_bank 테이블에 저장합니다.

사용법:
    cd edulink-ai/backend
    python seed_question_bank_static.py
"""

import asyncio
import sys
import uuid

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

try:
    from app.core.config import settings
    DATABASE_URL = settings.DATABASE_URL
except Exception:
    import os
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://edulink:edulink1234@127.0.0.1:5432/edulink",
    )

from app.models.question_bank import QuestionBank  # noqa: E402


# ─────────────────────────────────────────────────────────────────────────────
# 문제 데이터 정의
# 형식: (subject, grade_level, topic, type, difficulty, content, options, answer, explanation, rubric)
# ─────────────────────────────────────────────────────────────────────────────
QUESTIONS = [

    # ── 수학 / 중1 / 일차방정식 ─────────────────────────────────────────────
    ("수학", "중1", "일차방정식", "객관식", "쉬움",
     "x + 5 = 9일 때, x의 값은?",
     ["① 3", "② 4", "③ 5", "④ 6"],
     "② 4",
     "x = 9 - 5 = 4입니다. 등식의 성질을 이용해 우변으로 5를 이항합니다.",
     None),

    ("수학", "중1", "일차방정식", "객관식", "보통",
     "2x - 3 = 7일 때, x의 값은?",
     ["① 4", "② 5", "③ 6", "④ 7"],
     "② 5",
     "2x = 7 + 3 = 10, x = 5입니다.",
     None),

    ("수학", "중1", "일차방정식", "객관식", "보통",
     "3(x - 2) = 9일 때, x의 값은?",
     ["① 3", "② 4", "③ 5", "④ 6"],
     "③ 5",
     "3x - 6 = 9, 3x = 15, x = 5입니다.",
     None),

    ("수학", "중1", "일차방정식", "객관식", "어려움",
     "어떤 수의 3배에서 7을 뺀 값이 그 수의 2배보다 4가 크다. 어떤 수는?",
     ["① 9", "② 10", "③ 11", "④ 12"],
     "③ 11",
     "어떤 수를 x라 하면 3x - 7 = 2x + 4, x = 11입니다.",
     None),

    ("수학", "중1", "일차방정식", "단답형", "쉬움",
     "5x = 20일 때, x의 값을 구하시오.",
     None,
     "4",
     "x = 20 ÷ 5 = 4입니다.",
     None),

    ("수학", "중1", "일차방정식", "단답형", "보통",
     "4x + 2 = 3x + 7일 때, x의 값을 구하시오.",
     None,
     "5",
     "4x - 3x = 7 - 2, x = 5입니다.",
     None),

    ("수학", "중1", "일차방정식", "단답형", "어려움",
     "일차방정식 ax + 3 = 2x + b의 해가 x = 1일 때, a + b의 값을 구하시오. (a ≠ 2)",
     None,
     "a + b = a + 2 - a + 3 = 5 (단, x=1 대입 시 (a-2)·1 = b-3, b = a-2+3 = a+1이므로 a+b = 2a+1이 되고, a=2이면 0=b-3에서 b=3이 되어 a+b=5)",
     "x=1을 대입하면 a + 3 = 2 + b, 즉 b = a + 1입니다. a + b = a + (a+1) = 2a + 1이 됩니다.",
     None),

    ("수학", "중1", "일차방정식", "서술형", "보통",
     "농도가 10%인 소금물 200g이 있다. 여기에 물을 x g 넣었더니 농도가 8%가 되었다. x의 값을 구하는 방정식을 세우고 풀어라.",
     None,
     "방정식: 20/(200+x) = 8/100, 풀면 x = 50",
     "소금의 양은 200×0.1=20g. 물 x g을 넣으면 20/(200+x)=0.08, 20=0.08(200+x)=16+0.08x, 0.08x=4, x=50.",
     "① 방정식 설정 (40점) ② 올바른 풀이 과정 (40점) ③ 정확한 답 (20점)"),

    ("수학", "중1", "일차방정식", "서술형", "보통",
     "현재 아버지의 나이는 42세이고 아들의 나이는 12세이다. 아버지의 나이가 아들의 나이의 2배가 되는 것은 몇 년 후인지 방정식을 이용하여 구하시오.",
     None,
     "x년 후: 42+x = 2(12+x), 풀면 x=18, 18년 후",
     "x년 후라 하면 42+x = 2(12+x) = 24+2x, 18 = x. 따라서 18년 후입니다.",
     "① 방정식 설정 (40점) ② 올바른 풀이 (40점) ③ 단위 포함한 답 (20점)"),

    ("수학", "중1", "일차방정식", "서술형", "어려움",
     "버스는 시속 60km, 기차는 시속 90km로 달린다. 같은 시각에 같은 지점을 출발하여 반대 방향으로 이동할 때, 두 교통수단이 270km 떨어지는 것은 몇 시간 후인지 방정식으로 구하시오.",
     None,
     "x시간 후: 60x + 90x = 270, 150x = 270, x = 1.8(시간) = 1시간 48분",
     "x시간 후에 거리합 = (60+90)x = 270, x = 270/150 = 9/5 = 1.8시간 = 1시간 48분.",
     "① 방정식 설정 (30점) ② 풀이 과정 (40점) ③ 정확한 답과 단위 (30점)"),

    # ── 수학 / 중1 / 정수와 유리수 ─────────────────────────────────────────
    ("수학", "중1", "정수와 유리수", "객관식", "쉬움",
     "다음 중 정수가 아닌 것은?",
     ["① -3", "② 0", "③ 1/2", "④ 7"],
     "③ 1/2",
     "1/2은 분수로 정수가 아닙니다. 정수는 …, -2, -1, 0, 1, 2, …입니다.",
     None),

    ("수학", "중1", "정수와 유리수", "객관식", "보통",
     "(-3) × (-4) ÷ 2의 값은?",
     ["① -6", "② 6", "③ -12", "④ 12"],
     "② 6",
     "(-3)×(-4)=12, 12÷2=6. 음수×음수=양수입니다.",
     None),

    ("수학", "중1", "정수와 유리수", "단답형", "쉬움",
     "절댓값이 5인 음수를 구하시오.",
     None,
     "-5",
     "절댓값이 5이면 5 또는 -5인데, 음수이므로 -5입니다.",
     None),

    ("수학", "중1", "정수와 유리수", "단답형", "보통",
     "(-2/3) + (5/6)의 값을 기약분수로 나타내시오.",
     None,
     "1/6",
     "(-2/3)+(5/6) = (-4/6)+(5/6) = 1/6입니다.",
     None),

    ("수학", "중1", "정수와 유리수", "서술형", "보통",
     "수직선 위에서 -3과 5의 중점을 구하고, 그 점에서 -2까지의 거리를 구하시오.",
     None,
     "중점: 1, 거리: 3",
     "(-3+5)/2 = 1. 중점은 1. |1-(-2)| = |3| = 3.",
     "① 중점 공식 적용 (40점) ② 중점 계산 (30점) ③ 거리 계산 (30점)"),

    # ── 영어 / 중1 / be동사와 일반동사 ────────────────────────────────────
    ("영어", "중1", "be동사와 일반동사", "객관식", "쉬움",
     "다음 빈칸에 알맞은 be동사는? 'She ___ a student.'",
     ["① am", "② are", "③ is", "④ be"],
     "③ is",
     "3인칭 단수(she/he/it)에는 'is'를 씁니다.",
     None),

    ("영어", "중1", "be동사와 일반동사", "객관식", "보통",
     "다음 문장 중 어법상 올바른 것은?",
     ["① I is happy.", "② They is friends.", "③ He are tall.", "④ We are students."],
     "④ We are students.",
     "We는 1인칭 복수로 'are'를 사용합니다. I→am, He/She/It→is, You/We/They→are.",
     None),

    ("영어", "중1", "be동사와 일반동사", "객관식", "보통",
     "다음 빈칸에 알맞은 말은? 'He ___ soccer every day.'",
     ["① am play", "② are plays", "③ plays", "④ play"],
     "③ plays",
     "3인칭 단수 주어(He)에 현재시제 일반동사는 -(e)s를 붙입니다.",
     None),

    ("영어", "중1", "be동사와 일반동사", "객관식", "어려움",
     "다음 중 밑줄 친 부분이 어법상 틀린 것은?",
     ["① My cat is cute.", "② They don't like fish.", "③ She don't go to school.", "④ Do you have a pen?"],
     "③ She don't go to school.",
     "3인칭 단수 부정은 'doesn't'를 써야 합니다. 'She doesn't go to school.'",
     None),

    ("영어", "중1", "be동사와 일반동사", "단답형", "쉬움",
     "'I am not hungry.'를 줄임말로 쓰시오.",
     None,
     "I'm not hungry.",
     "am not은 I'm not으로 줄여씁니다. (am not은 amn't로 줄이지 않습니다)",
     None),

    ("영어", "중1", "be동사와 일반동사", "단답형", "보통",
     "다음 문장을 의문문으로 바꾸시오: 'You are from Korea.'",
     None,
     "Are you from Korea?",
     "be동사 의문문은 be동사를 주어 앞으로 이동시킵니다.",
     None),

    ("영어", "중1", "be동사와 일반동사", "단답형", "어려움",
     "다음 문장의 빈칸에 알맞은 말을 쓰시오: 'Tom and Jerry ___ best friends, but Tom ___ not always kind to Jerry.'",
     None,
     "are / is",
     "복수 주어(Tom and Jerry)에는 are, 단수 주어(Tom)에는 is를 사용합니다.",
     None),

    ("영어", "중1", "be동사와 일반동사", "서술형", "보통",
     "be동사와 일반동사의 차이점을 설명하고, 각각 예문을 한 개씩 쓰시오.",
     None,
     "be동사(am/are/is)는 주어의 상태·신분을 나타낸다. 예: She is kind. 일반동사는 동작·상태를 나타낸다. 예: She studies math.",
     "be동사는 상태/신분/위치를 나타내며 am/are/is를 사용합니다. 일반동사는 구체적인 동작을 나타냅니다.",
     "① 개념 설명 (40점) ② be동사 예문 (30점) ③ 일반동사 예문 (30점)"),

    ("영어", "중1", "be동사와 일반동사", "서술형", "보통",
     "다음 표의 인물을 소개하는 문장을 3개 이상 쓰시오. [이름: Minho, 나이: 13, 취미: 축구, 출신: 서울]",
     None,
     "His name is Minho. He is 13 years old. He plays soccer as a hobby. He is from Seoul.",
     "be동사와 일반동사를 적절히 사용하여 인물을 소개합니다.",
     "① 문장 수 3개 이상 (30점) ② be동사 활용 (35점) ③ 일반동사 활용 (35점)"),

    ("영어", "중1", "be동사와 일반동사", "서술형", "어려움",
     "현재 시제의 be동사와 일반동사를 사용하여 자신의 친구를 소개하는 5문장 이상의 글을 쓰시오.",
     None,
     "(예시) My friend is Jisu. She is 14 years old. She is very smart and kind. She studies hard every day. She likes reading books and listening to music.",
     "인물 소개에 be동사(상태/신분)와 일반동사(행동/취미)를 균형 있게 사용합니다.",
     "① 문장 수 5개 이상 (20점) ② be동사 정확한 사용 (30점) ③ 일반동사 정확한 사용 (30점) ④ 내용의 일관성 (20점)"),

    # ── 과학탐구 / 중1 / 힘과 운동 ────────────────────────────────────────
    ("과학탐구", "중1", "힘과 운동", "객관식", "쉬움",
     "힘의 단위는?",
     ["① kg", "② N(뉴턴)", "③ m/s", "④ J(줄)"],
     "② N(뉴턴)",
     "힘의 SI 단위는 뉴턴(N)입니다. 1N = 1kg·m/s².",
     None),

    ("과학탐구", "중1", "힘과 운동", "객관식", "보통",
     "마찰력에 대한 설명으로 옳지 않은 것은?",
     ["① 두 물체의 접촉면 사이에서 작용한다.",
      "② 항상 운동 방향과 반대 방향으로 작용한다.",
      "③ 접촉면이 거칠수록 마찰력이 크다.",
      "④ 질량이 클수록 마찰력이 무조건 커진다."],
     "④ 질량이 클수록 마찰력이 무조건 커진다.",
     "마찰력은 수직항력에 비례하며, 질량만으로 결정되지 않습니다. 접촉면의 성질도 중요합니다.",
     None),

    ("과학탐구", "중1", "힘과 운동", "단답형", "쉬움",
     "속력의 단위를 쓰시오. (예: m/s)",
     None,
     "m/s",
     "속력 = 거리/시간, 단위는 m/s(미터 퍼 세컨드)입니다.",
     None),

    ("과학탐구", "중1", "힘과 운동", "단답형", "보통",
     "100m를 10초에 달린 사람의 평균 속력은?",
     None,
     "10 m/s",
     "속력 = 거리/시간 = 100m/10s = 10 m/s입니다.",
     None),

    ("과학탐구", "중1", "힘과 운동", "서술형", "보통",
     "관성의 법칙을 설명하고, 일상생활에서의 예를 두 가지 드시오.",
     None,
     "관성의 법칙: 외부 힘이 없으면 정지한 물체는 계속 정지하고, 운동하는 물체는 같은 속도로 계속 운동한다. 예) 버스가 갑자기 출발할 때 몸이 뒤로 쏠림, 달리다 갑자기 멈출 때 앞으로 쏠림.",
     "뉴턴의 제1법칙. 물체는 외부 힘이 없는 한 현재 상태(정지 또는 등속운동)를 유지하려는 성질이 있습니다.",
     "① 관성 법칙 정의 (40점) ② 예시 1 (30점) ③ 예시 2 (30점)"),

    # ── 국어 / 중1 / 문법 (품사) ──────────────────────────────────────────
    ("국어", "중1", "문법 (품사)", "객관식", "쉬움",
     "다음 중 명사가 아닌 것은?",
     ["① 학교", "② 아름답다", "③ 사랑", "④ 하늘"],
     "② 아름답다",
     "'아름답다'는 형용사입니다. 명사는 사물이나 개념의 이름을 나타냅니다.",
     None),

    ("국어", "중1", "문법 (품사)", "객관식", "보통",
     "다음 문장에서 '조용히'의 품사는? '도서관에서 조용히 공부해라.'",
     ["① 명사", "② 동사", "③ 형용사", "④ 부사"],
     "④ 부사",
     "'조용히'는 '공부해라'라는 동사를 수식하는 부사입니다.",
     None),

    ("국어", "중1", "문법 (품사)", "단답형", "쉬움",
     "품사의 종류 중 사물의 동작이나 작용을 나타내는 것은?",
     None,
     "동사",
     "동사는 사물의 동작이나 작용을 나타내는 품사입니다. 예: 먹다, 달리다, 자다.",
     None),

    ("국어", "중1", "문법 (품사)", "서술형", "보통",
     "다음 문장에서 각 단어의 품사를 밝히시오: '예쁜 꽃이 활짝 피었다.'",
     None,
     "예쁜: 형용사(관형사형), 꽃: 명사, 이: 조사, 활짝: 부사, 피었다: 동사",
     "각 단어의 역할을 파악하여 품사를 결정합니다.",
     "① 형용사 (20점) ② 명사 (20점) ③ 조사 (20점) ④ 부사 (20점) ⑤ 동사 (20점)"),

    # ── 사회탐구 / 중1 / 문화의 다양성 ────────────────────────────────────
    ("사회탐구", "중1", "문화의 다양성", "객관식", "쉬움",
     "문화 상대주의에 대한 설명으로 옳은 것은?",
     ["① 자국 문화가 가장 우수하다고 본다.",
      "② 특정 문화를 기준으로 다른 문화를 평가한다.",
      "③ 각 문화를 그 사회의 맥락에서 이해한다.",
      "④ 모든 문화가 동일한 가치를 지닌다고 단정한다."],
     "③ 각 문화를 그 사회의 맥락에서 이해한다.",
     "문화 상대주의는 각 문화를 해당 사회의 역사·환경·가치관의 맥락에서 이해해야 한다는 관점입니다.",
     None),

    ("사회탐구", "중1", "문화의 다양성", "단답형", "쉬움",
     "자기 문화를 최고로 여기고 다른 문화를 열등하게 보는 태도를 무엇이라 하는가?",
     None,
     "자문화 중심주의",
     "자문화 중심주의(Ethnocentrism)는 자국 문화를 기준으로 타 문화를 낮게 평가하는 태도입니다.",
     None),

    ("사회탐구", "중1", "문화의 다양성", "서술형", "보통",
     "문화 다양성의 중요성을 두 가지 이상 서술하고, 문화 다양성을 보전하기 위한 방법을 한 가지 제시하시오.",
     None,
     "① 인류 문화유산의 보존 ② 다양한 관점과 창의적 아이디어 발전 가능. 보전 방법: 소수 민족 언어·전통 문화 교육 지원.",
     "문화 다양성은 인류의 지적·문화적 유산을 풍부하게 하고, 환경 변화에 유연하게 대응할 수 있게 합니다.",
     "① 중요성 2가지 이상 (50점) ② 논리적 설명 (30점) ③ 보전 방법 제시 (20점)"),

    # ── 수학 / 고1 / 집합과 명제 ──────────────────────────────────────────
    ("수학", "고1", "집합과 명제", "객관식", "보통",
     "집합 A = {1, 2, 3, 4, 5}에서 부분집합의 개수는?",
     ["① 10", "② 16", "③ 32", "④ 64"],
     "③ 32",
     "n개의 원소를 가진 집합의 부분집합의 수는 2ⁿ입니다. 2⁵ = 32.",
     None),

    ("수학", "고1", "집합과 명제", "객관식", "어려움",
     "명제 'p → q'가 참일 때, 반드시 참인 것은?",
     ["① q → p (역)", "② ~p → ~q (이)", "③ ~q → ~p (대우)", "④ p ↔ q (동치)"],
     "③ ~q → ~p (대우)",
     "명제와 그 대우는 항상 진릿값이 같습니다. 역과 이는 원래 명제와 진릿값이 다를 수 있습니다.",
     None),

    ("수학", "고1", "집합과 명제", "단답형", "보통",
     "전체집합 U = {1,2,3,4,5,6,7,8}, A = {2,4,6,8}일 때, A의 여집합 Aᶜ를 구하시오.",
     None,
     "{1, 3, 5, 7}",
     "Aᶜ = U - A = {1,2,3,4,5,6,7,8} - {2,4,6,8} = {1,3,5,7}",
     None),

    ("수학", "고1", "집합과 명제", "서술형", "어려움",
     "두 집합 A = {x | x는 12의 약수}, B = {x | x는 8의 약수}에 대해 A∩B, A∪B, A-B를 구하고, 벤 다이어그램으로 나타내시오.",
     None,
     "A={1,2,3,4,6,12}, B={1,2,4,8}. A∩B={1,2,4}, A∪B={1,2,3,4,6,8,12}, A-B={3,6,12}",
     "A∩B는 공통 원소, A∪B는 합집합, A-B는 A에만 있는 원소입니다.",
     "① A, B 원소 나열 (20점) ② A∩B (20점) ③ A∪B (20점) ④ A-B (20점) ⑤ 벤 다이어그램 (20점)"),

    # ── 영어 / 고1 / 독해 (주제·요지) ────────────────────────────────────
    ("영어", "고1", "독해 (주제·요지)", "객관식", "보통",
     """다음 글의 주제로 가장 적절한 것은?

'Studies show that regular physical exercise not only improves physical health but also enhances mental well-being. People who exercise regularly report lower levels of stress and anxiety. Exercise increases the production of endorphins, chemicals in the brain that act as natural painkillers and mood elevators.'""",
     ["① 운동의 경제적 효과",
      "② 규칙적인 운동이 신체·정신 건강에 미치는 긍정적 효과",
      "③ 엔도르핀의 부작용",
      "④ 스트레스 해소를 위한 식이요법"],
     "② 규칙적인 운동이 신체·정신 건강에 미치는 긍정적 효과",
     "글 전체가 규칙적인 운동의 신체적·정신적 이점을 설명하고 있습니다. 엔도르핀 언급도 이를 뒷받침합니다.",
     None),

    ("영어", "고1", "독해 (주제·요지)", "단답형", "보통",
     """다음 글의 요지를 한 문장으로 한국어로 쓰시오.

'Technology has transformed the way we communicate. While social media connects people across the world, it can also lead to feelings of isolation. Many young people spend hours online but feel lonelier than ever. True connection requires face-to-face interaction and genuine emotional engagement.'""",
     None,
     "기술이 소통 방식을 변화시켰지만, 진정한 연결을 위해서는 대면 상호작용이 필요하다.",
     "마지막 문장 'True connection requires face-to-face interaction'이 핵심 요지입니다.",
     None),

    ("영어", "고1", "독해 (주제·요지)", "서술형", "어려움",
     """다음 글을 읽고, (1) 글의 주제, (2) 글쓴이의 주장, (3) 주요 근거를 각각 한국어로 쓰시오.

'Climate change is no longer a distant threat — it is happening now. Rising sea levels, extreme weather events, and loss of biodiversity are clear signs. Scientists agree that human activities, particularly the burning of fossil fuels, are the primary cause. Immediate global action is essential to prevent irreversible damage.'""",
     None,
     "(1) 주제: 기후 변화의 현실과 즉각적 대응의 필요성\n(2) 주장: 기후 변화는 지금 일어나고 있으며 즉각적인 전 세계적 행동이 필요하다\n(3) 근거: 해수면 상승·극단적 기상·생물다양성 손실, 화석 연료 연소가 주요 원인",
     "글의 첫 문장과 마지막 문장이 주제와 주장을 담고 있으며, 중간 문장들이 근거를 제공합니다.",
     "① 주제 (30점) ② 주장 (35점) ③ 근거 (35점)"),
]


async def main() -> None:
    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    total_saved = 0
    total_skipped = 0

    async with AsyncSessionLocal() as session:
        for row in QUESTIONS:
            (subject, grade_level, topic, q_type, difficulty,
             content, options, answer, explanation, rubric) = row

            # 이미 동일한 content가 있으면 스킵
            existing = await session.scalar(
                select(func.count(QuestionBank.id)).where(
                    QuestionBank.content == content,
                    QuestionBank.subject == subject,
                )
            )
            if existing:
                total_skipped += 1
                continue

            q = QuestionBank(
                id=str(uuid.uuid4()),
                subject=subject,
                grade_level=grade_level,
                topic=topic,
                question_type=q_type,
                difficulty=difficulty,
                content=content,
                options=options,
                answer=answer,
                explanation=explanation,
                rubric=rubric,
            )
            session.add(q)
            total_saved += 1

        await session.commit()

    await engine.dispose()

    print(f"\n문제 은행 시드 완료!")
    print(f"  저장: {total_saved}개")
    print(f"  건너뜀 (중복): {total_skipped}개")
    print(f"\n포함된 과목/주제:")
    seen = set()
    for row in QUESTIONS:
        key = f"  - {row[0]} / {row[1]} / {row[2]}"
        if key not in seen:
            seen.add(key)
            print(key)


if __name__ == "__main__":
    asyncio.run(main())
