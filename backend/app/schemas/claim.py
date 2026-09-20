from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, computed_field


class ClaimBase(BaseModel):
    title: str = Field(..., example="Quantum computer factored RSA-2048")
    description: str = Field(..., example="A research team claims to have factored RSA-2048 in polynomial time.")
    status: Optional[str] = Field("pending", example="pending")
    confidence_score: Optional[float] = Field(None, example=None)
    idempotency_key: Optional[str] = Field(None, example="9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")


class ClaimCreate(BaseModel):
    title: str = Field(..., example="Quantum computer factored RSA-2048")
    description: str = Field(..., example="A research team claims to have factored RSA-2048 in polynomial time.")
    status: Optional[str] = Field("pending", example="pending")
    confidence_score: Optional[float] = Field(None, example=None)
    idempotency_key: Optional[str] = Field(None, example="9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")


class ClaimUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    confidence_score: Optional[float] = None
    idempotency_key: Optional[str] = None


class ClaimResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    confidence_score: Optional[float] = None
    idempotency_key: Optional[str] = None
    created_at: datetime

    @computed_field
    @property
    def claim_id(self) -> str:
        year = self.created_at.year if self.created_at else 2026
        return f"CLM-{year}-{self.id:04d}"

    class Config:
        from_attributes = True


# Forward reference for detail response with evidence items
from app.schemas.evidence import EvidenceResponse  # noqa: E402


class ClaimDetailResponse(ClaimResponse):
    evidence: List[EvidenceResponse] = []

    class Config:
        from_attributes = True
