# EduLink AI - AI 기반 교육 플랫폼

> 교사와 학생을 위한 AI 통합 교육 관리 시스템

---

## 프로젝트 소개

**EduLink AI**는 인공지능을 활용하여 교사의 업무를 자동화하고, 학생의 학습을 개인화하는 교육 플랫폼입니다.

- 교사는 AI로 시험 문제를 자동 생성하고 제출된 답안을 자동 채점할 수 있습니다.
- 학생은 학습 현황을 실시간으로 확인하고, AI 진로 상담을 받을 수 있습니다.

---

## 주요 기능

### 교사 기능
| 기능 | 설명 |
|------|------|
| AI 문제 생성 | 과목·학년·주제를 선택하면 AI가 시험 문제를 자동 생성 |
| 문제 은행 | 생성된 문제를 DB에 저장하고 재사용 (AI 폴백 지원) |
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
    ├── frontend/                  # Next.js 프론트엔드
    │   ├── app/
    │   │   ├── (auth)/            # 로그인, 회원가입, OAuth 콜백
    │   │   ├── student/           # 학생 페이지 (대시보드, 시험, 진로)
    │   │   ├── teacher/           # 교사 페이지 (문제 생성, 채점, 관리)
    │   │   └── admin/             # 관리자 페이지
    │   ├── components/            # 재사용 UI 컴포넌트
    │   ├── lib/                   # API 클라이언트, 유틸리티
    │   ├── store/                 # Zustand 전역 상태
    │   └── types/                 # TypeScript 타입 정의
    └── backend/                   # FastAPI 백엔드
        ├── app/
        │   ├── routers/           # API 엔드포인트
        │   ├── models/            # DB 모델 (SQLAlchemy)
        │   ├── schemas/           # Pydantic 스키마
        │   ├── services/          # AI 서비스 로직
        │   └── core/              # 설정, 인증, DB 연결
        ├── alembic/               # DB 마이그레이션
        ├── seed.py                # 데모 계정 및 샘플 데이터 생성
        └── seed_question_bank_static.py  # 문제 은행 초기 데이터 생성
```

---

## 시작하기

### 필수 설치 항목

아래 프로그램들을 먼저 설치해주세요.

| 프로그램 | 권장 버전 | 다운로드 |
|----------|-----------|----------|
| Python | 3.11 이상 | [python.org](https://www.python.org/downloads/) |
| Node.js | 18 이상 | [nodejs.org](https://nodejs.org/) |
| PostgreSQL | 15 이상 | [postgresql.org](https://www.postgresql.org/download/) |
| Redis | 최신 | Windows: [GitHub Releases](https://github.com/microsoftarchive/redis/releases) / macOS: `brew install redis` |

---

### 1단계: 저장소 클론

```bash
git clone https://github.com/alswhitetiger/Code-Horizon-team.git
cd Code-Horizon-team/edulink-ai
```

---

### 2단계: 데이터베이스 생성

PostgreSQL에 `edulink` 데이터베이스를 생성합니다.

**macOS / Linux:**
```bash
psql -U postgres -c "CREATE DATABASE edulink;"
```

**Windows (PowerShell):**
```powershell
# PostgreSQL 설치 경로에 맞게 수정 (버전 숫자 확인)
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE edulink;"
```

> psql 명령어를 찾을 수 없다면 PostgreSQL `bin` 폴더를 시스템 PATH에 추가하거나 위처럼 전체 경로를 사용하세요.

---

### 3단계: Redis 실행

**macOS / Linux:**
```bash
redis-server
```

**Windows:**
```powershell
# Redis 설치 폴더에서 실행
redis-server.exe
```

> Redis가 실행 중이 아니어도 기본 기능은 동작하지만, 캐시 및 일부 AI 기능이 비활성화됩니다.

---

### 4단계: 백엔드 설정

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

**패키지 설치:**
```bash
pip install -r requirements.txt
```

**환경변수 파일 설정:**
```bash
# 예시 파일 복사
cp .env.example .env
```

`.env` 파일을 열어 아래 값들을 입력합니다 (자세한 내용은 [환경변수 설정](#환경변수-설정) 참고):
```env
DATABASE_URL=postgresql+asyncpg://postgres:비밀번호@127.0.0.1:5432/edulink
ANTHROPIC_API_KEY=sk-ant-...
HF_TOKEN=hf_...
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

백엔드가 `http://localhost:8000` 에서 실행됩니다.  
API 문서: `http://localhost:8000/docs`

---

### 5단계: 프론트엔드 설정

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

프론트엔드가 `http://localhost:3000` 에서 실행됩니다.

---

### 6단계: 데모 데이터 생성 (선택)

백엔드 가상환경이 활성화된 상태에서 `backend` 디렉토리 안에서 실행합니다.

**데모 계정 + 샘플 강의/시험 생성:**
```bash
python seed.py
```

**문제 은행 초기 데이터 생성 (API 키 불필요):**
```bash
python seed_question_bank_static.py
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
# 데이터베이스 연결
# Windows는 localhost 대신 127.0.0.1 사용 (IPv6 충돌 방지)
DATABASE_URL=postgresql+asyncpg://postgres:비밀번호@127.0.0.1:5432/edulink

# Redis 캐시
REDIS_URL=redis://localhost:6379

# AI API 키 (필수)
ANTHROPIC_API_KEY=sk-ant-...        # https://console.anthropic.com
HF_TOKEN=hf_...                      # https://huggingface.co/settings/tokens

# JWT 인증 (랜덤 32자 이상 문자열 권장)
JWT_SECRET=랜덤문자열32자이상
JWT_EXPIRE_MINUTES=1440

# 서버 URL
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# 소셜 로그인 (선택 사항)
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

### Anthropic Claude API (AI 기능 핵심 - 유료)
1. [console.anthropic.com](https://console.anthropic.com) 접속 및 회원가입
2. 좌측 메뉴 **API Keys** → **Create Key**
3. 생성된 `sk-ant-...` 키를 `.env`의 `ANTHROPIC_API_KEY`에 입력

> 신규 가입 시 $5 무료 크레딧 제공

### HuggingFace Token (진로 AI 기능 - 무료)
1. [huggingface.co](https://huggingface.co) 접속 및 회원가입
2. 우측 상단 프로필 → **Settings** → **Access Tokens**
3. **New token** → Role: **Read** → 생성
4. `hf_...` 토큰을 `.env`의 `HF_TOKEN`에 입력

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
| `/admin` | 관리자 | 전체 현황 및 리포트 |

---

## 자주 발생하는 오류

### Windows에서 `alembic upgrade head` 실패 (WinError 64)

`alembic/env.py` 맨 위에 아래 코드를 추가하세요:
```python
import sys, asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
```

### psql 명령어를 찾을 수 없음

PostgreSQL `bin` 경로를 시스템 환경변수 PATH에 추가하거나, 전체 경로를 사용하세요:
```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres
```

### DB 연결 오류 (`localhost` → `127.0.0.1`)

Windows에서 `localhost`는 IPv6(`::1`)로 연결을 시도할 수 있습니다.  
`.env`의 `DATABASE_URL`에서 `localhost`를 `127.0.0.1`로 변경하세요.

### `.\venv\Scripts\activate` 오류 (PowerShell 실행 정책)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

위 명령어 실행 후 다시 activate를 시도하세요.

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
