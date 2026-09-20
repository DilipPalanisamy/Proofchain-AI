import re
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.claim import Claim
from app.models.evidence import Evidence
from app.schemas.claim import (
    ClaimCreate,
    ClaimUpdate,
    ClaimResponse,
    ClaimDetailResponse,
)
from app.schemas.evidence import EvidenceResponse

router = APIRouter()


def parse_claim_id(raw_id: str) -> int:
    """Parses numeric ID or formatted ID like CLM-2026-0001 into integer ID."""
    if raw_id.isdigit():
        return int(raw_id)
    match = re.search(r"(\d+)$", raw_id)
    if match:
        return int(match.group(1))
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Invalid claim identifier format: '{raw_id}'",
    )


@router.get("", response_model=List[ClaimResponse])
@router.get("/", response_model=List[ClaimResponse])
def get_all_claims(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Fetch paginated list of claims."""
    claims = db.query(Claim).order_by(Claim.created_at.desc()).offset(skip).limit(limit).all()
    return claims


@router.post("", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def create_claim(
    claim_in: ClaimCreate,
    idempotency_key_header: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
):
    """
    Register a new claim to be verified.
    Supports idempotency via 'Idempotency-Key' header or 'idempotency_key' payload field.
    If the same key is submitted multiple times, the backend returns the existing claim record.
    """
    key = claim_in.idempotency_key or idempotency_key_header
    if key:
        key = key.strip()
        existing_claim = db.query(Claim).filter(Claim.idempotency_key == key).first()
        if existing_claim:
            return existing_claim

    claim = Claim(
        title=claim_in.title,
        description=claim_in.description,
        status=claim_in.status or "pending",
        confidence_score=claim_in.confidence_score,
        idempotency_key=key if key else None,
    )

    try:
        db.add(claim)
        db.commit()
        db.refresh(claim)
        return claim
    except IntegrityError:
        db.rollback()
        if key:
            existing_claim = db.query(Claim).filter(Claim.idempotency_key == key).first()
            if existing_claim:
                return existing_claim
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A concurrent conflict occurred while registering the claim. Please retry."
        )


@router.post("/demo/seed", response_model=ClaimDetailResponse)
def seed_demo_claim(db: Session = Depends(get_db)):
    """
    Creates or returns the official demo claim with real relevant and irrelevant evidence.
    """
    demo_claim = (
        db.query(Claim)
        .filter(Claim.title == "Damaged road near school")
        .order_by(Claim.id.desc())
        .first()
    )
    if not demo_claim:
        demo_claim = Claim(
            title="Damaged road near school",
            description="Severe road damage and deep potholes reported near the elementary school entrance on Main Street, creating significant traffic hazards.",
            status="pending",
        )
        db.add(demo_claim)
        db.commit()
        db.refresh(demo_claim)

    existing_ev = db.query(Evidence).filter(Evidence.claim_id == demo_claim.id).all()
    if not existing_ev:
        upload_files = list(Path("uploads/evidence").glob("*.png"))
        sample_img_path = str(upload_files[0]) if upload_files else None

        ev1 = Evidence(
            evidence_id=f"EVD-{demo_claim.id:04d}-REL1",
            claim_id=demo_claim.id,
            type="IMAGE",
            file_name="school_pothole_photo.png",
            file_path=sample_img_path,
            description="High-resolution photograph showing severe potholes and asphalt fracturing directly in front of the school entrance.",
            source="Parent-Teacher Association",
            location="Main Street, School Entrance",
            reliability_score=0.90,
        )
        ev2 = Evidence(
            evidence_id=f"EVD-{demo_claim.id:04d}-REL2",
            claim_id=demo_claim.id,
            type="DOCUMENT",
            file_name="public_works_report.txt",
            file_path=None,
            description="Official City Public Works inspection report recording multiple road surface craters near the school zone.",
            source="Department of Transportation",
            location="Main Street",
            reliability_score=0.88,
        )
        ev3 = Evidence(
            evidence_id=f"EVD-{demo_claim.id:04d}-IRR1",
            claim_id=demo_claim.id,
            type="DOCUMENT",
            file_name="github_repository_readme.txt",
            file_path=None,
            description="GitHub repository setup instructions explaining python virtual environments and node package installation.",
            source="Third-Party Dev Repo",
            location=None,
            reliability_score=0.70,
        )
        db.add_all([ev1, ev2, ev3])
        db.commit()
        db.refresh(demo_claim)

    return demo_claim


@router.get("/{claim_id}", response_model=ClaimDetailResponse)
def get_claim(claim_id: str, db: Session = Depends(get_db)):
    """
    Retrieve a single claim and all its associated evidence.
    Accepts numeric ID (e.g. '1') or formatted ID (e.g. 'CLM-2026-0001').
    """
    numeric_id = parse_claim_id(claim_id)
    claim = db.query(Claim).filter(Claim.id == numeric_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim with id '{claim_id}' not found",
        )
    return claim


@router.get("/{claim_id}/evidence", response_model=List[EvidenceResponse])
def get_claim_evidence(claim_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all evidence records associated with a specific claim.
    Accepts numeric ID or formatted ID.
    """
    numeric_id = parse_claim_id(claim_id)
    claim = db.query(Claim).filter(Claim.id == numeric_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim with id '{claim_id}' not found",
        )
    return claim.evidence


@router.get("/{claim_id}/analyze")
@router.post("/{claim_id}/analyze")
def analyze_claim_shortcut(claim_id: str, db: Session = Depends(get_db)):
    """
    Shortcut endpoint to analyze a claim via /claims/{claim_id}/analyze.
    Delegates directly to the ProofChain analysis pipeline.
    """
    from app.api.analysis import analyze_claim as run_analysis
    return run_analysis(claim_id=claim_id, db=db)


@router.put("/{claim_id}", response_model=ClaimResponse)
def update_claim(claim_id: str, claim_update: ClaimUpdate, db: Session = Depends(get_db)):
    """Update claim details or verification status."""
    numeric_id = parse_claim_id(claim_id)
    claim = db.query(Claim).filter(Claim.id == numeric_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim with id '{claim_id}' not found",
        )

    update_data = claim_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(claim, field, value)

    db.commit()
    db.refresh(claim)
    return claim


@router.delete("/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_claim(claim_id: str, db: Session = Depends(get_db)):
    """Remove a claim and associated evidence items."""
    numeric_id = parse_claim_id(claim_id)
    claim = db.query(Claim).filter(Claim.id == numeric_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim with id '{claim_id}' not found",
        )
    db.delete(claim)
    db.commit()
    return None
