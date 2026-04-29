import uuid

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.colony import Colony
from app.models.analysis import Analysis
from app.schemas.colony import ColonyCreate, ColonyUpdate, ColonyResponse
from app.services import audit_service


async def list_colonies(
    db: AsyncSession, analysis_id: uuid.UUID
) -> list[ColonyResponse]:
    """Return all colonies for an analysis (including removed ones for audit)."""
    stmt = (
        select(Colony)
        .where(Colony.analysis_id == analysis_id)
        .order_by(Colony.created_at.asc())
    )
    result = await db.execute(stmt)
    colonies = result.scalars().all()
    return [ColonyResponse.model_validate(c) for c in colonies]


async def add_manual_colony(
    db: AsyncSession,
    analysis_id: uuid.UUID,
    user_id: uuid.UUID,
    data: ColonyCreate,
) -> ColonyResponse:
    """Add a manually-identified colony (Human-in-the-Loop)."""
    colony = Colony(
        analysis_id=analysis_id,
        label=data.label,
        position_x=data.position_x,
        position_y=data.position_y,
        area_px=data.area_px,
        morphology=data.morphology,
        confidence=1.0,  # Manual = 100% verified
        source="manual",
        added_by=user_id,
    )
    db.add(colony)

    # Update analysis final count
    await _recalculate_final_count(db, analysis_id)

    await audit_service.log_event(
        db,
        analysis_id=analysis_id,
        user_id=user_id,
        event_type="colony_added",
        description=f"Manually added colony at ({data.position_x:.0f}, {data.position_y:.0f}).",
        metadata={"position": [data.position_x, data.position_y], "source": "manual"},
    )
    await db.commit()
    await db.refresh(colony)
    return ColonyResponse.model_validate(colony)


async def update_colony(
    db: AsyncSession,
    colony_id: uuid.UUID,
    user_id: uuid.UUID,
    data: ColonyUpdate,
) -> ColonyResponse:
    """Edit colony metadata (label, position)."""
    colony = await _get_colony_or_404(db, colony_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(colony, field, value)

    await audit_service.log_event(
        db,
        analysis_id=colony.analysis_id,
        user_id=user_id,
        event_type="parameter_changed",
        description=f"Colony {colony_id} updated: {', '.join(update_data.keys())}.",
    )
    await db.commit()
    await db.refresh(colony)
    return ColonyResponse.model_validate(colony)


async def remove_colony(
    db: AsyncSession,
    colony_id: uuid.UUID,
    user_id: uuid.UUID,
) -> ColonyResponse:
    """Soft-remove a colony (sets is_removed=True)."""
    colony = await _get_colony_or_404(db, colony_id)
    colony.is_removed = True

    await _recalculate_final_count(db, colony.analysis_id)

    await audit_service.log_event(
        db,
        analysis_id=colony.analysis_id,
        user_id=user_id,
        event_type="colony_removed",
        description=f"Colony removed at ({colony.position_x:.0f}, {colony.position_y:.0f}).",
        metadata={"colony_id": str(colony_id)},
    )
    await db.commit()
    await db.refresh(colony)
    return ColonyResponse.model_validate(colony)


# ── Private Helpers ──────────────────────────────────────
async def _get_colony_or_404(db: AsyncSession, colony_id: uuid.UUID) -> Colony:
    result = await db.execute(select(Colony).where(Colony.id == colony_id))
    colony = result.scalar_one_or_none()
    if not colony:
        raise HTTPException(status_code=404, detail="Colony not found.")
    return colony


async def _recalculate_final_count(db: AsyncSession, analysis_id: uuid.UUID) -> None:
    """Recalculate the final colony count (active colonies only)."""
    count_stmt = select(func.count()).where(
        Colony.analysis_id == analysis_id,
        Colony.is_removed == False,  # noqa: E712
    )
    count = (await db.execute(count_stmt)).scalar() or 0

    result = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
    analysis = result.scalar_one_or_none()
    if analysis:
        analysis.final_colony_count = count
        if count > 0:
            dilution = 10 ** analysis.dilution_factor
            analysis.calculated_cfu_ml = count / (analysis.volume_plated_ml * dilution)
