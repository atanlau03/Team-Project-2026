import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SimulatorSample(Base):
    """Pre-loaded sample plates for the simulator library."""

    __tablename__ = "simulator_sample"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    image_path: Mapped[str] = mapped_column(Text, nullable=False)
    ground_truth_count: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    sessions: Mapped[list["SimulatorSession"]] = relationship(
        back_populates="sample_image"
    )


class SimulatorSession(Base):
    """Battle mode session — human vs AI comparison."""

    __tablename__ = "simulator_session"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False
    )
    sample_image_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("simulator_sample.id"), nullable=False
    )
    manual_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    manual_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    sample_image: Mapped["SimulatorSample"] = relationship(back_populates="sessions")
