from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    quality_score = Column(Float, nullable=True, default=0.0)
    completeness_score = Column(Float, nullable=True, default=0.0)
    consistency_score = Column(Float, nullable=True, default=0.0)
    diversity_score = Column(Float, nullable=True, default=0.0)
    recency_score = Column(Float, nullable=True, default=0.0)
    final_score = Column(Float, nullable=True, default=0.0)
    result = Column(String(100), nullable=True, default="pending")
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    claim = relationship("Claim", back_populates="analyses")
