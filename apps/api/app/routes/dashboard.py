import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import current_active_user
from app.models.user import User
from app.schemas.dashboard import DashboardOverview, ActivityItem, TrendPoint, DayCount
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardOverview)
async def get_overview(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get aggregated dashboard stats."""
    return await dashboard_service.get_overview(db, user.id, user.organization_id, user.role)


@router.get("/activity", response_model=list[ActivityItem])
async def get_live_activity(
    limit: int = Query(10, ge=1, le=50),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get recent activity stream."""
    return await dashboard_service.get_live_activity(
        db, user.id, user.organization_id, limit, user.role
    )


@router.get("/charts/cfu-trend", response_model=list[TrendPoint])
async def get_cfu_trend(
    days: int = Query(7, ge=1, le=90),
    scope: str = Query("mine"),
    target_user_id: Optional[uuid.UUID] = Query(None),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get CFU/ml trend data."""
    return await dashboard_service.get_cfu_trend(
        db, user.id, user.organization_id, user.role, days, scope, target_user_id
    )


@router.get("/charts/analyses-per-day", response_model=list[DayCount])
async def get_analyses_per_day(
    days: int = Query(7, ge=1, le=90),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get analyses per day."""
    return await dashboard_service.get_analyses_per_day(db, user.id, days)
