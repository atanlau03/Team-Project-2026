import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Analysis(Base):
    """Central domain entity — one per plate scan workflow."""

    __tablename__ = "analysis"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False
    )

    # ── Sample Metadata ──────────────────────────────────
    sample_id: Mapped[str] = mapped_column(String(100), nullable=False)
    media_type: Mapped[str] = mapped_column(String(100), nullable=False)
    volume_plated_ml: Mapped[float] = mapped_column(Float, nullable=False)
    dilution_factor: Mapped[int] = mapped_column(Integer, nullable=False)
    protocol: Mapped[str | None] = mapped_column(String(255), nullable=True)
    incubation_info: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── AI Results ───────────────────────────────────────
    ai_colony_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Final Results ────────────────────────────────────
    final_colony_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    calculated_cfu_ml: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Status ───────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft"
    )  # draft | ai_complete | verified | finalized

    # ── Timestamps ───────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ────────────────────────────────────
    user: Mapped["User"] = relationship(back_populates="analyses")
    image: Mapped["AnalysisImage | None"] = relationship(
        back_populates="analysis", uselist=False, cascade="all, delete-orphan"
    )
    colonies: Mapped[list["Colony"]] = relationship(
        back_populates="analysis", cascade="all, delete-orphan"
    )
    audit_events: Mapped[list["AuditEvent"]] = relationship(
        back_populates="analysis", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(
        back_populates="analysis", cascade="all, delete-orphan"
    )
