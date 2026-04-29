from typing import Optional

from pydantic import BaseModel


class UserSettingsResponse(BaseModel):
    default_volume_ul: float
    default_dilution_exp: int
    preferred_agar_type: str
    theme: str
    language: str

    model_config = {"from_attributes": True}


class UserSettingsUpdate(BaseModel):
    default_volume_ul: Optional[float] = None
    default_dilution_exp: Optional[int] = None
    preferred_agar_type: Optional[str] = None
    theme: Optional[str] = None
    language: Optional[str] = None


class SystemIntegrityResponse(BaseModel):
    integrity_score: float
    total_records: int
    verified_records: int
    system_health: float
    audit_status: str
