# EduLink AI - AI 기반 교육 플랫폼

> 교사와 학생을 위한 AI 통합 교육 관리 시스템

---

## 프로젝트 소개

**EduLink AI**는 인공지능을 활용하여 교사의 업무를 자동화하고, 학생의 학습을 개인화하는 교육 플랫폼입니다.

- 교사는 AI로 시험 문제를 자동 생성하고 답안을 자동 채점할 수 있습니다.
- 학생은 학습 현황을 실시간으로 확인하고, AI 진로 상담을 받을 수 있습니다.

---

## 주요 기능

### 교사 기능
| 기능 | 설명 |
|------|------|
| AI 문제 생성 | 과목·학년·주제를 선택하면 AI가 시험 문제를 자동 생성 |
| 답안 채점 | 제출된 답안을 AI가 자동 채점 및 피드백 제공 |
| 학생 관리 | 강의에 학생 초대, 제거, 현황 조회 |
| 시험 관리 | 시험 생성·배포, 제출 현황 확인 |

### 학생 기능
| 기능 | 설명 |
|------|------|
| 시험 응시 | 배정된 시험 응시, 결과 즉시 확인 |
| 학습 현황 | 과목별 점수, 학습 이력 대시보드 |
| AI 진로 상담 | 희망 직업 설정 후 AI와 진로 채팅 상담 |
| 맞춤 추천 | AI가 학습 패턴 분석 후 보완이 필요한 과목 추천 |

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
- **Database**: PostgreSQL + SQLAlchemy (비동기)
- **Cache**: Redis
- **Auth**: JWT + OAuth (Google, Kakao, Naver)
- **AI**: Anthropic Claude API, HuggingFace

---

## 프로젝트 구조

```
Code-Horizon-team/
└── edulink-ai/
    ├── frontend/          # Next.js 프론트엔드
    │   ├── app/
    │   │   ├── (auth)/    # 로그인, 회원가입, OAuth
    │   │   ├── student/   # 학생 페이지
    │   │   └── teacher/   # 교사 페이지
    │   ├── components/    # 재사용 UI 컴포넌트
    │   └── lib/           # API 클라이언트, 유틸리티
    └── backend/           # FastAPI 백엔드
        ├── app/
        │   ├── routers/   # API 엔드포인트
        │   ├── models/    # DB 모델
        │   ├── services/  # AI 서비스 로직
        │   └── core/      # 설정, 인증, DB 연결
        └── alembic/       # DB 마이그레이션
```

---

## 시작하기

### 필수 설치 항목
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 15+](https://www.postgresql.org/download/)

### 1단계: 저장소 클론

```bash
git clone https://github.com/alswhitetiger/Code-Horizon-team.git
cd Code-Horizon-team/edulink-ai
```

### 2단계: 데이터베이스 생성

```bash
psql -U postgres -c "CREATE DATABASE edulink;"
```

### 3단계: 백엔드 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt

# 환경변수 파일 설정
cp .env.example .env
# .env 파일을 열어 DATABASE_URL, ANTHROPIC_API_KEY 등 입력

# DB 테이블 생성
alembic upgrade head

# 서버 실행
uvicorn app.main:app --reload
```

백엔드가 `http://localhost:8000` 에서 실행됩니다.

### 4단계: 프론트엔드 설정

```bash
cd frontend

# 패키지 설치
npm install

# 환경변수 파일 생성
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 개발 서버 실행
npm run dev
```

프론트엔드가 `http://localhost:3000` 에서 실행됩니다.

---

## 환경변수 설정

### 백엔드 (`backend/.env`)

```env
# 데이터베이스 (Windows는 localhost 대신 127.0.0.1 사용)
DATABASE_URL=postgresql+asyncpg://postgres:비밀번호@127.0.0.1:5432/edulink

# Redis
REDIS_URL=redis://localhost:6379

# AI API 키 (필수)
ANTHROPIC_API_KEY=sk-ant-...        # https://console.anthropic.com
HF_TOKEN=hf_...                      # https://huggingface.co/settings/tokens

# JWT 인증 (랜덤 32자 이상 문자열)
JWT_SECRET=랜덤문자열32자이상
JWT_EXPIRE_MINUTES=1440

# 서버 URL
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# 소셜 로그인 (선택)
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

### Anthropic Claude API (AI 기능 핵심, 유료)
1. [console.anthropic.com](https://console.anthropic.com) 접속 및 회원가입
2. 좌측 메뉴 **API Keys** → **Create Key**
3. 생성된 `sk-ant-...` 키를 `.env`에 입력
> 신규 가입 시 $5 무료 크레딧 제공

### HuggingFace Token (진로 AI 기능, 무료)
1. [huggingface.co](https://huggingface.co) 접속 및 회원가입
2. 우측 상단 프로필 → **Settings** → **Access Tokens**
3. **New token** → Role: **Read** → 생성
4. `hf_...` 토큰을 `.env`에 입력

---

## 데모 계정

서버 실행 후 `seed.py`를 실행하면 아래 테스트 계정이 생성됩니다.

```bash
# 백엔드 디렉토리에서 실행
python seed.py
```

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 교사 | teacher@demo.com | demo1234 |
| 학생 | student@demo.com | demo1234 |
| 관리자 | admin@demo.com | demo1234 |

---

## 화면 구성

| 경로 | 접근 | 설명 |
|------|------|------|
| `/` | 전체 | 메인 로그인 페이지 |
| `/student` | 학생 | 학습 현황 대시보드 |
| `/student/assessments/:id` | 학생 | 강의별 시험 목록 |
| `/student/career` | 학생 | AI 진로 상담 |
| `/teacher` | 교사 | 강의 및 학생 관리 |
| `/teacher/questions` | 교사 | AI 문제 생성 |
| `/teacher/grading` | 교사 | 제출 답안 채점 |

---

## 자주 발생하는 오류

### Windows에서 `alembic upgrade head` 실패
`alembic/env.py` 맨 위에 아래 코드 추가:
```python
import sys, asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
```

### psql 명령어를 찾을 수 없음
PostgreSQL bin 경로를 PATH에 추가하거나 전체 경로 사용:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

### DB 연결 오류 (`localhost` → `127.0.0.1`)
Windows에서 `localhost`는 IPv6로 연결 시도할 수 있습니다.
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

- 김민균
- 조세희
- 양정민
- 신승철

---

## 라이선스

MIT License
