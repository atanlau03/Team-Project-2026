import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ColonyCreate(BaseModel):
    position_x: float
    position_y: float
    label: Optional[str] = None
    bbox_width: Optional[float] = None
    bbox_height: Optional[float] = None
    area_px: Optional[float] = None
    species_name: Optional[str] = None
    morphology: Optional[str] = None

class ColonyUpdate(BaseModel):
    label: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    bbox_width: Optional[float] = None
    bbox_height: Optional[float] = None
    area_px: Optional[float] = None
    species_name: Optional[str] = None
    morphology: Optional[str] = None


class ColonyResponse(BaseModel):
    id: uuid.UUID
    analysis_id: uuid.UUID
    label: Optional[str] = None
    position_x: float
    position_y: float
    bbox_width: Optional[float] = None
    bbox_height: Optional[float] = None
    area_px: Optional[float] = None
    confidence: Optional[float] = None
    species_name: Optional[str] = None
    morphology: Optional[str] = None
    source: str
    is_removed: bool
    added_by: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}
