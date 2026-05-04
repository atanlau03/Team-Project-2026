import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from app.schemas.colony import ColonyResponse


# ── Request Schemas ──────────────────────────────────────
class AnalysisCreate(BaseModel):
    sample_id: str
    media_type: str
    volume_plated_ml: float
    dilution_factor: int
    protocol: Optional[str] = None
    incubation_info: Optional[str] = None
    notes: Optional[str] = None


class AnalysisUpdate(BaseModel):
    sample_id: Optional[str] = None
    media_type: Optional[str] = None
    volume_plated_ml: Optional[float] = None
    dilution_factor: Optional[int] = None
    protocol: Optional[str] = None
    incubation_info: Optional[str] = None
    notes: Optional[str] = None


class AnalysisFilter(BaseModel):
    scope: str = "mine"  # mine | team
    target_user_id: Optional[uuid.UUID] = None
    status: Optional[str | list[str]] = None
    media_type: Optional[str] = None
    search: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 20


# ── Response Schemas ─────────────────────────────────────
class AnalysisImageResponse(BaseModel):
    id: uuid.UUID
    original_filename: str
    stored_path: str
    file_size_bytes: int
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class AnalysisSummary(BaseModel):
    id: uuid.UUID
    sample_id: str
    media_type: str
    ai_colony_count: Optional[int] = None
    final_colony_count: Optional[int] = None
    calculated_cfu_ml: Optional[float] = None
    ai_confidence: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime
    operator_name: Optional[str] = None
    image: Optional[AnalysisImageResponse] = None

    model_config = {"from_attributes": True}


class AnalysisDetail(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    sample_id: str
    media_type: str
    volume_plated_ml: float
    dilution_factor: int
    protocol: Optional[str] = None
    incubation_info: Optional[str] = None
    notes: Optional[str] = None
    ai_colony_count: Optional[int] = None
    ai_confidence: Optional[float] = None
    final_colony_count: Optional[int] = None
    calculated_cfu_ml: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime
    image: Optional[AnalysisImageResponse] = None
    colonies: list["ColonyResponse"] = []
    operator_name: Optional[str] = None

    model_config = {"from_attributes": True}


class PaginatedAnalyses(BaseModel):
    items: list[AnalysisSummary]
    total: int
    page: int
    page_size: int
    total_pages: int
