import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import current_admin, current_lab_manager
from app.models.user import User
from app.schemas.admin import (
    PaginatedUsers,
    RoleUpdateRequest,
    StatusUpdateRequest,
    SupervisorUpdateRequest,
    AdminUserCreateRequest,
    AdminSystemStats,
)
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=PaginatedUsers)
async def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(current_lab_manager),
    db: AsyncSession = Depends(get_async_session),
):
    """List all users (scoped for lab managers)."""
    return await admin_service.list_users(db, user, search, role, page, page_size)


@router.post("/users", status_code=201)
async def create_user(
    data: AdminUserCreateRequest,
    admin: User = Depends(current_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """Create a new user (admin only)."""
    return await admin_service.create_user(db, data)


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    admin: User = Depends(current_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """Delete a user (admin only)."""
    await admin_service.delete_user(db, user_id)


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: uuid.UUID,
    data: RoleUpdateRequest,
    admin: User = Depends(current_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """Change a user's role (admin only)."""
    return await admin_service.update_user_role(db, user_id, data.role)


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: uuid.UUID,
    data: StatusUpdateRequest,
    admin: User = Depends(current_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """Activate or deactivate a user (admin only)."""
    return await admin_service.update_user_status(db, user_id, data.is_active)


@router.patch("/users/{user_id}/supervisor")
async def assign_supervisor(
    user_id: uuid.UUID,
    data: SupervisorUpdateRequest,
    admin: User = Depends(current_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """Assign or unassign a lab manager as supervisor for a user (admin only)."""
    return await admin_service.assign_supervisor(db, user_id, data.supervisor_id)


@router.get("/stats", response_model=AdminSystemStats)
async def get_system_stats(
    admin: User = Depends(current_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """Get system-wide statistics (admin only)."""
    return await admin_service.get_system_stats(db)
