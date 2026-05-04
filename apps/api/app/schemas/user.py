import uuid
from typing import Optional

from fastapi_users import schemas
from pydantic import BaseModel, ConfigDict


# ── FastAPI Users Schemas ────────────────────────────────
class UserRead(schemas.BaseUser[uuid.UUID]):
    full_name: str
    title: Optional[str] = None
    avatar_url: Optional[str] = None
    organization_id: Optional[uuid.UUID] = None
    organization_name: Optional[str] = None
    supervisor_id: Optional[uuid.UUID] = None
    supervisor_name: Optional[str] = None
    role: str = "researcher"
    
    model_config = ConfigDict(from_attributes=True)


class UserCreate(schemas.BaseUserCreate):
    full_name: str
    organization_name: Optional[str] = None  # resolved to org ID on creation


class UserUpdate(schemas.BaseUserUpdate):
    full_name: Optional[str] = None
    title: Optional[str] = None
    avatar_url: Optional[str] = None
    organization_id: Optional[uuid.UUID] = None


# ── Profile-specific schemas ─────────────────────────────
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    title: Optional[str] = None
    organization_name: Optional[str] = None
