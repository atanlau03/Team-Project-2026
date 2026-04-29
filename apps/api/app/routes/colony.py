import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import current_active_user
from app.models.user import User
from app.schemas.colony import ColonyCreate, ColonyUpdate, ColonyResponse
from app.services import colony_service

router = APIRouter(prefix="/analyses/{analysis_id}/colonies", tags=["Colonies"])


@router.get("/", response_model=list[ColonyResponse])
async def list_colonies(
    analysis_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get all colonies for an analysis."""
    return await colony_service.list_colonies(db, analysis_id)


@router.post("/", response_model=ColonyResponse, status_code=201)
async def add_manual_colony(
    analysis_id: uuid.UUID,
    data: ColonyCreate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Add a manually-identified colony (Human-in-the-Loop)."""
    return await colony_service.add_manual_colony(db, analysis_id, user.id, data)


@router.patch("/{colony_id}", response_model=ColonyResponse)
async def update_colony(
    analysis_id: uuid.UUID,
    colony_id: uuid.UUID,
    data: ColonyUpdate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Edit colony metadata."""
    return await colony_service.update_colony(db, colony_id, user.id, data)


@router.delete("/{colony_id}", response_model=ColonyResponse)
async def remove_colony(
    analysis_id: uuid.UUID,
    colony_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Soft-remove a colony marker."""
    return await colony_service.remove_colony(db, colony_id, user.id)
