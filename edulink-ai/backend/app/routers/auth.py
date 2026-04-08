from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import hash_password, verify_password, create_access_token, get_current_user
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
import uuid, httpx
from urllib.parse import urlencode

router = APIRouter(prefix="/api/auth", tags=["auth"])


async def _find_or_create_oauth_user(db: AsyncSession, email: str, name: str, provider: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=f"oauth:{provider}",  # 소셜 로그인 전용, 비밀번호 로그인 불가
            name=name,
            role="student",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


def _oauth_redirect(user: User) -> RedirectResponse:
    token = create_access_token({"sub": user.id, "role": user.role})
    return RedirectResponse(
        f"{settings.FRONTEND_URL}/callback?token={token}&role={user.role}"
    )

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    token = create_access_token({"sub": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}}

@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=body.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token({"sub": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}}

@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email,
            "name": current_user.name, "role": current_user.role}


# ─── 카카오 OAuth ───────────────────────────────────────────────────────────────

@router.get("/kakao")
async def kakao_login():
    if not settings.KAKAO_CLIENT_ID:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=kakao_not_configured")
    params = urlencode({
        "client_id": settings.KAKAO_CLIENT_ID,
        "redirect_uri": f"{settings.BACKEND_URL}/api/auth/kakao/callback",
        "response_type": "code",
        "scope": "account_email profile_nickname",
    })
    return RedirectResponse(f"https://kauth.kakao.com/oauth/authorize?{params}")


@router.get("/kakao/callback")
async def kakao_callback(code: str = "", error: str = "", db: AsyncSession = Depends(get_db)):
    if error or not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=kakao_denied")
    async with httpx.AsyncClient() as http:
        token_res = await http.post("https://kauth.kakao.com/oauth/token", data={
            "grant_type": "authorization_code",
            "client_id": settings.KAKAO_CLIENT_ID,
            "client_secret": settings.KAKAO_CLIENT_SECRET,
            "code": code,
            "redirect_uri": f"{settings.BACKEND_URL}/api/auth/kakao/callback",
        })
        token_data = token_res.json()
        if "error" in token_data:
            return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=kakao_token")
        user_res = await http.get("https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {token_data['access_token']}"})
        info = user_res.json()
    email = info.get("kakao_account", {}).get("email", f"kakao_{info['id']}@kakao.local")
    name = info.get("properties", {}).get("nickname", "카카오 사용자")
    user = await _find_or_create_oauth_user(db, email, name, "kakao")
    return _oauth_redirect(user)


# ─── 네이버 OAuth ───────────────────────────────────────────────────────────────

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
    user = await _find_or_create_oauth_user(db, email, name, "naver")
    return _oauth_redirect(user)


# ─── 구글 OAuth ─────────────────────────────────────────────────────────────────

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
    user = await _find_or_create_oauth_user(db, email, name, "google")
    return _oauth_redirect(user)
