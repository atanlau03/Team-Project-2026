from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SpeciesCount(BaseModel):
    name: str
    count: int
    percentage: float


class DashboardOverview(BaseModel):
    total_colonies_today: int
    colonies_change_pct: float
    ai_accuracy_avg: float
    total_analyses_today: int
    peak_volume_time: Optional[str] = None
    system_status: str = "optimal"
    time_saved_hours: float = 0.0
    unverified_count: int = 0
    top_species: list[SpeciesCount] = []


class ActivityItem(BaseModel):
    event_type: str
    description: str
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    sample_id: Optional[str] = None
    created_at: datetime
    tags: list[str] = []


class TrendPoint(BaseModel):
    date: str
    value: float


class DayCount(BaseModel):
    date: str
    count: int
