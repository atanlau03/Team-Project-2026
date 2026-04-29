import uuid
from typing import Optional, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_event import AuditEvent
from app.models.user import User


async def log_event(
    db: AsyncSession,
    analysis_id: uuid.UUID,
    event_type: str,
    description: str,
    user_id: Optional[uuid.UUID] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> AuditEvent:
    """Append an immutable audit event. Called internally by other services."""
    event = AuditEvent(
        analysis_id=analysis_id,
        user_id=user_id,
        event_type=event_type,
        description=description,
        metadata_json=metadata,
    )
    db.add(event)
    await db.flush()
    return event


async def get_audit_trail(
    db: AsyncSession,
    analysis_id: uuid.UUID,
) -> list[dict]:
    """Return the full audit trail for an analysis, newest first."""
    stmt = (
        select(AuditEvent, User.full_name)
        .outerjoin(User, AuditEvent.user_id == User.id)
        .where(AuditEvent.analysis_id == analysis_id)
        .order_by(AuditEvent.created_at.asc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "id": event.id,
            "analysis_id": event.analysis_id,
            "user_id": event.user_id,
            "event_type": event.event_type,
            "description": event.description,
            "metadata_json": event.metadata_json,
            "created_at": event.created_at,
            "user_name": user_name or "System",
        }
        for event, user_name in rows
    ]
