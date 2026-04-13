from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import hash_password, verify_password, create_access_token, get_current_user
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from pydantic import BaseModel
from typing import Optional
import uuid, random, string, httpx
from urllib.parse import urlencode, quote

router = APIRouter(prefix="/api/auth", tags=["auth"])


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None


class VerifyEmailRequest(BaseModel):
    email: str
    code: str


def _generate_code() -> str:
    return ''.join(random.choices(string.digits, k=6))


def _email_html(name: str, code: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#f3f4f6;padding:40px 0;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h1 style="color:#4f46e5;font-size:24px;margin:0 0 8px">EduLink AI</h1>
    <p style="color:#6b7280;margin:0 0 24px;font-size:14px">AI 기반 교육 플랫폼</p>
    <p style="color:#111827;font-size:16px">안녕하세요, <b>{name}</b>님!</p>
    <p style="color:#374151;font-size:14px;margin-bottom:24px">아래 인증 코드를 입력하여 이메일 인증을 완료해주세요.</p>
    <div style="background:#eef2ff;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
      <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#4f46e5">{code}</span>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:0">이 코드는 24시간 동안 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
  </div>
</body></html>"""


async def _send_verification_email(email: str, code: str, name: str):
    """실제 SMTP로 인증 코드 발송. SMTP 미설정 시 콘솔 출력."""
    if not settings.SMTP_HOST:
        print(f"[DEV EMAIL] {email} → 인증 코드: {code}")
        return

    import smtplib, asyncio
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText as MimeText

    def _send_sync():
        msg = MIMEMultipart('alternative')
        msg['Subject'] = '[EduLink AI] 이메일 인증 코드'
        msg['From'] = settings.SMTP_FROM
        msg['To'] = email
        msg.attach(MimeText(f"{name}님, EduLink AI 인증 코드: {code}", 'plain', 'utf-8'))
        msg.attach(MimeText(_email_html(name, code), 'html', 'utf-8'))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, email, msg.as_string())

    try:
        await asyncio.to_thread(_send_sync)
        print(f"[EMAIL] 발송 완료: {email}")
    except Exception as e:
        print(f"[EMAIL] 발송 실패: {e}")
        # 발송 실패해도 회원가입은 진행 (코드는 DB에 저장됨)


async def _find_or_create_oauth_user(db: AsyncSession, email: str, name: str, provider: str):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    is_new = False
    if not user:
        is_new = True
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=f"oauth:{provider}",
            name=name,
            role="student",
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user, is_new


def _oauth_redirect(user: User, is_new: bool = False) -> RedirectResponse:
    token = create_access_token({"sub": user.id, "role": user.role})
    if is_new:
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/callback?token={token}&role={user.role}&is_new=1&name={quote(user.name)}"
        )
    return RedirectResponse(
        f"{settings.FRONTEND_URL}/callback?token={token}&role={user.role}"
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="이메일 인증이 필요합니다. 인증 코드를 확인해주세요.")
    token = create_access_token({"sub": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}}


@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
    code = _generate_code()
    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=body.role,
        is_verified=False,
        verification_code=code,
    )
    db.add(user)
    await db.commit()
    await _send_verification_email(body.email, code, body.name)
    resp: dict = {"message": "회원가입 완료. 이메일 인증을 완료해주세요.", "email": body.email}
    # SMTP 미설정 시에만 개발 편의상 코드 노출
    if not settings.SMTP_HOST:
        resp["verification_code"] = code
    return resp


@router.post("/verify-email")
async def verify_email(body: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if user.is_verified:
        token = create_access_token({"sub": user.id, "role": user.role})
        return {"access_token": token, "token_type": "bearer",
                "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}}
    if user.verification_code != body.code:
        raise HTTPException(status_code=400, detail="인증 코드가 올바르지 않습니다.")
    user.is_verified = True
    user.verification_code = None
    await db.commit()
    token = create_access_token({"sub": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}}


@router.post("/resend-code")
async def resend_code(body: dict, db: AsyncSession = Depends(get_db)):
    email = body.get("email", "")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or user.is_verified:
        raise HTTPException(status_code=400, detail="유효하지 않은 요청입니다.")
    code = _generate_code()
    user.verification_code = code
    await db.commit()
    await _send_verification_email(email, code, user.name)
    resp: dict = {"message": "인증 코드가 재발송되었습니다."}
    if not settings.SMTP_HOST:
        resp["verification_code"] = code
    return resp


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email,
            "name": current_user.name, "role": current_user.role}


@router.patch("/profile")
async def update_profile(body: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if body.name:
        current_user.name = body.name
    if body.role:
        if body.role not in ("student", "teacher"):
            raise HTTPException(status_code=400, detail="유효하지 않은 역할입니다.")
        current_user.role = body.role
    await db.commit()
    token = create_access_token({"sub": current_user.id, "role": current_user.role})
    return {"access_token": token, "user": {"id": current_user.id, "email": current_user.email,
                                             "name": current_user.name, "role": current_user.role}}


# ─── 네이버 OAuth ────────────────────────────────────────────────────────────────

@router.get("/naver")
async def naver_login():
    if not settings.NAVER_CLIENT_ID:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=naver_not_configured")
    state = str(uuid.uuid4())
    params = urlencode({
        "client_id": settings.NAVER_CLIENT_ID,
        "redirect_uri": f"{settings.BACKEND_URL}/api/auth/naver/callback",
        "response_type": "code",
        "state": state,
    })
    return RedirectResponse(f"https://nid.naver.com/oauth2.0/authorize?{params}")


@router.get("/naver/callback")
async def naver_callback(code: str = "", state: str = "", error: str = "", db: AsyncSession = Depends(get_db)):
    if error or not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=naver_denied")
    async with httpx.AsyncClient() as http:
        token_res = await http.post("https://nid.naver.com/oauth2.0/token", params={
            "grant_type": "authorization_code",
            "client_id": settings.NAVER_CLIENT_ID,
            "client_secret": settings.NAVER_CLIENT_SECRET,
            "code": code,
            "state": state,
        })
        token_data = token_res.json()
        if token_data.get("error"):
            return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=naver_token")
        user_res = await http.get("https://openapi.naver.com/v1/nid/me",
            headers={"Authorization": f"Bearer {token_data['access_token']}"})
        info = user_res.json().get("response", {})
    email = info.get("email", f"naver_{info.get('id', uuid.uuid4())}@naver.local")
    name = info.get("name") or info.get("nickname", "네이버 사용자")
    user, is_new = await _find_or_create_oauth_user(db, email, name, "naver")
    return _oauth_redirect(user, is_new)


# ─── 구글 OAuth ──────────────────────────────────────────────────────────────────

@router.get("/google")
async def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_not_configured")
    params = urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": f"{settings.BACKEND_URL}/api/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback")
async def google_callback(code: str = "", error: str = "", db: AsyncSession = Depends(get_db)):
    if error or not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_denied")
    async with httpx.AsyncClient() as http:
        token_res = await http.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": f"{settings.BACKEND_URL}/api/auth/google/callback",
            "grant_type": "authorization_code",
        })
        token_data = token_res.json()
        if "error" in token_data:
            return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_token")
        user_res = await http.get("https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"})
        info = user_res.json()
    email = info.get("email", f"google_{info.get('id')}@google.local")
    name = info.get("name", "구글 사용자")
    user, is_new = await _find_or_create_oauth_user(db, email, name, "google")
    return _oauth_redirect(user, is_new)
