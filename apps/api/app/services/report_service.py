import uuid
import math
from typing import Optional

from fastapi import HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report
from app.models.analysis import Analysis
from app.schemas.report import (
    ReportResponse,
    ReportFilter,
    PaginatedReports,
    BatchExportRequest,
)
from app.services import audit_service
from app.utils.pdf_generator import generate_analysis_pdf


from sqlalchemy.orm import joinedload
from app.models.report import Report
from app.models.analysis import Analysis

async def generate_pdf(
    db: AsyncSession,
    analysis_id: uuid.UUID,
    user_id: uuid.UUID,
) -> ReportResponse:
    """Generate a PDF report for a single analysis."""
    stmt = (
        select(Analysis)
        .options(joinedload(Analysis.image), joinedload(Analysis.colonies))
        .where(Analysis.id == analysis_id)
    )
    result = await db.execute(stmt)
    analysis = result.unique().scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    file_path = await generate_analysis_pdf(analysis)

    report = Report(
        analysis_id=analysis_id,
        generated_by=user_id,
        file_path=file_path,
        report_type="standard",
    )
    db.add(report)

    await audit_service.log_event(
        db,
        analysis_id=analysis_id,
        user_id=user_id,
        event_type="report_generated",
        description="PDF report generated.",
    )
    await db.commit()
    await db.refresh(report)
    return ReportResponse.model_validate(report)


async def download_report(
    db: AsyncSession, report_id: uuid.UUID
) -> FileResponse:
    """Return the PDF file for download."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return FileResponse(
        path=report.file_path,
        media_type="application/pdf",
        filename=f"PlateSense_Report_{report.analysis_id}.pdf",
    )


async def list_reports(
    db: AsyncSession,
    user_id: uuid.UUID,
    organization_id: Optional[uuid.UUID],
    filters: ReportFilter,
) -> PaginatedReports:
    """List reports with search, date range, and pagination."""
    base = select(Report).join(Analysis, Report.analysis_id == Analysis.id)

    if filters.search:
        base = base.where(Analysis.sample_id.ilike(f"%{filters.search}%"))
    if filters.date_from:
        base = base.where(Report.created_at >= filters.date_from)
    if filters.date_to:
        base = base.where(Report.created_at <= filters.date_to)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    offset = (filters.page - 1) * filters.page_size
    items_stmt = base.order_by(Report.created_at.desc()).offset(offset).limit(filters.page_size)
    result = await db.execute(items_stmt)
    reports = result.scalars().all()

    return PaginatedReports(
        items=[ReportResponse.model_validate(r) for r in reports],
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        total_pages=math.ceil(total / filters.page_size) if filters.page_size else 0,
    )


async def export_batch(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: BatchExportRequest,
) -> list[ReportResponse]:
    """Generate PDF reports for multiple analyses."""
    reports = []
    for aid in data.analysis_ids:
        try:
            report = await generate_pdf(db, aid, user_id)
            reports.append(report)
        except HTTPException:
            continue  # Skip missing analyses
    return reports
