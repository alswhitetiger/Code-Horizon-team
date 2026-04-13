from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./edulink.db"
    REDIS_URL: str = ""
    ANTHROPIC_API_KEY: str = ""
    HF_TOKEN: str = ""
    JWT_SECRET: str = "change-this-to-a-random-32-char-string"
    JWT_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # Kakao OAuth (https://developers.kakao.com)
    KAKAO_CLIENT_ID: str = ""
    KAKAO_CLIENT_SECRET: str = ""

    # Naver OAuth (https://developers.naver.com)
    NAVER_CLIENT_ID: str = ""
    NAVER_CLIENT_SECRET: str = ""

    # Google OAuth (https://console.cloud.google.com)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Resend 이메일 설정 (https://resend.com - 무료 3000건/월)
    RESEND_API_KEY: str = ""

    # SMTP 이메일 설정 (로컬 개발용 / Railway에서는 SMTP 포트 차단됨)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "EduLink AI <noreply@edulink.ai>"

    AUTO_BOOTSTRAP: bool = False
    SEED_DEMO_DATA: bool = False

    @field_validator("FRONTEND_URL", "BACKEND_URL", mode="before")
    @classmethod
    def strip_trailing_slash(cls, v: str) -> str:
        return v.rstrip("/")

    class Config:
        env_file = ".env"

settings = Settings()
