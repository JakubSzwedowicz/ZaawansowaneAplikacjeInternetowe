from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey, Table, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


series_tags = Table(
    "series_tags",
    Base.metadata,
    Column("series_id", Integer, ForeignKey("series.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Series(Base):
    __tablename__ = "series"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    unit = Column(String(20), nullable=False)
    min_value = Column(Float, nullable=False)
    max_value = Column(Float, nullable=False)
    color = Column(String(7), nullable=False)
    icon = Column(String(50))
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    is_public = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    measurements = relationship("Measurement", back_populates="series", cascade="all, delete-orphan")
    sensors = relationship("Sensor", back_populates="series", cascade="all, delete-orphan")
    location = relationship("Location", back_populates="series")
    creator = relationship("User", foreign_keys=[creator_id])
    tags = relationship("Tag", secondary=series_tags, lazy="joined")

    __table_args__ = (
        CheckConstraint("min_value < max_value", name="check_min_max"),
    )
