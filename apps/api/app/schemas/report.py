import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReportResponse(BaseModel):
    id: uuid.UUID
    analysis_id: uuid.UUID
    generated_by: uuid.UUID
    file_path: str
    report_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportFilter(BaseModel):
    search: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 20


class PaginatedReports(BaseModel):
    items: list[ReportResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class BatchExportRequest(BaseModel):
    analysis_ids: list[uuid.UUID]
