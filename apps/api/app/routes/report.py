import uuid
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import current_active_user
from app.models.user import User
from app.schemas.report import (
    ReportResponse,
    ReportFilter,
    PaginatedReports,
    BatchExportRequest,
)
from app.services import report_service, export_service
from app.utils.pdf_generator import generate_analysis_pdf

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/", response_model=PaginatedReports)
async def list_reports(
    search: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """List reports with search/filter/pagination."""
    filters = ReportFilter(
        search=search,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    return await report_service.list_reports(db, user.id, user.organization_id, filters)


@router.post("/generate/{analysis_id}", response_model=ReportResponse, status_code=201)
async def generate_pdf(
    analysis_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Generate PDF report for a single analysis."""
    return await report_service.generate_pdf(db, analysis_id, user.id)


@router.get("/download/{report_id}")
async def download_report(
    report_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Download a generated PDF report."""
    return await report_service.download_report(db, report_id)


@router.post("/export-batch", response_model=list[ReportResponse])
async def export_batch(
    data: BatchExportRequest,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Generate PDF reports for multiple analyses."""
    return await report_service.export_batch(db, user.id, data)


@router.post("/export-csv")
async def export_csv(
    data: BatchExportRequest,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Export analyses to CSV."""
    return await export_service.export_csv(db, data.analysis_ids)


@router.get("/export-audit")
async def export_audit(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Export the entire system audit trail to CSV."""
    return await export_service.export_audit_log(db)
