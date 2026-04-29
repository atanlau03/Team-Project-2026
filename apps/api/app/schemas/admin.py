import uuid
from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class UserListItem(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    organization_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedUsers(BaseModel):
    items: list[UserListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class RoleUpdateRequest(BaseModel):
    role: str  # "researcher" or "admin"


class StatusUpdateRequest(BaseModel):
    is_active: bool


class AdminSystemStats(BaseModel):
    total_users: int
    total_researchers: int
    total_admins: int
    total_analyses: int
    total_finalized: int
    total_organizations: int
