import uuid
import math
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.analysis import Analysis
from app.models.organization import Organization


async def list_users(
    db: AsyncSession,
    search: Optional[str] = None,
    role: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """List all users with optional search and role filter."""
    base = select(User, Organization.name.label("org_name")).outerjoin(
        Organization, User.organization_id == Organization.id
    ).where(User.email != "admin@platesense.lab")

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

    items = [
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_name": org_name,
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
        for user, org_name in rows
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


async def update_user_role(
    db: AsyncSession, user_id: uuid.UUID, new_role: str
) -> dict:
    """Change a user's role."""
    if new_role not in ("researcher", "admin"):
        from fastapi import HTTPException
        raise HTTPException(400, "Invalid role. Must be 'researcher' or 'admin'.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.unique().scalar_one_or_none()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(404, "User not found.")

    user.role = new_role
    user.is_superuser = new_role == "admin"
    await db.commit()
    await db.refresh(user)

    return {"id": str(user.id), "role": user.role, "email": user.email}


async def update_user_status(
    db: AsyncSession, user_id: uuid.UUID, is_active: bool
) -> dict:
    """Activate or deactivate a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.unique().scalar_one_or_none()
    if not user:
        from fastapi import HTTPException
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
        "total_admins": total_admins,
        "total_analyses": total_analyses,
        "total_finalized": total_finalized,
        "total_organizations": total_organizations,
    }
