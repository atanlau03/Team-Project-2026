import uuid
from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel


class AuditEventResponse(BaseModel):
    id: uuid.UUID
    analysis_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    event_type: str
    description: str
    metadata_json: Optional[dict[str, Any]] = None
    created_at: datetime
    user_name: Optional[str] = None  # Resolved from user relation

    model_config = {"from_attributes": True}
