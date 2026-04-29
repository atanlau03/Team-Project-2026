import uuid
import random
import shutil
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.simulator import SimulatorSample, SimulatorSession
from app.schemas.simulator import (
    SimulatorSampleResponse,
    SimulatorSessionCreate,
    SimulatorSessionSubmit,
    SimulatorSessionResponse,
)


from app.utils.file_storage import save_upload_file, get_file_url


async def list_samples(db: AsyncSession) -> list[SimulatorSampleResponse]:
    """Get all samples in the simulator library."""
    result = await db.execute(
        select(SimulatorSample).order_by(SimulatorSample.created_at.desc())
    )
    samples = result.scalars().all()
    return [SimulatorSampleResponse.model_validate(s) for s in samples]


async def upload_sample(
    db: AsyncSession, file: UploadFile, label: str
) -> SimulatorSampleResponse:
    """Save a user-uploaded image as a simulator sample."""
    stored_path, file_size = await save_upload_file(file, sub_dir="plates")
    
    # Use standardized URL path for DB
    db_path = get_file_url(stored_path)
    
    # Mock some ground truth (Real AI could be called here)
    ground_truth = random.randint(20, 150)
    
    sample = SimulatorSample(
        image_path=db_path,
        ground_truth_count=ground_truth,
        label=label
    )
    db.add(sample)
    await db.commit()
    await db.refresh(sample)
    
    return SimulatorSampleResponse.model_validate(sample)


async def create_session(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: SimulatorSessionCreate,
) -> SimulatorSessionResponse:
    """Start a battle mode session."""
    # Verify sample exists
    sample = await db.execute(
        select(SimulatorSample).where(SimulatorSample.id == data.sample_image_id)
    )
    if not sample.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Sample not found.")

    session = SimulatorSession(
        user_id=user_id,
        sample_image_id=data.sample_image_id,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return SimulatorSessionResponse.model_validate(session)


async def submit_result(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
    data: SimulatorSessionSubmit,
) -> SimulatorSessionResponse:
    """Submit manual counting result."""
    result = await db.execute(
        select(SimulatorSession).where(
            SimulatorSession.id == session_id,
            SimulatorSession.user_id == user_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    session.manual_count = data.manual_count
    session.manual_time_ms = data.manual_time_ms
    await db.commit()
    await db.refresh(session)
    return SimulatorSessionResponse.model_validate(session)


async def reveal_ai_result(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
) -> SimulatorSessionResponse:
    """Run AI on the sample and reveal the comparison."""
    from sqlalchemy.orm import joinedload
    result = await db.execute(
        select(SimulatorSession)
        .options(joinedload(SimulatorSession.sample_image))
        .where(
            SimulatorSession.id == session_id,
            SimulatorSession.user_id == user_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    if session.manual_count is None:
        raise HTTPException(
            status_code=400, detail="Complete manual counting first."
        )

    # Get the real AI result from the detection backend
    from app.services.ai_inference_service import get_inference_backend
    import os
    
    # Get absolute path for the image
    image_path = os.path.join(settings.UPLOAD_DIR, session.sample_image.image_path.replace("uploads/", "").lstrip("/\\"))
    if not os.path.exists(image_path):
        # Fallback to just the path stored if absolute
        image_path = session.sample_image.image_path

    backend = get_inference_backend()
    ai_result = await backend.detect(image_path)

    print(f"DEBUG: Simulator AI Inference Result: {ai_result.colony_count} colonies found for {image_path}")

    session.ai_count = ai_result.colony_count
    session.ai_time_ms = ai_result.processing_time_ms
    await db.commit()
    await db.refresh(session)
    return SimulatorSessionResponse.model_validate(session)


async def list_sessions(
    db: AsyncSession, user_id: uuid.UUID
) -> list[SimulatorSessionResponse]:
    """Get all sessions for the current user."""
    result = await db.execute(
        select(SimulatorSession)
        .where(SimulatorSession.user_id == user_id)
        .order_by(SimulatorSession.created_at.desc())
    )
    sessions = result.scalars().all()
    return [SimulatorSessionResponse.model_validate(s) for s in sessions]
