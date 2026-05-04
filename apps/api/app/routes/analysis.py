import uuid
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import current_active_user
from app.models.user import User
from app.schemas.analysis import (
    AnalysisCreate,
    AnalysisUpdate,
    AnalysisDetail,
    AnalysisFilter,
    AnalysisImageResponse,
    PaginatedAnalyses,
)
from app.services import analysis_service, ai_inference_service

router = APIRouter(prefix="/analyses", tags=["Analyses"])


@router.post("/", response_model=AnalysisDetail, status_code=201)
async def create_analysis(
    data: AnalysisCreate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Create a new draft analysis (Step 1)."""
    try:
        analysis = await analysis_service.create_analysis(db, user.id, data)
        await db.commit()
        return await analysis_service.get_analysis(db, analysis.id)
    except Exception as e:
        await db.rollback()
        raise e


@router.post("/{analysis_id}/upload", response_model=AnalysisImageResponse)
async def upload_image(
    analysis_id: uuid.UUID,
    file: UploadFile = File(...),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Upload plate image for an analysis."""
    try:
        image = await analysis_service.upload_image(db, analysis_id, user.id, file)
        await db.commit()
        return AnalysisImageResponse.model_validate(image)
    except Exception as e:
        await db.rollback()
        raise e


@router.post("/{analysis_id}/run-ai", response_model=AnalysisDetail)
async def run_ai_inference(
    analysis_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Trigger AI colony detection (Step 2)."""
    try:
        print(f"DEBUG: Running AI inference for {analysis_id}")
        await ai_inference_service.run_inference(db, analysis_id)
        print("DEBUG: AI inference complete, committing...")
        await db.commit()
        print("DEBUG: Commit complete, fetching detail...")
        result = await analysis_service.get_analysis(db, analysis_id)
        print("DEBUG: Detail fetch complete")
        return result
    except Exception as e:
        print(f"DEBUG: Error in run_ai_inference: {e}")
        import traceback
        traceback.print_exc()
        await db.rollback()
        raise e


@router.post("/{analysis_id}/submit", response_model=AnalysisDetail)
async def submit_analysis(
    analysis_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Submit an analysis for supervisor review."""
    try:
        await analysis_service.submit_for_approval(db, analysis_id, user.id)
        await db.commit()
        return await analysis_service.get_analysis(db, analysis_id)
    except Exception as e:
        await db.rollback()
        raise e


@router.post("/{analysis_id}/finalize", response_model=AnalysisDetail)
async def finalize_analysis(
    analysis_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Finalize and lock an analysis. Allowed for owner or supervisor."""
    try:
        await analysis_service.finalize_analysis(db, analysis_id, user.id)
        await db.commit()
        return await analysis_service.get_analysis(db, analysis_id)
    except Exception as e:
        await db.rollback()
        raise e


@router.get("/{analysis_id}", response_model=AnalysisDetail)
async def get_analysis(
    analysis_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get full analysis detail."""
    return await analysis_service.get_analysis(db, analysis_id)


@router.patch("/{analysis_id}", response_model=AnalysisDetail)
async def update_analysis(
    analysis_id: uuid.UUID,
    data: AnalysisUpdate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Update analysis metadata."""
    try:
        await analysis_service.update_analysis(db, analysis_id, user.id, data)
        await db.commit()
        return await analysis_service.get_analysis(db, analysis_id)
    except Exception as e:
        await db.rollback()
        raise e



@router.get("/", response_model=PaginatedAnalyses)
async def list_analyses(
    scope: str = Query("mine", pattern="^(mine|team)$"),
    target_user_id: Optional[uuid.UUID] = None,
    status: Optional[list[str]] = Query(None),
    media_type: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """List analyses with scope (mine/team), search, and pagination."""
    filters = AnalysisFilter(
        scope=scope,
        target_user_id=target_user_id,
        status=status,
        media_type=media_type,
        search=search,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    return await analysis_service.list_analyses(
        db, user.id, user.organization_id, filters, role=getattr(user, "role", "researcher")
    )


@router.delete("/{analysis_id}", status_code=204)
async def delete_analysis(
    analysis_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Delete a draft analysis."""
    try:
        await analysis_service.delete_analysis(db, analysis_id, user.id)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise e
