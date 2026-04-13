# EduLink AI - AI 기반 교육 플랫폼

> 교사와 학생을 위한 AI 통합 교육 관리 시스템

---

## 프로젝트 소개

**EduLink AI**는 인공지능을 활용하여 교사의 업무를 자동화하고, 학생의 학습을 개인화하는 교육 플랫폼입니다.

- 교사는 AI로 시험 문제를 자동 생성하고, 제출된 답안을 자동 채점할 수 있습니다.
- 학생은 학습 현황을 실시간으로 확인하고, AI 진로 상담을 받을 수 있습니다.
- 관리자는 전체 학습 현황, 위험 학생 감지, 리포트 생성이 가능합니다.

---

## 주요 기능

### 교사 기능
| 기능 | 설명 |
|------|------|
| AI 문제 생성 | 과목·학년·주제를 선택하면 AI가 시험 문제를 자동 생성 |
| 문제 은행 | 생성된 문제를 DB에 저장하고 재사용 (API 절약) |
| 답안 채점 | 제출된 답안을 AI가 자동 채점 및 피드백 제공 |
| 강의 영상 관리 | 강의별 동영상 업로드, 삭제, 학생 시청 현황 확인 |
| 학생 진로 관리 | 학생별 진로 목표 및 AI 상담 현황 조회 |
| 학생 관리 | 강의에 학생 초대, 제거, 현황 조회 |
| 시험 관리 | 시험 생성·배포, 제출 현황 확인 |

### 학생 기능
| 기능 | 설명 |
|------|------|
| 시험 응시 | 배정된 시험 응시, 결과 즉시 확인 |
| 학습 현황 | 과목별 점수, 학습 이력 대시보드 |
| 강의 영상 시청 | 강의별 동영상 시청 및 진도 자동 저장 |
| AI 진로 상담 | 희망 직업 설정 후 AI와 진로 채팅 상담 |
| 맞춤 추천 | AI가 학습 패턴 분석 후 보완이 필요한 과목 추천 |

### 관리자 기능
| 기능 | 설명 |
|------|------|
| 전체 현황 | 활성 사용자, 평균 점수, 제출 현황 지표 |
| 위험 학생 감지 | 학습 부진 위험 학생 자동 분류 및 리스트 제공 |
| 리포트 생성 | 강의·학생별 학습 리포트 생성 |

---

## 기술 스택

### 프론트엔드
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **HTTP**: Axios

### 백엔드
- **Framework**: FastAPI (Python)
- **Database**: SQLite (기본값, 별도 설치 불필요) / PostgreSQL (선택)
- **Cache**: Redis (선택사항 - 없어도 동작)
- **Auth**: JWT + 이메일 인증(SMTP) + OAuth (Google, Kakao, Naver)
- **AI (문제 생성·채점)**: Anthropic Claude API
- **AI (진로 상담)**: HuggingFace - Qwen2.5

---

## 프로젝트 구조

```
Code-Horizon-team/
└── edulink-ai/
    ├── frontend/
    │   ├── app/
    │   │   ├── (auth)/                    # 로그인, 회원가입, 이메일 인증, OAuth 콜백
    │   │   ├── student/                   # 학생 페이지
    │   │   │   ├── page.tsx               #   학습 현황 대시보드
    │   │   │   ├── assessments/[id]/      #   강의별 시험 목록
    │   │   │   ├── assessments/[id]/take/ #   시험 응시
    │   │   │   ├── career/                #   AI 진로 상담
    │   │   │   └── videos/[courseId]/     #   강의 영상 시청
    │   │   ├── teacher/                   # 교사 페이지
    │   │   │   ├── page.tsx               #   강의·학생·영상 관리 대시보드
    │   │   │   ├── questions/             #   AI 문제 생성
    │   │   │   ├── grading/               #   제출 답안 채점
    │   │   │   └── career/                #   학생 진로 현황
    │   │   └── admin/                     # 관리자 대시보드
    │   ├── components/                    # 재사용 UI 컴포넌트
    │   ├── lib/                           # API 클라이언트, 유틸리티
    │   ├── store/                         # Zustand 전역 상태
    │   └── types/                         # TypeScript 타입 정의
    └── backend/
        ├── app/
        │   ├── routers/                   # API 엔드포인트
        │   │   ├── auth.py                #   인증 (JWT + 이메일 인증 + OAuth)
        │   │   ├── teacher.py             #   교사 API (강의, 시험, 영상 업로드, 채점)
        │   │   ├── student.py             #   학생 API (대시보드, 시험, 영상 시청)
        │   │   ├── career.py              #   진로 AI API
        │   │   └── admin.py               #   관리자 API (분석, 리포트)
        │   ├── models/                    # DB 모델 (SQLAlchemy)
        │   │   ├── user.py                #   사용자 (이메일 인증 필드 포함)
        │   │   ├── course.py              #   강의, 수강 등록
        │   │   ├── assessment.py          #   시험, 문제
        │   │   ├── submission.py          #   제출 답안
        │   │   ├── question_bank.py       #   문제 은행
        │   │   ├── video.py               #   강의 영상, 시청 진도
        │   │   ├── learning_log.py        #   학습 로그
        │   │   └── career.py              #   진로 목표
        │   ├── services/                  # 비즈니스 로직
        │   │   ├── ai_engine.py           #   Claude API (문제 생성, 채점)
        │   │   ├── career_ai.py           #   HuggingFace (진로 상담)
        │   │   ├── question_bank.py       #   문제 은행 조회/저장
        │   │   ├── analytics.py           #   학습 분석, 위험 학생 감지
        │   │   ├── assessment.py          #   시험 처리 로직
        │   │   ├── learning.py            #   학습 이력 처리
        │   │   └── cache.py               #   Redis 캐시 (없으면 자동 비활성화)
        │   └── core/                      # 설정, 인증, DB 연결
        ├── alembic/                       # DB 마이그레이션
        ├── seed.py                        # 데모 계정 + 샘플 데이터 생성
        ├── seed_question_bank.py          # AI로 문제 은행 생성 (Claude API 필요)
        └── seed_question_bank_static.py   # 정적 문제 은행 생성 (API 불필요)
```

---

## 시작하기

### 필수 설치 항목

| 프로그램 | 권장 버전 | 비고 |
|----------|-----------|------|
| Python | 3.11 이상 | [python.org](https://www.python.org/downloads/) |
| Node.js | 18 이상 | [nodejs.org](https://nodejs.org/) |

> **SQLite는 Python에 내장**되어 있어 별도 설치가 필요 없습니다.  
> PostgreSQL, Redis는 선택사항입니다.

---

### 1단계: 저장소 클론

```bash
git clone https://github.com/alswhitetiger/Code-Horizon-team.git
cd Code-Horizon-team/edulink-ai
```

---

### 2단계: 백엔드 설정

```bash
cd backend
```

**가상환경 생성 및 활성화:**
```bash
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

> Windows에서 활성화 오류 시:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

**패키지 설치:**
```bash
pip install -r requirements.txt
```

**환경변수 파일 설정:**
```bash
cp .env.example .env
```

`.env` 파일을 열어 아래 값들을 입력합니다:
```env
# AI API 키 (필수)
ANTHROPIC_API_KEY=sk-ant-...
HF_TOKEN=hf_...

# JWT 보안 키 (32자 이상 랜덤 문자열)
JWT_SECRET=랜덤문자열32자이상
```

**DB 테이블 생성:**
```bash
alembic upgrade head
```

**백엔드 서버 실행:**
```bash
uvicorn app.main:app --reload
```

백엔드: `http://localhost:8000` / API 문서: `http://localhost:8000/docs`

---

### 3단계: 프론트엔드 설정

새 터미널을 열고:

```bash
cd Code-Horizon-team/edulink-ai/frontend

# 패키지 설치
npm install

# 환경변수 파일 생성
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 개발 서버 실행
npm run dev
```

프론트엔드: `http://localhost:3000`

---

### 4단계: 데모 데이터 생성 (선택)

백엔드 가상환경이 활성화된 상태에서 `backend` 디렉토리 안에서 실행합니다.

**데모 계정 + 샘플 강의/시험 데이터 생성:**
```bash
python seed.py
```

**문제 은행 초기 데이터 생성 (API 불필요, 권장):**
```bash
python seed_question_bank_static.py
```

**문제 은행 AI 자동 생성 (Claude API 필요):**
```bash
python seed_question_bank.py
```

---

## 데모 계정

`seed.py` 실행 후 아래 계정으로 로그인할 수 있습니다.

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 교사 | teacher@demo.com | demo1234 |
| 학생 | student@demo.com | demo1234 |
| 관리자 | admin@demo.com | demo1234 |

---

## 환경변수 설정

### 백엔드 (`backend/.env`)

```env
# 데이터베이스 (기본값: SQLite - 설정 불필요)
# PostgreSQL 사용 시: postgresql+asyncpg://유저:비밀번호@127.0.0.1:5432/edulink
DATABASE_URL=sqlite+aiosqlite:///./edulink.db

# Redis 캐시 (선택사항 - 없어도 동작)
REDIS_URL=redis://localhost:6379

# AI API 키
ANTHROPIC_API_KEY=sk-ant-...        # 문제 생성·채점 (유료)
HF_TOKEN=hf_...                      # 진로 상담 AI (무료)

# JWT 인증 (32자 이상 랜덤 문자열)
JWT_SECRET=랜덤문자열32자이상
JWT_EXPIRE_MINUTES=1440

# 서버 URL
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# 이메일 인증 (선택사항 - Gmail 앱 비밀번호 사용)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=앱비밀번호16자리
SMTP_FROM=EduLink AI <noreply@edulink.ai>

# 소셜 로그인 (선택사항)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

### 프론트엔드 (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API 키 발급 방법

### Anthropic Claude API (문제 생성·채점 - 유료)
1. [console.anthropic.com](https://console.anthropic.com) 접속 및 회원가입
2. 좌측 메뉴 **API Keys** → **Create Key**
3. 생성된 `sk-ant-...` 키를 `.env`의 `ANTHROPIC_API_KEY`에 입력

> 신규 가입 시 $5 무료 크레딧 제공

### HuggingFace Token (진로 상담 AI - 무료)
1. [huggingface.co](https://huggingface.co) 접속 및 회원가입
2. 우측 상단 프로필 → **Settings** → **Access Tokens**
3. **New token** → Role: **Read** → 생성
4. `hf_...` 토큰을 `.env`의 `HF_TOKEN`에 입력

### Gmail 앱 비밀번호 (이메일 인증 - 선택사항)
1. Google 계정 → **보안** → **2단계 인증** 활성화
2. **앱 비밀번호** → 앱: 메일 → 생성
3. 발급된 16자리 비밀번호를 `.env`의 `SMTP_PASSWORD`에 입력

> 이메일 인증을 사용하지 않으면 SMTP 설정을 비워두어도 됩니다.

---

## 화면 구성

| 경로 | 접근 | 설명 |
|------|------|------|
| `/` | 전체 | 메인 로그인 / 회원가입 페이지 |
| `/student` | 학생 | 학습 현황 대시보드 |
| `/student/assessments/:id` | 학생 | 강의별 시험 목록 |
| `/student/videos/:courseId` | 학생 | 강의 영상 시청 |
| `/student/career` | 학생 | AI 진로 상담 |
| `/teacher` | 교사 | 강의·학생·영상 관리 대시보드 |
| `/teacher/questions` | 교사 | AI 문제 생성 |
| `/teacher/grading` | 교사 | 제출 답안 채점 |
| `/teacher/career` | 교사 | 학생 진로 현황 조회 |
| `/admin` | 관리자 | 전체 현황, 위험 학생, 리포트 |

---

## 자주 발생하는 오류

### Windows에서 `alembic upgrade head` 실패 (WinError 64)

`alembic/env.py` 맨 위에 아래 코드를 추가하세요:
```python
import sys, asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
```

### `.\venv\Scripts\activate` 오류 (PowerShell 실행 정책)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### PostgreSQL 사용 시 DB 연결 오류 (`localhost` → `127.0.0.1`)

Windows에서 `localhost`는 IPv6(`::1`)로 연결을 시도할 수 있습니다.  
`.env`의 `DATABASE_URL`에서 `localhost`를 `127.0.0.1`로 변경하세요.

---

## 기여 방법

1. 이 저장소를 Fork합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature/기능명`
3. 변경 사항을 커밋합니다: `git commit -m "feat: 기능 설명"`
4. 브랜치에 Push합니다: `git push origin feature/기능명`
5. Pull Request를 생성합니다.

---

## 팀

**Code Horizon Team** - 2024

- [김민균](https://github.com/alswhitetiger)
- [조세희](https://github.com/SEHEE-8546)
- [양정민](https://github.com/Yangmin3)
- [신승철](https://github.com/ssshinnpson)

---

## 라이선스

MIT License
