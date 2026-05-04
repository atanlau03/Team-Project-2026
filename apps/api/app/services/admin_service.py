import uuid
import math
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_users.password import PasswordHelper

from app.models.user import User
from app.models.analysis import Analysis
from app.models.organization import Organization
from app.models.user_settings import UserSettings
from app.schemas.admin import AdminUserCreateRequest


password_helper = PasswordHelper()


async def list_users(
    db: AsyncSession,
    requesting_user: User,
    search: Optional[str] = None,
    role: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """List users, scoped by requesting user's role."""
    base = select(User, Organization.name.label("org_name")).outerjoin(
        Organization, User.organization_id == Organization.id
    ).where(User.email != "admin@platesense.lab")

    # Scoping for Lab Manager
    if requesting_user.role == "lab_manager":
        base = base.where(User.supervisor_id == requesting_user.id)
    
    if search:
        base = base.where(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role:
        base = base.where(User.role == role)

    # Count
    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = max(1, math.ceil(total / page_size))

    # Fetch page
    stmt = base.order_by(User.role.asc(), User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    rows = result.unique().all()

    items = []
    for user, org_name in rows:
        items.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_name": org_name,
            "avatar_url": user.avatar_url,
            "supervisor_id": user.supervisor_id,
            "supervisor_name": user.supervisor_name,
            "is_active": user.is_active,
            "created_at": user.created_at,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


async def create_user(db: AsyncSession, data: AdminUserCreateRequest) -> dict:
    """Create a new user (admin only). Password strength is validated by the schema."""
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "A user with this email already exists.")

    # Resolve organization name → id
    organization_id = None
    if data.organization_name:
        result = await db.execute(
            select(Organization).where(Organization.name == data.organization_name)
        )
        org = result.scalar_one_or_none()
        if not org:
            org = Organization(name=data.organization_name)
            db.add(org)
            await db.flush()
        organization_id = org.id

    # Validate supervisor if provided
    if data.supervisor_id:
        sup_result = await db.execute(select(User).where(User.id == data.supervisor_id))
        supervisor = sup_result.scalar_one_or_none()
        if not supervisor or supervisor.role != "lab_manager":
            raise HTTPException(400, "Supervisor must be an existing lab manager.")

    # Create user
    hashed_password = password_helper.hash(data.password)
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hashed_password,
        role=data.role,
        organization_id=organization_id,
        supervisor_id=data.supervisor_id,
        is_active=True,
        is_verified=True,
        is_superuser=False,
    )
    db.add(user)
    await db.flush()

    # Create default settings
    try:
        user_settings = UserSettings(user_id=user.id)
        db.add(user_settings)
    except Exception:
        pass

    await db.commit()
    await db.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
    }


async def delete_user(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Delete a user and their settings."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.unique().scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")
    if user.role == "admin":
        raise HTTPException(400, "Cannot delete admin users.")

    # Unassign any team members supervised by this user
    team_result = await db.execute(select(User).where(User.supervisor_id == user_id))
    for member in team_result.scalars().all():
        member.supervisor_id = None

    # Delete settings
    await db.execute(delete(UserSettings).where(UserSettings.user_id == user_id))

    await db.delete(user)
    await db.commit()


async def update_user_role(
    db: AsyncSession, user_id: uuid.UUID, new_role: str
) -> dict:
    """Change a user's role."""
    if new_role not in ("researcher", "lab_manager"):
        raise HTTPException(400, "Role must be 'researcher' or 'lab_manager'.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.unique().scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")

    old_role = user.role
    user.role = new_role
    user.is_superuser = new_role == "admin"

    # If demoted from lab_manager, unassign their team members
    if old_role == "lab_manager" and new_role != "lab_manager":
        team_result = await db.execute(select(User).where(User.supervisor_id == user_id))
        for member in team_result.scalars().all():
            member.supervisor_id = None

    # If promoted to lab_manager, clear their own supervisor
    if new_role == "lab_manager":
        user.supervisor_id = None

    await db.commit()
    await db.refresh(user)

    return {"id": str(user.id), "role": user.role, "email": user.email}


async def assign_supervisor(
    db: AsyncSession, user_id: uuid.UUID, supervisor_id: Optional[uuid.UUID]
) -> dict:
    """Assign or unassign a lab manager as supervisor for a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.unique().scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")

    if supervisor_id:
        sup_result = await db.execute(select(User).where(User.id == supervisor_id))
        supervisor = sup_result.unique().scalar_one_or_none()
        if not supervisor or supervisor.role != "lab_manager":
            raise HTTPException(400, "Supervisor must be an existing lab manager.")

    user.supervisor_id = supervisor_id
    await db.commit()
    await db.refresh(user)

    return {
        "id": str(user.id),
        "supervisor_id": str(user.supervisor_id) if user.supervisor_id else None,
        "email": user.email,
    }


async def update_user_status(
    db: AsyncSession, user_id: uuid.UUID, is_active: bool
) -> dict:
    """Activate or deactivate a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.unique().scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")

    user.is_active = is_active
    await db.commit()
    await db.refresh(user)

    return {"id": str(user.id), "is_active": user.is_active, "email": user.email}


async def get_system_stats(db: AsyncSession) -> dict:
    """Get system-wide statistics for the admin dashboard."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_researchers = (
        await db.execute(
            select(func.count(User.id)).where(User.role == "researcher")
        )
    ).scalar() or 0
    total_lab_managers = (
        await db.execute(
            select(func.count(User.id)).where(User.role == "lab_manager")
        )
    ).scalar() or 0
    total_admins = (
        await db.execute(
            select(func.count(User.id)).where(User.role == "admin")
        )
    ).scalar() or 0
    total_analyses = (
        await db.execute(select(func.count(Analysis.id)))
    ).scalar() or 0
    total_finalized = (
        await db.execute(
            select(func.count(Analysis.id)).where(Analysis.status == "finalized")
        )
    ).scalar() or 0
    total_organizations = (
        await db.execute(select(func.count(Organization.id)))
    ).scalar() or 0

    return {
        "total_users": total_users,
        "total_researchers": total_researchers,
        "total_lab_managers": total_lab_managers,
        "total_admins": total_admins,
        "total_analyses": total_analyses,
        "total_finalized": total_finalized,
        "total_organizations": total_organizations,
    }
