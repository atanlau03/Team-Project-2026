import csv
import io
import uuid
from typing import List
from datetime import datetime
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.models.analysis import Analysis

async def export_csv(db: AsyncSession, analysis_ids: List[uuid.UUID]):
    """Export analysis data to CSV."""
    stmt = select(Analysis).options(joinedload(Analysis.user)).where(Analysis.id.in_(analysis_ids))
    result = await db.execute(stmt)
    analyses = result.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Date", "Sample ID", "Protocol", "Volume (ml)", "Dilution", "Colony Count", "CFU/ml", "Operator", "Status"])
    
    for a in analyses:
        writer.writerow([
            a.created_at.strftime("%Y-%m-%d %H:%M:%S") if a.created_at else "—",
            a.sample_id,
            a.protocol or "Standard",
            a.volume_plated_ml,
            a.dilution_factor,
            a.final_colony_count or a.ai_colony_count or 0,
            f"{a.calculated_cfu_ml:.2e}" if a.calculated_cfu_ml else "—",
            a.user.full_name if a.user else "—",
            a.status
        ])
    
    output.seek(0)
    filename = f"PlateSense_Export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


async def export_audit_log(db: AsyncSession):
    """Export the entire system audit trail to CSV."""
    from app.models.audit_event import AuditEvent
    from app.models.user import User
    
    stmt = (
        select(AuditEvent, User.full_name, Analysis.sample_id)
        .outerjoin(User, AuditEvent.user_id == User.id)
        .outerjoin(Analysis, AuditEvent.analysis_id == Analysis.id)
        .order_by(AuditEvent.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Timestamp", "Sample ID", "Event Type", "Description", "Operator", "Metadata"])
    
    for event, user_name, sample_id in rows:
        writer.writerow([
            event.created_at.strftime("%Y-%m-%d %H:%M:%S") if event.created_at else "—",
            sample_id or "System",
            event.event_type,
            event.description,
            user_name or "System",
            str(event.metadata_json) if event.metadata_json else ""
        ])
        
    output.seek(0)
    filename = f"PlateSense_AuditLog_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
