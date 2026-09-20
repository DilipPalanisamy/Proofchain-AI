from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Float,
    ForeignKey,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Evidence(Base):
    __tablename__ = "evidence"

    # Existing SQLite database uses INTEGER
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Public Evidence ID
    evidence_id = Column(
        String(100),
        unique=True,
        index=True,
        nullable=True,
    )

    # Existing claims table uses INTEGER IDs
    claim_id = Column(
        Integer,
        ForeignKey("claims.id"),
        nullable=False,
        index=True,
    )

    type = Column(
        String(20),
        nullable=False,
    )

    file_name = Column(
        String(255),
        nullable=True,
    )

    file_path = Column(
        String(500),
        nullable=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    source = Column(
        String(255),
        nullable=True,
    )

    location = Column(
        String(255),
        nullable=True,
    )

    timestamp = Column(
        DateTime,
        nullable=True,
    )

    quality_score = Column(
        Float,
        nullable=True,
    )

    similarity_score = Column(
        Float,
        nullable=True,
    )

    reliability_score = Column(
        Float,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    claim = relationship(
        "Claim",
        back_populates="evidence",
    )