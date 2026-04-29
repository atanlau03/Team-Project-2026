import uuid

from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import current_active_user
from app.models.user import User
from app.schemas.simulator import (
    SimulatorSampleResponse,
    SimulatorSessionCreate,
    SimulatorSessionSubmit,
    SimulatorSessionResponse,
)
from app.services import simulator_service
router = APIRouter(prefix="/simulator", tags=["Simulator"])


@router.get("/samples", response_model=list[SimulatorSampleResponse])
async def list_samples(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get sample plate library."""
    return await simulator_service.list_samples(db)


@router.post("/samples", response_model=SimulatorSampleResponse, status_code=201)
async def upload_sample(
    file: UploadFile = File(...),
    label: str = Form(...),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Upload a new sample plate to the simulator library."""
    return await simulator_service.upload_sample(db, file, label)


@router.post("/sessions", response_model=SimulatorSessionResponse, status_code=201)
async def create_session(
    data: SimulatorSessionCreate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Start a battle mode session."""
    return await simulator_service.create_session(db, user.id, data)


@router.patch("/sessions/{session_id}", response_model=SimulatorSessionResponse)
async def submit_result(
    session_id: uuid.UUID,
    data: SimulatorSessionSubmit,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Submit manual counting result."""
    return await simulator_service.submit_result(db, session_id, user.id, data)


@router.get("/sessions/{session_id}/reveal", response_model=SimulatorSessionResponse)
async def reveal_ai_result(
    session_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Unlock AI result for comparison."""
    return await simulator_service.reveal_ai_result(db, session_id, user.id)


@router.get("/sessions", response_model=list[SimulatorSessionResponse])
async def list_sessions(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get user's session history."""
    return await simulator_service.list_sessions(db, user.id)
