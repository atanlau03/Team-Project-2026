import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import current_active_user
from app.models.user import User
from app.schemas.audit import AuditEventResponse
from app.services import audit_service

router = APIRouter(prefix="/analyses/{analysis_id}/audit", tags=["Audit Trail"])


@router.get("/", response_model=list[AuditEventResponse])
async def get_audit_trail(
    analysis_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get the full audit trail for an analysis."""
    events = await audit_service.get_audit_trail(db, analysis_id)
    return events
