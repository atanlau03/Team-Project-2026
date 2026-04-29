from fastapi import APIRouter

from app.config import settings
from app.dependencies import auth_backend, fastapi_users
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter()

# ── Login / Logout ───────────────────────────────────────
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth",
    tags=["Auth"],
)

# ── Register ─────────────────────────────────────────────
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["Auth"],
)

# ── Reset Password ───────────────────────────────────────
router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["Auth"],
)

# ── Verify ───────────────────────────────────────────────
router.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["Auth"],
)

# ── Users (me) ───────────────────────────────────────────
router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["Users"],
)

# ── Google OAuth2 (Optional) ────────────────────────────
if settings.GOOGLE_OAUTH_CLIENT_ID and settings.GOOGLE_OAUTH_CLIENT_SECRET:
    from httpx_oauth.clients.google import GoogleOAuth2

    google_oauth_client = GoogleOAuth2(
        client_id=settings.GOOGLE_OAUTH_CLIENT_ID,
        client_secret=settings.GOOGLE_OAUTH_CLIENT_SECRET,
    )

    router.include_router(
        fastapi_users.get_oauth_router(
            google_oauth_client,
            auth_backend,
            state_secret=settings.SECRET_KEY,
            redirect_url=settings.GOOGLE_REDIRECT_URI,
            associate_by_email=True,
            is_verified_by_default=True,
        ),
        prefix="/auth/google",
        tags=["Auth – Google OAuth2"],
    )
