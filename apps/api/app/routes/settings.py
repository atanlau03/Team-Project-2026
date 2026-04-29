from typing import Any
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import current_active_user
from app.models.user import User
from app.schemas.settings import UserSettingsResponse, UserSettingsUpdate, SystemIntegrityResponse
from app.schemas.user import ProfileUpdate
from app.services import settings_service

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/", response_model=UserSettingsResponse)
async def get_settings(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get current user settings."""
    return await settings_service.get_settings(db, user.id)


@router.patch("/", response_model=UserSettingsResponse)
async def update_settings(
    data: UserSettingsUpdate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Update lab defaults, theme, language."""
    return await settings_service.update_settings(db, user.id, data)


@router.patch("/profile")
async def update_profile(
    data: ProfileUpdate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Update name, title, organization."""
    return await settings_service.update_profile(db, user.id, data)


@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Upload profile picture."""
    return await settings_service.upload_avatar(db, user.id, file)


@router.get("/integrity", response_model=SystemIntegrityResponse)
async def get_integrity(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get system integrity and health stats."""
    return await settings_service.get_system_integrity_stats(db)
