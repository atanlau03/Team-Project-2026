import uuid
from typing import Optional
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator
import re


class UserListItem(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    organization_name: Optional[str] = None
    avatar_url: Optional[str] = None
    supervisor_id: Optional[uuid.UUID] = None
    supervisor_name: Optional[str] = None
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
    role: str  # "researcher" | "lab_manager"


class StatusUpdateRequest(BaseModel):
    is_active: bool


class SupervisorUpdateRequest(BaseModel):
    supervisor_id: Optional[uuid.UUID] = None  # None to unassign


class AdminUserCreateRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "researcher"  # researcher | lab_manager
    organization_name: Optional[str] = None
    supervisor_id: Optional[uuid.UUID] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("researcher", "lab_manager"):
            raise ValueError("Role must be 'researcher' or 'lab_manager'.")
        return v


class AdminSystemStats(BaseModel):
    total_users: int
    total_researchers: int
    total_lab_managers: int
    total_admins: int
    total_analyses: int
    total_finalized: int
    total_organizations: int
