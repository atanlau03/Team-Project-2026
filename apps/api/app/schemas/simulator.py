import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SimulatorSampleResponse(BaseModel):
    id: uuid.UUID
    image_path: str
    ground_truth_count: int
    label: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SimulatorSessionCreate(BaseModel):
    sample_image_id: uuid.UUID


class SimulatorSessionSubmit(BaseModel):
    manual_count: int
    manual_time_ms: int


class SimulatorSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    sample_image_id: uuid.UUID
    manual_count: Optional[int] = None
    manual_time_ms: Optional[int] = None
    ai_count: Optional[int] = None
    ai_time_ms: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
