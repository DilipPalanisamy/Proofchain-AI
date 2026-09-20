from datetime import datetime
from typing import Optional, Any, List

from pydantic import BaseModel, ConfigDict


# ============================================================
# BASE EVIDENCE
# ============================================================

class EvidenceBase(BaseModel):
    claim_id: str
    type: str = "DOCUMENT"

    file_name: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    location: Optional[str] = None
    timestamp: Optional[datetime] = None

    reliability_score: Optional[float] = 0.7


class EvidenceCreate(EvidenceBase):
    pass


# ============================================================
# UPDATE
# ============================================================

class EvidenceUpdate(BaseModel):
    type: Optional[str] = None
    file_name: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    location: Optional[str] = None
    timestamp: Optional[datetime] = None

    reliability_score: Optional[float] = None
    quality_score: Optional[float] = None
    similarity_score: Optional[float] = None


# ============================================================
# DATABASE RESPONSE
# ============================================================

class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    evidence_id: Optional[str] = None
    claim_id: int

    type: str

    file_name: Optional[str] = None
    file_path: Optional[str] = None

    description: Optional[str] = None
    source: Optional[str] = None
    location: Optional[str] = None

    timestamp: Optional[datetime] = None

    quality_score: Optional[float] = None
    similarity_score: Optional[float] = None
    reliability_score: Optional[float] = None

    created_at: Optional[datetime] = None


# ============================================================
# EVIDENCE ANALYSIS REQUEST
# ============================================================

class EvidenceAnalysisRequest(BaseModel):
    evidence_id: str

    analysis_type: Optional[str] = "full"

    include_similarity: Optional[bool] = True
    include_contradiction: Optional[bool] = True
    include_quality: Optional[bool] = True


# ============================================================
# EVIDENCE EVALUATION
# ============================================================

class EvidenceEvaluation(BaseModel):
    """
    Internal evaluation result used by evidence_analyzer.py.
    """

    evidence_id: Optional[str] = None

    quality_score: float = 0.0
    reliability_score: float = 0.0
    similarity_score: float = 0.0

    completeness_score: float = 0.0
    consistency_score: float = 0.0
    diversity_score: float = 0.0
    recency_score: float = 0.0

    overall_score: float = 0.0
    confidence_score: float = 0.0

    result: Optional[str] = None
    recommendation: Optional[str] = None

    observations: Optional[List[Any]] = None
    contradictions: Optional[List[Any]] = None
    similarities: Optional[List[Any]] = None
    limitations: Optional[List[str]] = None


# ============================================================
# AI ANALYSIS RESPONSE
# ============================================================

class EvidenceAnalysisResponse(BaseModel):
    evidence_id: str

    summary: Optional[str] = None

    observations: Optional[List[Any]] = None
    entities: Optional[List[Any]] = None

    location: Optional[str] = None
    date: Optional[str] = None
    severity: Optional[str] = None

    evidence_type: Optional[str] = None

    extraction_confidence: Optional[float] = None

    limitations: Optional[List[str]] = None

    similarity_score: Optional[float] = None
    contradiction_score: Optional[float] = None
    quality_score: Optional[float] = None

    recommendation: Optional[str] = None


# ============================================================
# PROOFCHAIN ANALYSIS RESPONSE & STEPS
# ============================================================

class ProofChainStep(BaseModel):
    """
    Individual step model imported by evidence_analyzer.py.
    """
    step_number: Optional[int] = None
    name: Optional[str] = None
    status: Optional[str] = None
    details: Optional[str] = None
    score: Optional[float] = None
    timestamp: Optional[datetime] = None


class ProofChainAnalysisResponse(BaseModel):
    evidence_id: Optional[str] = None
    claim_id: Optional[str] = None

    summary: Optional[str] = None

    quality_score: Optional[float] = None
    completeness_score: Optional[float] = None
    consistency_score: Optional[float] = None
    diversity_score: Optional[float] = None
    recency_score: Optional[float] = None

    final_score: Optional[float] = None
    confidence_score: Optional[float] = None

    result: Optional[str] = None
    recommendation: Optional[str] = None

    steps: Optional[List[ProofChainStep]] = None

    observations: Optional[List[Any]] = None
    contradictions: Optional[List[Any]] = None
    similarities: Optional[List[Any]] = None
    limitations: Optional[List[str]] = None

    created_at: Optional[datetime] = None