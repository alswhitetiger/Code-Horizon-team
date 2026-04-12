# EduLink AI - 로컬 개발환경 설치 매뉴얼

새 PC에서 처음 세팅할 때 이 문서를 순서대로 따라하세요.

---

## 목차

1. [전제 조건 (설치 프로그램)](#1-전제-조건-설치-프로그램)
2. [PostgreSQL 설정](#2-postgresql-설정)
3. [Redis 설정](#3-redis-설정)
4. [Backend 설정](#4-backend-설정)
5. [Frontend 설정](#5-frontend-설정)
6. [서버 구동](#6-서버-구동)
7. [구동 확인](#7-구동-확인)

---

## 1. 전제 조건 (설치 프로그램)

아래 프로그램들은 `requirements.txt`나 `package.json`으로 설치할 수 없습니다.  
운영체제에 맞게 직접 설치해야 합니다.

### 필수 설치 목록

| 프로그램 | 버전 | 용도 |
|----------|------|------|
| Python | 3.11 이상 | Backend 실행 |
| Node.js | 18 이상 | Frontend 실행 |
| PostgreSQL | 17 권장 | 데이터베이스 |
| Redis | 최신 | 세션/캐시 |

---

### Windows

**winget으로 한 번에 설치 (PowerShell 또는 cmd):**

```cmd
winget install Python.Python.3.11 --accept-package-agreements --accept-source-agreements
winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
winget install PostgreSQL.PostgreSQL.17 --accept-package-agreements --accept-source-agreements
winget install Redis.Redis --accept-package-agreements --accept-source-agreements
```

> 설치 후 **cmd/PowerShell을 재시작**해야 PATH가 적용됩니다.

설치 확인:
```cmd
python --version
node --version
npm --version
```

---

### macOS

**Homebrew로 설치:**

```bash
# Homebrew 없으면 먼저 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install python@3.11
brew install node
brew install postgresql@17
brew install redis

# PostgreSQL, Redis 자동 시작 등록
brew services start postgresql@17
brew services start redis
```

---

### Ubuntu / Debian (Linux)

```bash
# 시스템 패키지 업데이트
sudo apt update

# Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL 17
sudo apt install -y postgresql postgresql-contrib

# Redis
sudo apt install -y redis-server

# 서비스 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

---

## 2. PostgreSQL 설정

PostgreSQL에 **데이터베이스**와 **유저**를 생성해야 합니다.

### Windows

PostgreSQL 서버가 꺼져 있으면 먼저 시작:
```cmd
"C:\Program Files\PostgreSQL\17\bin\pg_ctl" start -D "C:\Program Files\PostgreSQL\17\data"
```

psql 접속 후 DB/유저 생성:
```cmd
"C:\Program Files\PostgreSQL\17\bin\psql" -U postgres -h 127.0.0.1
```

psql 프롬프트에서:
```sql
CREATE USER edulink WITH PASSWORD 'edulink1234';
CREATE DATABASE edulink OWNER edulink;
GRANT ALL PRIVILEGES ON DATABASE edulink TO edulink;
\q
```

### macOS / Linux

```bash
# postgres 슈퍼유저로 접속
sudo -u postgres psql
```

psql 프롬프트에서:
```sql
CREATE USER edulink WITH PASSWORD 'edulink1234';
CREATE DATABASE edulink OWNER edulink;
GRANT ALL PRIVILEGES ON DATABASE edulink TO edulink;
\q
```

> 비밀번호는 원하는 값으로 바꿔도 됩니다. 단, 뒤에서 .env에 동일한 값을 입력해야 합니다.

---

## 3. Redis 설정

Redis는 설치 후 자동으로 실행됩니다.

### Windows

winget 설치 시 Windows 서비스로 자동 등록됩니다.  
수동으로 시작/확인:
```cmd
sc query Redis
net start Redis
```

### macOS

```bash
brew services start redis
```

### Linux

```bash
sudo systemctl start redis-server
```

---

## 4. Backend 설정

```
edulink-ai/
└── backend/      ← 이 디렉토리에서 작업
```

### 4-1. 가상환경 생성 및 패키지 설치

```cmd
cd edulink-ai/backend

# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 패키지 설치 (requirements.txt 사용)
pip install -r requirements.txt
```

### 4-2. 환경변수 파일 생성

`.env.example`을 복사해서 `.env`를 만듭니다:

```cmd
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

`.env` 파일을 열어서 값을 확인/수정합니다:

```env
DATABASE_URL=postgresql+asyncpg://edulink:edulink1234@127.0.0.1:5432/edulink
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=           ← AI 기능 사용 시 입력
HF_TOKEN=                    ← AI 기능 사용 시 입력
JWT_SECRET=change-this-to-a-random-32-char-string   ← 반드시 변경
JWT_EXPIRE_MINUTES=1440
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

> **DATABASE_URL 형식:**  
> `postgresql+asyncpg://<유저>:<비밀번호>@<호스트>:<포트>/<DB명>`  
> 2단계에서 설정한 유저/비밀번호와 일치해야 합니다.

### 4-3. DB 마이그레이션 (테이블 생성)

**최초 1회만 실행합니다.**

```cmd
# Windows (가상환경 활성화된 상태)
venv\Scripts\alembic upgrade head

# macOS/Linux
alembic upgrade head
```

성공 시 출력 예시:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial_schema, initial schema
INFO  [alembic.runtime.migration] Running upgrade  -> 002_add_question_bank, question bank
```

> 에러가 나면 PostgreSQL이 실행 중인지, .env의 DATABASE_URL이 올바른지 확인하세요.

---

## 5. Frontend 설정

```
edulink-ai/
└── frontend/     ← 이 디렉토리에서 작업
```

### 5-1. 패키지 설치

```cmd
cd edulink-ai/frontend
npm install
```

### 5-2. 환경변수 파일 생성

```cmd
# Windows
copy .env.local.example .env.local

# macOS/Linux
cp .env.local.example .env.local
```

`.env.local` 내용 확인 (기본값 그대로 사용):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 6. 서버 구동

**Backend와 Frontend는 각각 별도의 cmd/터미널 창에서 실행합니다.**

### Backend 서버 (터미널 1)

```cmd
cd edulink-ai/backend

# Windows
venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# macOS/Linux (가상환경 활성화 후)
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

성공 시 출력:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

### Frontend 서버 (터미널 2)

```cmd
cd edulink-ai/frontend
npm run dev
```

성공 시 출력:
```
- Local:        http://localhost:3000
```

---

## 7. 구동 확인

모두 정상이면:

| 서비스 | URL | 확인 방법 |
|--------|-----|-----------|
| Frontend | http://localhost:3000 | 브라우저에서 접속 |
| Backend | http://localhost:8000/health | `{"status":"ok"}` 응답 확인 |
| API 문서 | http://localhost:8000/docs | Swagger UI 확인 |

---

## 자주 발생하는 오류

### "connection refused" (DB 연결 실패)
```
PostgreSQL이 실행 중인지 확인:
  Windows: sc query postgresql-x64-17
  Linux:   sudo systemctl status postgresql
```

### "Module not found" (패키지 미설치)
```
가상환경이 활성화되어 있는지 확인 후 pip install -r requirements.txt 재실행
```

### Windows에서 alembic 실행 시 WinError 64
```
이미 alembic/env.py에 Windows 호환 패치가 적용되어 있습니다.
DATABASE_URL에 localhost 대신 127.0.0.1을 사용하세요.
```

### "npm: command not found"
```
Node.js 설치 후 터미널을 재시작하세요.
```

---

## 디렉토리 구조 요약

```
edulink-ai/
├── SETUP.md                  ← 이 파일
├── backend/
│   ├── .env                  ← 직접 생성 (git에 포함 안 됨)
│   ├── .env.example          ← 템플릿
│   ├── requirements.txt      ← pip 패키지 목록
│   ├── alembic/              ← DB 마이그레이션
│   ├── app/                  ← FastAPI 앱
│   └── venv/                 ← 가상환경 (git에 포함 안 됨)
└── frontend/
    ├── .env.local            ← 직접 생성 (git에 포함 안 됨)
    ├── .env.local.example    ← 템플릿
    ├── package.json          ← npm 패키지 목록
    └── node_modules/         ← npm 패키지 (git에 포함 안 됨)
```
