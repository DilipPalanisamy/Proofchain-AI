from datetime import datetime
from pathlib import Path
import re
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.analysis import Analysis
from app.models.claim import Claim
from app.models.evidence import Evidence
from app.services.ai_extractor import analyze_evidence
from app.services.contradiction import contradiction_score
from app.services.relevance import calculate_relevance
from app.services.scoring import calculate_evidence_score
from app.services.similarity import calculate_similarity

router = APIRouter()


def parse_claim_id(raw_id: str) -> int:
    """Parses numeric ID or formatted ID like CLM-2026-0001 into integer database ID."""
    str_id = str(raw_id).strip()
    if str_id.isdigit():
        return int(str_id)
    match = re.search(r"(\d+)$", str_id)
    if match:
        return int(match.group(1))
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Invalid claim identifier format: '{raw_id}'",
    )


@router.post("/claim/{claim_id}")
def analyze_claim(claim_id: str, db: Session = Depends(get_db)):
    """
    Complete Evidence Package Analysis API for ProofChain AI with Relevance Detection.

    1. Loads the claim using public ID (CLM-2026-0011) or numeric ID.
    2. Loads all associated evidence records.
    3. Runs AI extraction on uploaded evidence files using exact file paths.
    4. Evaluates evidence-to-claim relevance (semantic + keyword overlap).
    5. Evaluates pairwise semantic similarity and contradiction stance.
    6. Computes quality, completeness, consistency, diversity, recency, and reliability scores.
    7. Applies duplicate and contradiction penalties.
    8. Computes deterministic final ProofChain evidence strength score with relevance adjustment.
    9. Persists analysis in database and updates claim confidence.
    """
    # 1. Load Claim
    numeric_id = parse_claim_id(claim_id)
    claim = db.query(Claim).filter(Claim.id == numeric_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim '{claim_id}' not found",
        )

    # 2. Load ALL evidence attached to this claim
    evidence_records = (
        db.query(Evidence)
        .filter(Evidence.claim_id == claim.id)
        .order_by(Evidence.id.asc())
        .all()
    )

    # 3. If no evidence exists, return 400
    if not evidence_records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No evidence available for this claim.",
        )

    # 4 & 5. Process every evidence item with AI extraction & relevance detection
    evidence_evaluations: List[Dict[str, Any]] = []
    text_representations: List[str] = []
    all_limitations: List[str] = []
    relevance_recommendations: List[str] = []

    for ev in evidence_records:
        ev_id = ev.evidence_id or f"EVD-{ev.id:04d}"
        ev_limitations: List[str] = []
        ai_extracted: Optional[Dict[str, Any]] = None

        # Check physical file existence using exact stored file_path
        file_resolved_path: Optional[Path] = None
        if ev.file_path:
            p = Path(ev.file_path)
            if not p.is_absolute():
                p = (Path.cwd() / p).resolve()
            if p.exists() and p.is_file():
                file_resolved_path = p
            else:
                ev_limitations.append(f"Physical file not found at path: {ev.file_path}")
        else:
            ev_limitations.append("No file path recorded for this evidence record.")

        # Run Gemini AI extraction if physical file exists
        if file_resolved_path:
            try:
                ai_extracted = analyze_evidence(
                    str(file_resolved_path),
                    ev.type or "DOCUMENT",
                )
            except Exception as exc:
                ev_limitations.append(f"AI extraction failed on file: {str(exc)}")
                ai_extracted = None

        # Extract factual properties from AI result or fallback to metadata
        if ai_extracted and isinstance(ai_extracted, dict):
            summary = (
                ai_extracted.get("summary")
                or ev.description
                or f"Evidence file: {ev.file_name or 'Artifact'}"
            )
            observations = ai_extracted.get("observations") or []
            location = ai_extracted.get("location") or ev.location
            date_str = ai_extracted.get("date") or (
                ev.timestamp.isoformat() if ev.timestamp else None
            )
            severity = ai_extracted.get("severity") or "UNKNOWN"
            extraction_conf = float(
                ai_extracted.get("extraction_confidence") or 80.0
            )
            if ai_extracted.get("limitations"):
                ev_limitations.extend(ai_extracted["limitations"])
        else:
            summary = (
                ev.description
                or f"Evidence metadata record for {ev.file_name or ev_id}"
            )
            observations = [ev.description] if ev.description else []
            location = ev.location
            date_str = ev.timestamp.isoformat() if ev.timestamp else None
            severity = "UNKNOWN"
            extraction_conf = 65.0

        # Run Evidence Relevance Detection against Claim
        rel_result = calculate_relevance(
            claim_title=claim.title,
            claim_description=claim.description,
            evidence_summary=summary,
            evidence_observations=observations,
        )

        if rel_result["classification"] == "IRRELEVANT":
            relevance_recommendations.append(
                f"Evidence [{ev_id}] appears IRRELEVANT to the claim; verify or replace with directly relevant materials."
            )
            ev_limitations.append(f"Classified as IRRELEVANT to claim '{claim.title}'.")
        elif rel_result["classification"] == "PARTIALLY_RELEVANT":
            ev_limitations.append(f"Classified as PARTIALLY_RELEVANT to claim '{claim.title}'.")

        if rel_result.get("limitations"):
            ev_limitations.extend(rel_result["limitations"])

        # Determine item quality_score
        if ev.quality_score is not None and ev.quality_score > 0:
            item_quality = float(ev.quality_score)
            if item_quality <= 1.0:
                item_quality *= 100.0
        else:
            # Derive transparently from extraction confidence & metadata presence
            metadata_bonus = 0.0
            if file_resolved_path:
                metadata_bonus += 20.0
            if ev.description:
                metadata_bonus += 10.0
            if ev.source:
                metadata_bonus += 10.0
            item_quality = min(
                100.0,
                round((extraction_conf * 0.6) + metadata_bonus, 2),
            )

        # Determine item reliability_score
        if ev.reliability_score is not None:
            item_reliability = float(ev.reliability_score)
            if item_reliability <= 1.0:
                item_reliability *= 100.0
        else:
            item_reliability = 70.0

        # Construct text representation for similarity & contradiction matching
        obs_text = (
            " ".join([str(o) for o in observations]) if observations else ""
        )
        full_text = f"{summary}. {obs_text}".strip()
        if not full_text:
            full_text = f"{ev.type} evidence from {ev.source or 'unknown source'}"

        text_representations.append(full_text)

        eval_item = {
            "evidence_id": ev_id,
            "database_id": ev.id,
            "file_name": ev.file_name,
            "file_path": ev.file_path,
            "type": ev.type,
            "source": ev.source,
            "summary": summary,
            "observations": observations,
            "location": location,
            "date": date_str,
            "severity": severity,
            "extraction_confidence": extraction_conf,
            "quality_score": round(item_quality, 2),
            "reliability_score": round(item_reliability, 2),
            "relevance_score": rel_result["relevance_score"],
            "relevance_classification": rel_result["classification"],
            "relevance_reason": rel_result["reason"],
            "relevance_matched_terms": rel_result.get("matched_terms", []),
            "ai_analysis": {
                "summary": summary,
                "observations": observations,
                "location": location,
                "date": date_str,
                "severity": severity,
                "extraction_confidence": extraction_conf,
                "limitations": ev_limitations,
            },
            "similarity_information": [],
            "contradiction_information": [],
            "limitations": ev_limitations,
        }
        evidence_evaluations.append(eval_item)
        all_limitations.extend([f"[{ev_id}] {lim}" for lim in ev_limitations])

    # 6 & 7. Pairwise comparisons (Similarity and Contradiction)
    num_items = len(evidence_evaluations)
    pairwise_similarities: List[Dict[str, Any]] = []
    pairwise_contradictions: List[Dict[str, Any]] = []

    for i in range(num_items):
        for j in range(i + 1, num_items):
            id_a = evidence_evaluations[i]["evidence_id"]
            id_b = evidence_evaluations[j]["evidence_id"]
            txt_a = text_representations[i]
            txt_b = text_representations[j]

            # Similarity
            sim_res = calculate_similarity(txt_a, txt_b)
            sim_entry = {
                "evidence_a": id_a,
                "evidence_b": id_b,
                "similarity_score": sim_res["similarity_score"],
                "relationship": sim_res["relationship"],
            }
            pairwise_similarities.append(sim_entry)
            evidence_evaluations[i]["similarity_information"].append(sim_entry)
            evidence_evaluations[j]["similarity_information"].append(sim_entry)

            # Contradiction
            contra_res = contradiction_score(txt_a, txt_b)
            contra_entry = {
                "evidence_a": id_a,
                "evidence_b": id_b,
                "contradiction_score": contra_res["contradiction_score"],
                "relationship": contra_res["relationship"],
                "contradictions": contra_res["contradictions"],
                "shared_terms": contra_res.get("shared_terms", []),
            }
            pairwise_contradictions.append(contra_entry)
            evidence_evaluations[i]["contradiction_information"].append(contra_entry)
            evidence_evaluations[j]["contradiction_information"].append(contra_entry)

    # 8. Calculate package-level metrics
    # Quality Score: mean of item quality scores
    pkg_quality = round(
        sum(item["quality_score"] for item in evidence_evaluations) / num_items,
        2,
    )

    # Reliability Score: mean of item reliability scores
    pkg_reliability = round(
        sum(item["reliability_score"] for item in evidence_evaluations) / num_items,
        2,
    )

    # Consistency Score: start from 100 and reduce by contradiction severity
    if pairwise_contradictions:
        max_contra = max(c["contradiction_score"] for c in pairwise_contradictions)
        avg_contra = sum(
            c["contradiction_score"] for c in pairwise_contradictions
        ) / len(pairwise_contradictions)
        contra_impact = (max_contra * 0.7) + (avg_contra * 0.3)
        pkg_consistency = round(max(0.0, 100.0 - contra_impact), 2)
    else:
        pkg_consistency = 100.0

    # Completeness Score: evaluate presence of description, source, location, timestamp, observations
    completeness_scores: List[float] = []
    for idx, ev in enumerate(evidence_records):
        item_comp = 0.0
        if ev.description:
            item_comp += 20.0
        if ev.source:
            item_comp += 20.0
        if ev.location or evidence_evaluations[idx]["location"]:
            item_comp += 20.0
        if ev.timestamp or evidence_evaluations[idx]["date"]:
            item_comp += 20.0
        if evidence_evaluations[idx]["observations"]:
            item_comp += 20.0
        completeness_scores.append(item_comp)
    pkg_completeness = round(sum(completeness_scores) / num_items, 2)

    # Diversity Score: measure variety of unique sources and unique evidence types
    unique_sources = {
        ev.source.strip().lower()
        for ev in evidence_records
        if ev.source and ev.source.strip()
    }
    unique_types = {
        ev.type.strip().upper()
        for ev in evidence_records
        if ev.type and ev.type.strip()
    }

    if len(unique_sources) >= 3:
        source_div = 100.0
    elif len(unique_sources) == 2:
        source_div = 75.0
    elif len(unique_sources) == 1:
        source_div = 45.0
    else:
        source_div = 30.0

    if len(unique_types) >= 3:
        type_div = 100.0
    elif len(unique_types) == 2:
        type_div = 80.0
    else:
        type_div = 50.0

    pkg_diversity = round((source_div * 0.6) + (type_div * 0.4), 2)

    # Recency Score: evaluate timestamps
    recency_scores: List[float] = []
    now = datetime.utcnow()
    for idx, ev in enumerate(evidence_records):
        ts = ev.timestamp
        if ts is None and evidence_evaluations[idx]["date"]:
            try:
                d_clean = re.sub(
                    r"[^0-9\-]", "", evidence_evaluations[idx]["date"][:10]
                )
                ts = datetime.strptime(d_clean, "%Y-%m-%d")
            except Exception:
                ts = None

        if ts:
            diff_days = max(0, (now - ts).days)
            if diff_days <= 7:
                rec_val = 100.0
            elif diff_days <= 30:
                rec_val = 90.0
            elif diff_days <= 90:
                rec_val = 80.0
            elif diff_days <= 180:
                rec_val = 70.0
            elif diff_days <= 365:
                rec_val = 60.0
            else:
                rec_val = 40.0
            recency_scores.append(rec_val)
        else:
            all_limitations.append(
                f"[{evidence_evaluations[idx]['evidence_id']}] Timestamp is unavailable; assigned baseline unverified recency."
            )
            recency_scores.append(50.0)

    pkg_recency = round(sum(recency_scores) / num_items, 2)

    # 9. Calculate duplicate_penalty from similarity results
    dup_penalty = 0.0
    for s in pairwise_similarities:
        if s["similarity_score"] >= 90.0:
            dup_penalty += 10.0
        elif s["similarity_score"] >= 70.0:
            dup_penalty += 5.0
    dup_penalty = min(25.0, round(dup_penalty, 2))

    # 10. Calculate contradiction_penalty from contradiction results
    contra_penalty = 0.0
    for c in pairwise_contradictions:
        if c["contradiction_score"] >= 70.0:
            contra_penalty += 15.0
        elif c["contradiction_score"] >= 30.0:
            contra_penalty += 8.0
    contra_penalty = min(30.0, round(contra_penalty, 2))

    # 11. Calculate overall score with ProofChain evidence scoring engine
    scoring = calculate_evidence_score(
        quality_score=pkg_quality,
        completeness_score=pkg_completeness,
        consistency_score=pkg_consistency,
        diversity_score=pkg_diversity,
        recency_score=pkg_recency,
        reliability_score=pkg_reliability,
        duplicate_penalty=dup_penalty,
        contradiction_penalty=contra_penalty,
    )

    # Calculate average relevance across evidence and apply relevance adjustment
    avg_relevance = round(
        sum(item["relevance_score"] for item in evidence_evaluations) / num_items,
        2,
    )
    relevance_adjustment = round((avg_relevance - 70.0) * 0.20, 2)
    adjusted_final_score = round(
        max(0.0, min(100.0, scoring["final_score"] + relevance_adjustment)),
        2,
    )

    # Determine final evidence strength classification based on adjusted_final_score
    if adjusted_final_score >= 85.0:
        result_classification = "HIGH_STRENGTH"
        result_desc = (
            "Robust evidence package with high fidelity, verified source reliability, "
            "strong topical relevance, and solid corroborating coverage."
        )
    elif adjusted_final_score >= 70.0:
        result_classification = "SUBSTANTIAL_STRENGTH"
        result_desc = (
            "Substantial evidence strength with solid reliability, consistent indicators, "
            "and relevant context with minor gaps in coverage or diversity."
        )
    elif adjusted_final_score >= 50.0:
        result_classification = "MODERATE_STRENGTH"
        result_desc = (
            "Moderate evidence strength with partial corroboration or moderate relevance; "
            "notable deficiencies exist in completeness, diversity, or recency."
        )
    elif adjusted_final_score >= 30.0:
        result_classification = "LIMITED_STRENGTH"
        result_desc = (
            "Limited evidence strength; significant deficits in source verification, "
            "relevance, completeness, or consistency."
        )
    else:
        result_classification = "INSUFFICIENT_STRENGTH"
        result_desc = (
            "Insufficient evidence strength; low topical relevance, heavily penalized, "
            "or lacking fundamental quality."
        )

    # Relevance warnings in recommendations & limitations
    if avg_relevance < 60.0:
        relevance_recommendations.append(
            f"Average evidence relevance is low ({avg_relevance}/100); provide direct primary evidence specific to the claim assertion."
        )

    # Update component_scores and weighted_contributions with relevance info
    comp_scores = dict(scoring["component_scores"])
    comp_scores["relevance_score"] = avg_relevance

    weighted_contribs = dict(scoring["weighted_contributions"])
    weighted_contribs["relevance_adjustment"] = relevance_adjustment

    # 12. Store analysis record in analyses table
    analysis_record = Analysis(
        claim_id=claim.id,
        quality_score=comp_scores["quality_score"],
        completeness_score=comp_scores["completeness_score"],
        consistency_score=comp_scores["consistency_score"],
        diversity_score=comp_scores["diversity_score"],
        recency_score=comp_scores["recency_score"],
        final_score=adjusted_final_score,
        result=result_classification,
        recommendation=scoring["recommendation"],
    )
    db.add(analysis_record)

    # 13. Update claim confidence score and status with ProofChain evidence strength
    claim.confidence_score = adjusted_final_score
    claim.status = result_classification
    db.commit()
    db.refresh(claim)

    # Combine recommendations & limitations
    combined_recommendations = (
        relevance_recommendations + scoring.get("recommendations", [])
    )
    combined_limitations = list(
        dict.fromkeys(scoring.get("limitations", []) + all_limitations)
    )

    primary_recommendation = (
        combined_recommendations[0]
        if combined_recommendations
        else scoring["recommendation"]
    )

    # 14. Return transparent structured response
    return {
        "claim_id": claim.formatted_id,
        "database_id": claim.id,
        "claim_title": claim.title,
        "claim_description": claim.description,
        "analyzed_at": datetime.utcnow().isoformat(),
        "evidence_count": num_items,
        "final_score": adjusted_final_score,
        "result": result_classification,
        "result_description": result_desc,
        "component_scores": comp_scores,
        "weighted_contributions": weighted_contribs,
        "penalties": scoring["penalties"],
        "evidence_evaluations": evidence_evaluations,
        "similarities": pairwise_similarities,
        "contradictions": pairwise_contradictions,
        "recommendation": primary_recommendation,
        "recommendations": combined_recommendations,
        "limitations": combined_limitations,
    }
