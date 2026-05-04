import uuid
import math
from typing import Optional

from fastapi import UploadFile, HTTPException
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.config import settings
from app.models.analysis import Analysis
from app.models.analysis_image import AnalysisImage
from app.models.colony import Colony
from app.models.user import User
from app.schemas.analysis import (
    AnalysisCreate,
    AnalysisUpdate,
    AnalysisFilter,
    AnalysisSummary,
    AnalysisDetail,
    AnalysisImageResponse,
    PaginatedAnalyses,
)
from app.schemas.colony import ColonyResponse
from app.services import audit_service
from app.utils.file_storage import save_upload_file


async def create_analysis(
    db: AsyncSession, user_id: uuid.UUID, data: AnalysisCreate
) -> Analysis:
    """Create a new draft analysis."""
    analysis = Analysis(
        user_id=user_id,
        sample_id=data.sample_id,
        media_type=data.media_type,
        volume_plated_ml=data.volume_plated_ml,
        dilution_factor=data.dilution_factor,
        protocol=data.protocol,
        incubation_info=data.incubation_info,
        notes=data.notes,
        status="draft",
    )
    db.add(analysis)
    await db.flush()

    await audit_service.log_event(
        db,
        analysis_id=analysis.id,
        user_id=user_id,
        event_type="draft_saved",
        description=f"Analysis created for sample {data.sample_id}.",
    )
    await db.flush()
    await db.refresh(analysis)
    return analysis


async def upload_image(
    db: AsyncSession,
    analysis_id: uuid.UUID,
    user_id: uuid.UUID,
    file: UploadFile,
) -> AnalysisImage:
    """Upload a plate image for an analysis."""
    analysis = await _get_analysis_or_404(db, analysis_id)
    _check_ownership(analysis, user_id)

    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image type. Use JPG or PNG.")

    stored_path, file_size = await save_upload_file(
        file, sub_dir=f"plates/{analysis_id}"
    )

    # Check for existing image manually to avoid lazy loading issues
    from app.models.analysis_image import AnalysisImage
    img_stmt = select(AnalysisImage).where(AnalysisImage.analysis_id == analysis_id)
    img_result = await db.execute(img_stmt)
    existing_image = img_result.scalar_one_or_none()

    if existing_image:
        delete_file(existing_image.stored_path)
        await db.delete(existing_image)

    image = AnalysisImage(
        analysis_id=analysis_id,
        original_filename=file.filename or "plate.jpg",
        stored_path=stored_path,
        file_size_bytes=file_size,
        mime_type=file.content_type or "image/jpeg",
    )
    db.add(image)

    await audit_service.log_event(
        db,
        analysis_id=analysis_id,
        user_id=user_id,
        event_type="status_changed",
        description=f"Plate image uploaded: {file.filename}",
    )
    await db.flush()
    await db.refresh(image)
    return image


async def get_analysis(
    db: AsyncSession, analysis_id: uuid.UUID
) -> AnalysisDetail:
    """Get full analysis detail with image info."""
    stmt = (
        select(Analysis)
        .where(Analysis.id == analysis_id)
    )
    result = await db.execute(stmt)
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    # 1. Fetch User manually
    from app.models.user import User
    user_result = await db.execute(select(User).where(User.id == analysis.user_id))
    user = user_result.unique().scalar_one_or_none()

    # 2. Fetch Image manually
    from app.models.analysis_image import AnalysisImage
    img_stmt = select(AnalysisImage).where(AnalysisImage.analysis_id == analysis_id)
    img_result = await db.execute(img_stmt)
    analysis_image = img_result.unique().scalar_one_or_none()

    # 3. Fetch Colonies manually
    col_stmt = select(Colony).where(
        Colony.analysis_id == analysis_id,
        Colony.is_removed == False
    )
    col_result = await db.execute(col_stmt)
    active_colonies = col_result.scalars().all()

    return AnalysisDetail(
        id=analysis.id,
        user_id=analysis.user_id,
        sample_id=analysis.sample_id,
        media_type=analysis.media_type,
        volume_plated_ml=analysis.volume_plated_ml,
        dilution_factor=analysis.dilution_factor,
        protocol=analysis.protocol,
        incubation_info=analysis.incubation_info,
        notes=analysis.notes,
        ai_colony_count=analysis.ai_colony_count,
        ai_confidence=analysis.ai_confidence,
        final_colony_count=analysis.final_colony_count,
        calculated_cfu_ml=analysis.calculated_cfu_ml,
        status=analysis.status,
        created_at=analysis.created_at,
        updated_at=analysis.updated_at,
        image=AnalysisImageResponse.model_validate(analysis_image) if analysis_image else None,
        colonies=[ColonyResponse.model_validate(c) for c in active_colonies],
        operator_name=user.full_name if user else None,
    )


async def update_analysis(
    db: AsyncSession,
    analysis_id: uuid.UUID,
    user_id: uuid.UUID,
    data: AnalysisUpdate,
) -> Analysis:
    """Update analysis metadata fields."""
    analysis = await _get_analysis_or_404(db, analysis_id)
    _check_ownership(analysis, user_id)

    changes = {}
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_val = getattr(analysis, field)
        if old_val != value:
            changes[field] = {"old": str(old_val), "new": str(value)}
            setattr(analysis, field, value)

    if changes:
        await audit_service.log_event(
            db,
            analysis_id=analysis_id,
            user_id=user_id,
            event_type="parameter_changed",
            description=f"Updated {', '.join(changes.keys())}.",
            metadata=changes,
        )
        await db.flush()
    await db.refresh(analysis)
    return analysis


async def submit_for_approval(
    db: AsyncSession, analysis_id: uuid.UUID, user_id: uuid.UUID
) -> Analysis:
    """Submit an analysis for supervisor review."""
    analysis = await _get_analysis_or_404(db, analysis_id)
    _check_ownership(analysis, user_id)

    if analysis.status == "finalized":
        raise HTTPException(status_code=400, detail="Analysis already finalized.")
    
    analysis.status = "awaiting_approval"

    await audit_service.log_event(
        db,
        analysis_id=analysis_id,
        user_id=user_id,
        event_type="status_changed",
        description="Analysis submitted for supervisor approval.",
    )
    await db.flush()
    await db.refresh(analysis)
    return analysis


async def finalize_analysis(
    db: AsyncSession, analysis_id: uuid.UUID, requesting_user_id: uuid.UUID
) -> Analysis:
    """Lock an analysis and set status to 'finalized'. Allowed for owner or supervisor."""
    analysis = await _get_analysis_or_404(db, analysis_id)
    
    # Check if owner OR supervisor
    is_owner = analysis.user_id == requesting_user_id
    is_supervisor = False
    
    if not is_owner:
        owner_result = await db.execute(select(User).where(User.id == analysis.user_id))
        owner = owner_result.scalar_one_or_none()
        if owner and owner.supervisor_id == requesting_user_id:
            is_supervisor = True
            
    if not is_owner and not is_supervisor:
        raise HTTPException(status_code=403, detail="Not authorized to finalize this analysis.")

    if analysis.status == "finalized":
        raise HTTPException(status_code=400, detail="Analysis already finalized.")

    # Set final count from AI count if not already set
    if analysis.final_colony_count is None and analysis.ai_colony_count is not None:
        analysis.final_colony_count = analysis.ai_colony_count

    # Recalculate CFU/ml
    if analysis.final_colony_count is not None:
        actual_dilution = analysis.dilution_factor
        if actual_dilution < 0:
            actual_dilution = 10 ** abs(actual_dilution)
        elif actual_dilution == 0:
            actual_dilution = 1
            
        analysis.calculated_cfu_ml = (analysis.final_colony_count * actual_dilution) / analysis.volume_plated_ml

    analysis.status = "finalized"

    await audit_service.log_event(
        db,
        analysis_id=analysis_id,
        user_id=requesting_user_id,
        event_type="status_changed",
        description="Analysis finalized and locked.",
    )
    await db.flush()
    await db.refresh(analysis)
    return analysis


async def list_analyses(
    db: AsyncSession,
    user_id: uuid.UUID,
    organization_id: Optional[uuid.UUID],
    filters: AnalysisFilter,
    role: str = "researcher",
) -> PaginatedAnalyses:
    """List analyses with scope (mine/team), search, and pagination."""
    base_query = select(Analysis).join(User, Analysis.user_id == User.id)

    # ── Scope filter ─────────────────────────────────────
    if filters.scope == "team":
        if role == "admin":
            if filters.target_user_id:
                base_query = base_query.where(Analysis.user_id == filters.target_user_id)
            else:
                pass  # Admin sees all analyses system-wide
        elif role == "lab_manager":
            # Lab manager sees their team's analyses (supervisor_id == current user)
            from sqlalchemy import or_ as or_clause
            team_ids = select(User.id).where(
                or_clause(User.supervisor_id == user_id, User.id == user_id)
            )
            if filters.target_user_id:
                # Security: Ensure target_user_id is actually part of the team
                base_query = base_query.where(
                    Analysis.user_id == filters.target_user_id,
                    Analysis.user_id.in_(team_ids)
                )
            else:
                base_query = base_query.where(Analysis.user_id.in_(team_ids))
        elif organization_id:
            base_query = base_query.where(User.organization_id == organization_id)
            if filters.target_user_id:
                base_query = base_query.where(Analysis.user_id == filters.target_user_id)
        else:
            base_query = base_query.where(Analysis.user_id == user_id)
    else:
        base_query = base_query.where(Analysis.user_id == user_id)

    # ── Additional filters ───────────────────────────────
    if filters.status:
        if isinstance(filters.status, list):
            base_query = base_query.where(Analysis.status.in_(filters.status))
        else:
            base_query = base_query.where(Analysis.status == filters.status)
    if filters.media_type:
        base_query = base_query.where(Analysis.media_type == filters.media_type)
    if filters.search:
        base_query = base_query.where(
            or_(
                Analysis.sample_id.ilike(f"%{filters.search}%"),
                Analysis.media_type.ilike(f"%{filters.search}%"),
            )
        )
    if filters.date_from:
        base_query = base_query.where(Analysis.created_at >= filters.date_from)
    if filters.date_to:
        base_query = base_query.where(Analysis.created_at <= filters.date_to)

    # ── Count ────────────────────────────────────────────
    count_stmt = select(func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    # ── Paginate ─────────────────────────────────────────
    offset = (filters.page - 1) * filters.page_size
    items_stmt = (
        base_query.options(selectinload(Analysis.user), selectinload(Analysis.image))
        .order_by(Analysis.created_at.desc())
        .offset(offset)
        .limit(filters.page_size)
    )
    result = await db.execute(items_stmt)
    analyses = result.scalars().all()

    items = [
        AnalysisSummary(
            id=a.id,
            sample_id=a.sample_id,
            media_type=a.media_type,
            ai_colony_count=a.ai_colony_count,
            final_colony_count=a.final_colony_count,
            calculated_cfu_ml=a.calculated_cfu_ml,
            ai_confidence=a.ai_confidence,
            status=a.status,
            created_at=a.created_at,
            updated_at=a.updated_at,
            operator_name=a.user.full_name if a.user else None,
            image=AnalysisImageResponse.model_validate(a.image) if a.image else None,
        )
        for a in analyses
    ]

    return PaginatedAnalyses(
        items=items,
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        total_pages=math.ceil(total / filters.page_size) if filters.page_size else 0,
    )


async def delete_analysis(
    db: AsyncSession, analysis_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    """Delete a draft analysis."""
    analysis = await _get_analysis_or_404(db, analysis_id)
    _check_ownership(analysis, user_id)
    if analysis.status == "finalized":
        raise HTTPException(status_code=400, detail="Finalized official records cannot be deleted to maintain laboratory integrity.")
    await db.delete(analysis)
    await db.flush()


# ── Private Helpers ──────────────────────────────────────
async def _get_analysis_or_404(db: AsyncSession, analysis_id: uuid.UUID) -> Analysis:
    result = await db.execute(
        select(Analysis)
        .where(Analysis.id == analysis_id)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis


def _check_ownership(analysis: Analysis, user_id: uuid.UUID) -> None:
    if analysis.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized for this analysis.")
