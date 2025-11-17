from sqlalchemy import Column, Integer, String, Float, Text, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


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
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    measurements = relationship("Measurement", back_populates="series", cascade="all, delete-orphan")
    sensors = relationship("Sensor", back_populates="series", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint('min_value < max_value', name='check_min_max'),
    )
