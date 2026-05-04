import uuid
import math
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import Analysis
from app.models.audit_event import AuditEvent
from app.models.colony import Colony
from app.models.user import User
from app.schemas.dashboard import (
    DashboardOverview,
    ActivityItem,
    TrendPoint,
    DayCount,
)


def _team_user_ids_subquery(user_id: uuid.UUID):
    """Subquery: returns user IDs that belong to this lab_manager's team (including self)."""
    return select(User.id).where(
        or_(User.supervisor_id == user_id, User.id == user_id)
    )


async def get_overview(
    db: AsyncSession,
    user_id: uuid.UUID,
    organization_id: Optional[uuid.UUID],
    role: str = "researcher",
) -> DashboardOverview:
    """Aggregated stats for the dashboard hero section."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    # Total colonies today — admin sees ALL, lab_manager sees team, researcher sees org/own
    base = select(func.coalesce(func.sum(Analysis.final_colony_count), 0))
    if role == "lab_manager":
        team_ids = _team_user_ids_subquery(user_id)
        base = base.where(Analysis.user_id.in_(team_ids))
    elif role != "admin":
        if organization_id:
            base = base.join(User, Analysis.user_id == User.id).where(
                User.organization_id == organization_id
            )
        else:
            base = base.where(Analysis.user_id == user_id)

    today_colonies = (
        await db.execute(base.where(Analysis.created_at >= today_start))
    ).scalar() or 0

    yesterday_colonies = (
        await db.execute(
            base.where(
                Analysis.created_at >= yesterday_start,
                Analysis.created_at < today_start,
            )
        )
    ).scalar() or 0

    change_pct = 0.0
    if yesterday_colonies > 0:
        change_pct = round(
            ((today_colonies - yesterday_colonies) / yesterday_colonies) * 100, 1
        )

    # AI accuracy avg
    accuracy_stmt = select(func.avg(Analysis.ai_confidence)).where(
        Analysis.ai_confidence.isnot(None)
    )
    avg_accuracy = (await db.execute(accuracy_stmt)).scalar() or 0.994

    # Today's analysis count (scoped)
    count_stmt = select(func.count()).select_from(Analysis).where(Analysis.created_at >= today_start)
    if role == "lab_manager":
        team_ids = _team_user_ids_subquery(user_id)
        count_stmt = count_stmt.where(Analysis.user_id.in_(team_ids))
    elif role != "admin":
        count_stmt = count_stmt.where(Analysis.user_id == user_id)
    total_analyses = (await db.execute(count_stmt)).scalar() or 0

    # Unverified count (Action required)
    unverified_stmt = select(func.count()).select_from(Analysis).where(Analysis.status == "ai_complete")
    if role == "lab_manager":
        team_ids = _team_user_ids_subquery(user_id)
        unverified_stmt = unverified_stmt.where(Analysis.user_id.in_(team_ids))
    elif role != "admin":
        unverified_stmt = unverified_stmt.where(Analysis.user_id == user_id)
    unverified_count = (await db.execute(unverified_stmt)).scalar() or 0

    # Time saved: 5 mins per plate manual vs ~1 sec AI. 
    time_saved = (total_analyses * 5) / 60

    # Peak volume calculation (Dynamic with UTC+7 Offset)
    peak_stmt = (
        select(func.extract('hour', Analysis.created_at).label('hr'))
        .where(Analysis.created_at >= today_start)
        .group_by('hr')
        .order_by(func.count().desc())
        .limit(1)
    )
    peak_hour = (await db.execute(peak_stmt)).scalar()
    peak_time_str = "—"
    if peak_hour is not None:
        # Convert UTC hour to Local (+7)
        local_hr = (int(peak_hour) + 7) % 24
        ampm = "AM" if local_hr < 12 else "PM"
        display_hr = local_hr if local_hr <= 12 else local_hr - 12
        if display_hr == 0: display_hr = 12
        peak_time_str = f"{display_hr}:00 {ampm}"

    # Top Species calculation
    species_stmt = (
        select(Colony.species_name, func.count().label('cnt'))
        .join(Analysis, Colony.analysis_id == Analysis.id)
    )
    if role == "lab_manager":
        team_ids = _team_user_ids_subquery(user_id)
        species_stmt = species_stmt.where(Analysis.user_id.in_(team_ids))
    elif role != "admin":
        if organization_id:
            species_stmt = species_stmt.join(User, Analysis.user_id == User.id).where(User.organization_id == organization_id)
        else:
            species_stmt = species_stmt.where(Analysis.user_id == user_id)
    
    species_stmt = species_stmt.group_by(Colony.species_name).order_by(func.count().desc()).limit(5)
    species_results = (await db.execute(species_stmt)).all()

    total_colonies_all_time = sum(r.cnt for r in species_results) if species_results else 1
    top_species = [
        {
            "name": r.species_name or "Unknown",
            "count": r.cnt,
            "percentage": round((r.cnt / total_colonies_all_time) * 100, 1) if total_colonies_all_time > 0 else 0
        }
        for r in species_results
    ]

    return DashboardOverview(
        total_colonies_today=int(today_colonies),
        colonies_change_pct=change_pct,
        ai_accuracy_avg=round(float(avg_accuracy), 4),
        total_analyses_today=total_analyses,
        peak_volume_time=peak_time_str,
        system_status="optimal",
        time_saved_hours=round(time_saved, 1),
        unverified_count=unverified_count,
        top_species=top_species
    )


async def get_live_activity(
    db: AsyncSession,
    user_id: uuid.UUID,
    organization_id: Optional[uuid.UUID],
    limit: int = 10,
    role: str = "researcher",
) -> list[ActivityItem]:
    """Recent activity stream. Admin sees all users, lab_manager sees team."""
    stmt = (
        select(AuditEvent, User.full_name, User.avatar_url, Analysis.sample_id)
        .outerjoin(User, AuditEvent.user_id == User.id)
        .join(Analysis, AuditEvent.analysis_id == Analysis.id)
    )

    if role == "lab_manager":
        team_ids = _team_user_ids_subquery(user_id)
        stmt = stmt.where(AuditEvent.user_id.in_(team_ids))
    elif role != "admin":
        if organization_id:
            # Filter by org using the user already joined via AuditEvent.user_id
            stmt = stmt.where(User.organization_id == organization_id)
        else:
            stmt = stmt.where(AuditEvent.user_id == user_id)

    stmt = stmt.order_by(AuditEvent.created_at.desc()).limit(limit)

    result = await db.execute(stmt)
    rows = result.all()

    return [
        ActivityItem(
            event_type=event.event_type,
            description=event.description,
            user_name=user_name or "System",
            user_avatar=avatar,
            sample_id=sample_id,
            created_at=event.created_at,
        )
        for event, user_name, avatar, sample_id in rows
    ]


async def get_cfu_trend(
    db: AsyncSession,
    user_id: uuid.UUID,
    organization_id: Optional[uuid.UUID],
    role: str,
    days: int = 7,
    scope: str = "mine",
    target_user_id: Optional[uuid.UUID] = None,
) -> list[TrendPoint]:
    """Average CFU/ml per day for the last N days."""
    start = datetime.now(timezone.utc) - timedelta(days=days)
    
    base = select(Analysis)
    if scope == "team":
        if role == "admin":
            if target_user_id:
                base = base.where(Analysis.user_id == target_user_id)
        elif role == "lab_manager":
            team_ids = _team_user_ids_subquery(user_id)
            if target_user_id:
                base = base.where(Analysis.user_id == target_user_id)
            else:
                base = base.where(Analysis.user_id.in_(team_ids))
        elif organization_id:
            base = base.join(User, Analysis.user_id == User.id).where(User.organization_id == organization_id)
            if target_user_id:
                base = base.where(Analysis.user_id == target_user_id)
        else:
            base = base.where(Analysis.user_id == user_id)
    else:
        base = base.where(Analysis.user_id == user_id)

    stmt = (
        select(
            func.date(Analysis.created_at).label("day"),
            func.avg(Analysis.calculated_cfu_ml).label("avg_cfu"),
        )
        .select_from(base.subquery())
        .where(Analysis.created_at >= start, Analysis.calculated_cfu_ml.isnot(None))
        .group_by(func.date(Analysis.created_at))
        .order_by(func.date(Analysis.created_at))
    )
    result = await db.execute(stmt)
    return [
        TrendPoint(date=str(row.day), value=round(float(row.avg_cfu), 2))
        for row in result.all()
    ]


async def get_analyses_per_day(
    db: AsyncSession,
    user_id: uuid.UUID,
    days: int = 7,
) -> list[DayCount]:
    """Number of analyses per day for the last N days."""
    start = datetime.now(timezone.utc) - timedelta(days=days)
    stmt = (
        select(
            func.date(Analysis.created_at).label("day"),
            func.count().label("cnt"),
        )
        .where(Analysis.created_at >= start)
        .group_by(func.date(Analysis.created_at))
        .order_by(func.date(Analysis.created_at))
    )
    result = await db.execute(stmt)
    return [
        DayCount(date=str(row.day), count=row.cnt) for row in result.all()
    ]
