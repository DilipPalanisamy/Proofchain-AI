from pathlib import Path
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.evidence import Evidence
from app.services.ai_extractor import analyze_evidence


router = APIRouter(
    prefix="/ai",
    tags=["AI Evidence Analysis"],
)


@router.post("/evidence/{evidence_id}")
def analyze_uploaded_evidence(
    evidence_id: str,
    db: Session = Depends(get_db),
):
    evidence = None

    # 1. Try public evidence_id
    try:
        evidence = (
            db.query(Evidence)
            .filter(Evidence.evidence_id == evidence_id)
            .first()
        )
    except Exception:
        evidence = None

    # 2. Fallback to numeric database ID
    if not evidence:
        match = re.search(r"(\d+)$", evidence_id)

        if match:
            numeric_id = int(match.group(1))

            evidence = (
                db.query(Evidence)
                .filter(Evidence.id == numeric_id)
                .first()
            )

    # 3. Evidence not found
    if not evidence:
        raise HTTPException(
            status_code=404,
            detail=f"Evidence {evidence_id} not found",
        )

    # 4. Require uploaded file
    if not evidence.file_path:
        raise HTTPException(
            status_code=400,
            detail="Evidence does not have a stored file path",
        )

    # 5. Resolve exact file path
    file_path = Path(evidence.file_path)

    if not file_path.is_absolute():
        file_path = Path.cwd() / file_path

    file_path = file_path.resolve()

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Uploaded evidence file not found: {file_path}",
        )

    # 6. Run AI analysis
    try:
        result = analyze_evidence(
            str(file_path),
            evidence.type,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(exc)}",
        )

    # 7. Return structured result
    return {
        "evidence_id": evidence.evidence_id or evidence_id,
        "database_id": evidence.id,
        "claim_id": evidence.claim_id,
        "file_name": evidence.file_name,
        "uploaded_file": str(file_path),
        "ai_analysis": result,
    }