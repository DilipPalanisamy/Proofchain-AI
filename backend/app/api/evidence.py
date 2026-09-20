import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    status,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.claim import Claim
from app.models.evidence import Evidence
from app.schemas.evidence import EvidenceCreate, EvidenceResponse


router = APIRouter()


# ============================================================
# CONFIGURATION
# ============================================================

UPLOAD_DIR = Path("uploads/evidence")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf",
    ".docx",
    ".txt",
    ".csv",
    ".json",
}

SUPPORTED_EVIDENCE_TYPES = {
    "IMAGE",
    "DOCUMENT",
    "DATA",
    "TEXT",
    "OTHER",
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def parse_claim_id(raw_id: str) -> int:
    """
    Converts:

    11
    CLM-2026-0011

    into:

    11
    """

    raw_str = str(raw_id).strip()

    if raw_str.isdigit():
        return int(raw_str)

    match = re.search(r"(\d+)$", raw_str)

    if match:
        return int(match.group(1))

    return -1


def generate_evidence_id() -> str:
    """
    Example:
    EVD-20260920-A1B2C3
    """

    return (
        "EVD-"
        + datetime.now().strftime("%Y%m%d")
        + "-"
        + uuid.uuid4().hex[:6].upper()
    )


def get_evidence_type(extension: str) -> str:

    if extension in {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }:
        return "IMAGE"

    if extension in {".pdf", ".docx"}:
        return "DOCUMENT"

    if extension in {
        ".csv",
        ".json",
    }:
        return "DATA"

    if extension == ".txt":
        return "TEXT"

    return "OTHER"


# ============================================================
# GET ALL EVIDENCE
# ============================================================

@router.get(
    "",
    response_model=List[EvidenceResponse],
)
@router.get(
    "/",
    response_model=List[EvidenceResponse],
)
def get_all_evidence(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):

    return (
        db.query(Evidence)
        .order_by(Evidence.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================
# CREATE EVIDENCE USING JSON
# ============================================================

@router.post(
    "",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_evidence_json(
    evidence_in: EvidenceCreate,
    db: Session = Depends(get_db),
):

    numeric_id = parse_claim_id(evidence_in.claim_id)

    if numeric_id < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid claim ID: {evidence_in.claim_id}",
        )

    claim = (
        db.query(Claim)
        .filter(Claim.id == numeric_id)
        .first()
    )

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target claim '{evidence_in.claim_id}' not found.",
        )

    raw_type = (
        evidence_in.type or "DOCUMENT"
    ).upper().strip()

    evidence_type = (
        raw_type
        if raw_type in SUPPORTED_EVIDENCE_TYPES
        else "OTHER"
    )

    evidence_id = generate_evidence_id()

    # IMPORTANT:
    # Do NOT set id=evidence_id.
    # Existing SQLite database uses INTEGER primary key.
    evidence = Evidence(
        evidence_id=evidence_id,
        claim_id=claim.id,
        type=evidence_type,
        file_name=evidence_in.file_name,
        file_path=None,
        description=evidence_in.description,
        source=evidence_in.source,
        location=evidence_in.location,
        timestamp=evidence_in.timestamp,
        reliability_score=evidence_in.reliability_score,
    )

    try:

        db.add(evidence)
        db.commit()
        db.refresh(evidence)

    except SQLAlchemyError as exc:

        db.rollback()

        print("\n========== EVIDENCE JSON ERROR ==========")
        print(type(exc).__name__)
        print(str(exc))
        print("=========================================\n")

        raise HTTPException(
            status_code=500,
            detail=(
                f"Evidence database error: "
                f"{type(exc).__name__}: {str(exc)}"
            ),
        )

    return evidence


# ============================================================
# UPLOAD EVIDENCE FILE
# ============================================================

@router.post(
    "/upload",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_evidence(
    claim_id: str = Form(...),
    description: str = Form(""),
    source: str = Form("User Upload"),
    location: str = Form(""),
    timestamp: str = Form(""),
    reliability_score: float = Form(70),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    # ========================================================
    # 1. FIND CLAIM
    # ========================================================

    numeric_id = parse_claim_id(claim_id)

    if numeric_id < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid claim ID: {claim_id}",
        )

    claim = (
        db.query(Claim)
        .filter(Claim.id == numeric_id)
        .first()
    )

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target claim '{claim_id}' not found",
        )

    # ========================================================
    # 2. VALIDATE FILE
    # ========================================================

    original_name = file.filename or "unknown"

    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file type: {extension}. "
                f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )

    # ========================================================
    # 3. CREATE UNIQUE FILE NAME
    # ========================================================

    unique_name = (
        datetime.now().strftime("%Y%m%d_%H%M%S")
        + "_"
        + uuid.uuid4().hex[:8]
        + extension
    )

    file_path = UPLOAD_DIR / unique_name

    # ========================================================
    # 4. SAVE ACTUAL FILE
    # ========================================================

    try:

        contents = await file.read()

        if not contents:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty",
            )

        with open(file_path, "wb") as buffer:
            buffer.write(contents)

    except HTTPException:
        raise

    except Exception as exc:

        print("\n========== FILE SAVE ERROR ==========")
        print(type(exc).__name__)
        print(str(exc))
        print("=====================================\n")

        raise HTTPException(
            status_code=500,
            detail=f"Could not save uploaded file: {str(exc)}",
        )

    # ========================================================
    # 5. DETERMINE EVIDENCE TYPE
    # ========================================================

    evidence_type = get_evidence_type(extension)

    # ========================================================
    # 6. PARSE TIMESTAMP
    # ========================================================

    parsed_timestamp = None

    if timestamp.strip():

        try:

            parsed_timestamp = datetime.fromisoformat(
                timestamp.strip()
            )

        except ValueError:

            try:
                file_path.unlink(missing_ok=True)
            except Exception:
                pass

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid timestamp format. "
                    "Use YYYY-MM-DDTHH:MM:SS"
                ),
            )

    # ========================================================
    # 7. NORMALIZE RELIABILITY
    # ========================================================

    if reliability_score > 1.0:
        normalized_reliability = reliability_score / 100.0
    else:
        normalized_reliability = reliability_score

    normalized_reliability = max(
        0.0,
        min(1.0, normalized_reliability)
    )

    # ========================================================
    # 8. GENERATE PUBLIC EVIDENCE ID
    # ========================================================

    evidence_id = generate_evidence_id()

    # ========================================================
    # 9. CREATE DATABASE OBJECT
    # ========================================================

    # IMPORTANT:
    #
    # DO NOT:
    # id=evidence_id
    #
    # Existing SQLite database uses INTEGER id.
    #
    # SQLite will automatically generate:
    # id = 14
    #
    # while evidence_id becomes:
    # EVD-20260920-A1B2C3

    evidence = Evidence(
        evidence_id=evidence_id,
        claim_id=claim.id,
        type=evidence_type,
        file_name=original_name,
        file_path=str(file_path),
        description=description,
        source=source,
        location=location,
        timestamp=parsed_timestamp,
        reliability_score=normalized_reliability,
    )

    # ========================================================
    # 10. SAVE DATABASE RECORD
    # ========================================================

    try:

        db.add(evidence)
        db.commit()
        db.refresh(evidence)

    except SQLAlchemyError as exc:

        db.rollback()

        # Database failed, so remove uploaded file.
        try:
            file_path.unlink(missing_ok=True)
        except Exception:
            pass

        print("\n========== EVIDENCE UPLOAD DATABASE ERROR ==========")
        print(type(exc).__name__)
        print(str(exc))
        print("=====================================================\n")

        raise HTTPException(
            status_code=500,
            detail=(
                f"Evidence database error: "
                f"{type(exc).__name__}: {str(exc)}"
            ),
        )

    # ========================================================
    # 11. RETURN SUCCESS
    # ========================================================

    return evidence


# ============================================================
# GET SINGLE EVIDENCE
# ============================================================

@router.get(
    "/{evidence_id}",
    response_model=EvidenceResponse,
)
def get_evidence(
    evidence_id: str,
    db: Session = Depends(get_db),
):

    # First search public evidence ID
    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.evidence_id == evidence_id
        )
        .first()
    )

    # Fallback to database numeric ID
    if not evidence:

        try:

            numeric_id = int(evidence_id)

            evidence = (
                db.query(Evidence)
                .filter(
                    Evidence.id == numeric_id
                )
                .first()
            )

        except ValueError:
            evidence = None

    if not evidence:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Evidence with id "
                f"'{evidence_id}' not found"
            ),
        )

    return evidence


# ============================================================
# DELETE EVIDENCE
# ============================================================

@router.delete(
    "/{evidence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_evidence(
    evidence_id: str,
    db: Session = Depends(get_db),
):

    # Find by public ID
    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.evidence_id == evidence_id
        )
        .first()
    )

    # Fallback to numeric database ID
    if not evidence:

        try:

            numeric_id = int(evidence_id)

            evidence = (
                db.query(Evidence)
                .filter(
                    Evidence.id == numeric_id
                )
                .first()
            )

        except ValueError:
            evidence = None

    if not evidence:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Evidence with id "
                f"'{evidence_id}' not found"
            ),
        )

    # ========================================================
    # DELETE PHYSICAL FILE
    # ========================================================

    if evidence.file_path:

        physical_file = Path(evidence.file_path)

        if physical_file.exists():

            try:
                physical_file.unlink()
            except Exception:
                pass

    # ========================================================
    # DELETE DATABASE RECORD
    # ========================================================

    try:

        db.delete(evidence)
        db.commit()

    except SQLAlchemyError as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Could not delete evidence: "
                f"{type(exc).__name__}: {str(exc)}"
            ),
        )

    return None