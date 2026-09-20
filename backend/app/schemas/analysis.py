from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AnalysisBase(BaseModel):
    quality_score: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    completeness_score: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    consistency_score: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    diversity_score: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    recency_score: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    final_score: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    result: Optional[str] = Field("pending", example="pending")
    recommendation: Optional[str] = Field(None, example="Gather additional independent verified sources.")


class AnalysisCreate(AnalysisBase):
    claim_id: int


class AnalysisResponse(AnalysisBase):
    id: int
    claim_id: int
    created_at: datetime

    class Config:
        from_attributes = True
