import uuid
from typing import Optional

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, schemas
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_async_session
from app.models.user import User, OAuthAccount
from app.models.organization import Organization
from app.models.user_settings import UserSettings


# ── User DB Adapter ──────────────────────────────────────
async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User, OAuthAccount)


# ── User Manager ─────────────────────────────────────────
class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.RESET_PASSWORD_TOKEN_SECRET
    verification_token_secret = settings.VERIFICATION_TOKEN_SECRET

    async def create(
        self,
        user_create: schemas.UC,
        safe: bool = False,
        request: Optional[Request] = None,
    ) -> User:
        """
        Override create to handle organization_name → organization_id resolution.
        The UserCreate schema accepts organization_name (a string) but the User
        model only has organization_id (a UUID FK).  We intercept it here.
        """
        # Extract organization_name before it reaches the model
        org_name: Optional[str] = getattr(user_create, "organization_name", None)

        # Remove it from the pydantic model so it doesn't get passed to User()
        create_dict = user_create.create_update_dict() if safe else user_create.create_update_dict_superuser()
        create_dict.pop("organization_name", None)

        # Resolve organization name → id
        if org_name:
            session = self.user_db.session
            result = await session.execute(
                select(Organization).where(Organization.name == org_name)
            )
            org = result.scalar_one_or_none()
            if not org:
                org = Organization(name=org_name)
                session.add(org)
                await session.flush()
            create_dict["organization_id"] = org.id

        # Hash password
        create_dict["hashed_password"] = self.password_helper.hash(
            create_dict.pop("password")
        )

        # Create user via the DB adapter
        user = await self.user_db.create(create_dict)

        await self.on_after_register(user, request)
        return user

    async def on_after_register(
        self, user: User, request: Optional[Request] = None
    ) -> None:
        """Create default settings for new user."""
        try:
            session = self.user_db.session
            user_settings = UserSettings(user_id=user.id)
            session.add(user_settings)
            await session.commit()
        except Exception:
            # Don't let settings creation failure block registration
            pass

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ) -> None:
        from app.services.email_service import send_reset_password_email
        print(f"DEBUG: Forgot password requested for {user.email}. Attempting to send email...")
        try:
            await send_reset_password_email(user.email, token)
            print(f"DEBUG: send_reset_password_email call completed for {user.email}")
        except Exception as e:
            print(f"DEBUG: FAILED to send email to {user.email}: {str(e)}")

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ) -> None:
        # TODO: Send verification email
        print(f"Verification requested for {user.email}. Token: {token}")


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)


# ── Auth Backend ─────────────────────────────────────────
bearer_transport = BearerTransport(tokenUrl=f"{settings.API_PREFIX}/auth/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.SECRET_KEY,
        lifetime_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)


# ── FastAPI Users Instance ───────────────────────────────
fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)


# ── Role-Based Access ───────────────────────────────────
def require_role(*allowed_roles: str):
    """Dependency factory: ensures current user has one of the allowed roles."""
    from fastapi import HTTPException

    async def _checker(user: User = Depends(current_active_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions for this action.",
            )
        return user

    return _checker


current_admin = require_role("admin")

