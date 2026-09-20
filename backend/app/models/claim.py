from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.orm import relationship

from app.database import Base


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="pending")
    confidence_score = Column(Float, nullable=True, default=None)
    idempotency_key = Column(String(128), unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    evidence = relationship("Evidence", back_populates="claim", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="claim", cascade="all, delete-orphan")

    @property
    def formatted_id(self) -> str:
        year = self.created_at.year if self.created_at else 2026
        return f"CLM-{year}-{self.id:04d}"

    # Compatibility alias for description
    @property
    def content(self) -> str:
        return self.description

    @content.setter
    def content(self, value: str):
        self.description = value
