from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "PlateSense API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    # ── Database ─────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://platesense:platesense@localhost:5432/platesense"

    # ── Auth / JWT ───────────────────────────────────────
    SECRET_KEY: str = "CHANGE-ME-super-secret-key-for-platesense-jwt"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    RESET_PASSWORD_TOKEN_SECRET: str = "CHANGE-ME-reset-password-secret"
    VERIFICATION_TOKEN_SECRET: str = "CHANGE-ME-verification-token-secret"

    # ── Google OAuth (optional) ──────────────────────────
    GOOGLE_OAUTH_CLIENT_ID: Optional[str] = None
    GOOGLE_OAUTH_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/google/callback"

    # ── SMTP / Email (optional) ──────────────────────────
    SMTP_HOST: Optional[str] = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "noreply@platesense.ai"
    SMTP_TLS: bool = True
    FRONTEND_URL: str = "http://localhost:5173"

    # ── File Storage ─────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_PLATE_IMAGE_SIZE: int = 25 * 1024 * 1024  # 25 MB
    MAX_AVATAR_SIZE: int = 5 * 1024 * 1024  # 5 MB
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png"]

    # ── CORS ─────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
