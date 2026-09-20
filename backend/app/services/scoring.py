from typing import Dict, Any, List, Optional, Tuple


# ==============================================================================
# Scoring Model Configuration & Weights
# ==============================================================================
# The weights represent the relative importance of each dimension in determining
# the overall structural strength and credibility of the evidence package.
# Total weights sum exactly to 1.0 (100%).

WEIGHTS: Dict[str, float] = {
    "quality_score": 0.20,        # Clarity, integrity, and artifact fidelity
    "reliability_score": 0.20,    # Source trust, author credibility, and origin verification
    "consistency_score": 0.15,    # Internal factual harmony and absence of internal friction
    "completeness_score": 0.15,   # Metadata completeness, timestamps, and geolocation
    "diversity_score": 0.15,      # Multi-modal / multi-source variety
    "recency_score": 0.15,        # Temporal proximity to the subject matter
}

DEFAULT_LIMITATIONS: List[str] = [
    "Evaluates evidence package structural strength, reliability, and consistency; does not declare absolute real-world ground truth.",
    "Automated duplicate and contradiction penalties depend on the accuracy and depth of provided metadata and textual extractions.",
    "Should serve as an objective decision-support index alongside human review and cryptographic chain-of-custody verification.",
]


def _normalize_score(val: Any) -> float:
    """Normalize input scores to a float in range [0.0, 100.0]."""
    if val is None:
        return 0.0
    try:
        f = float(val)
    except (ValueError, TypeError):
        return 0.0

    # Auto-scale 0.0-1.0 decimal inputs to 0.0-100.0
    if 0.0 < f <= 1.0:
        f = f * 100.0

    return max(0.0, min(100.0, round(f, 2)))


def _normalize_penalty(val: Any) -> float:
    """Normalize penalty values to a float in range [0.0, 100.0]."""
    if val is None:
        return 0.0
    try:
        f = float(val)
    except (ValueError, TypeError):
        return 0.0

    # Auto-scale 0.0-1.0 decimal inputs to 0.0-100.0
    if 0.0 < f <= 1.0:
        f = f * 100.0

    return max(0.0, min(100.0, round(f, 2)))


def calculate_evidence_score(
    quality_score: float = 0.0,
    completeness_score: float = 0.0,
    consistency_score: float = 0.0,
    diversity_score: float = 0.0,
    recency_score: float = 0.0,
    reliability_score: float = 0.0,
    duplicate_penalty: float = 0.0,
    contradiction_penalty: float = 0.0,
) -> Dict[str, Any]:
    """
    Transparent Evidence Scoring Engine for ProofChain AI.

    Calculates a deterministic 0-100 evidence strength score using an explicit
    weighted formula, itemized penalties, and clear component contributions.

    Formula:
        Base Score = (quality * 0.20) + (reliability * 0.20) + (consistency * 0.15)
                     + (completeness * 0.15) + (diversity * 0.15) + (recency * 0.15)
        Total Penalties = duplicate_penalty + contradiction_penalty
        Final Score = max(0.0, min(100.0, Base Score - Total Penalties))

    Returns:
        Dict containing component scores, weighted contributions, penalties,
        final_score, evidence strength result, recommendations, and limitations.
    """
    # 1. Normalize all component inputs
    norm_quality = _normalize_score(quality_score)
    norm_completeness = _normalize_score(completeness_score)
    norm_consistency = _normalize_score(consistency_score)
    norm_diversity = _normalize_score(diversity_score)
    norm_recency = _normalize_score(recency_score)
    norm_reliability = _normalize_score(reliability_score)

    norm_dup_penalty = _normalize_penalty(duplicate_penalty)
    norm_contra_penalty = _normalize_penalty(contradiction_penalty)

    # 2. Calculate individual weighted contributions
    contrib_quality = round(norm_quality * WEIGHTS["quality_score"], 2)
    contrib_reliability = round(norm_reliability * WEIGHTS["reliability_score"], 2)
    contrib_consistency = round(norm_consistency * WEIGHTS["consistency_score"], 2)
    contrib_completeness = round(norm_completeness * WEIGHTS["completeness_score"], 2)
    contrib_diversity = round(norm_diversity * WEIGHTS["diversity_score"], 2)
    contrib_recency = round(norm_recency * WEIGHTS["recency_score"], 2)

    # 3. Base Score
    base_score = round(
        contrib_quality
        + contrib_reliability
        + contrib_consistency
        + contrib_completeness
        + contrib_diversity
        + contrib_recency,
        2
    )

    # 4. Penalties
    total_penalty = round(norm_dup_penalty + norm_contra_penalty, 2)

    # 5. Final Score calculation (deterministic, clamped to 0.0 - 100.0)
    raw_final = base_score - total_penalty
    final_score = round(max(0.0, min(100.0, raw_final)), 2)

    # 6. Determine Evidence Strength Category (describes evidence strength, not claim truth)
    if final_score >= 85.0:
        result = "HIGH_STRENGTH"
        result_description = (
            "Robust evidence package with high fidelity, verified source reliability, "
            "and comprehensive corroborating coverage."
        )
    elif final_score >= 70.0:
        result = "SUBSTANTIAL_STRENGTH"
        result_description = (
            "Substantial evidence strength with solid reliability and consistent indicators, "
            "with minor gaps in coverage or diversity."
        )
    elif final_score >= 50.0:
        result = "MODERATE_STRENGTH"
        result_description = (
            "Moderate evidence strength with partial corroboration; notable deficiencies "
            "exist in completeness, diversity, or recency."
        )
    elif final_score >= 30.0:
        result = "LIMITED_STRENGTH"
        result_description = (
            "Limited evidence strength; significant deficits in source verification, "
            "completeness, or consistency."
        )
    else:
        result = "INSUFFICIENT_STRENGTH"
        result_description = (
            "Insufficient evidence strength; heavily penalized or lacking fundamental "
            "quality and source reliability."
        )

    # 7. Generate Actionable Recommendations
    recommendations: List[str] = []

    if norm_dup_penalty > 0:
        recommendations.append(
            f"Deduplicate redundant evidence entries (-{norm_dup_penalty} pt penalty applied) to ensure independent corroboration."
        )

    if norm_contra_penalty > 0:
        recommendations.append(
            f"Investigate conflicting statements or negation markers (-{norm_contra_penalty} pt penalty applied) across submitted items."
        )

    if norm_reliability < 65.0:
        recommendations.append(
            "Incorporate higher-trust sources or verified primary attestations to improve source reliability."
        )

    if norm_quality < 65.0:
        recommendations.append(
            "Provide original high-resolution artifacts, uncompressed files, or clearer documentation."
        )

    if norm_completeness < 65.0:
        recommendations.append(
            "Attach complete metadata including timestamps, location coordinates, and contextual details."
        )

    if norm_diversity < 65.0:
        recommendations.append(
            "Include diverse media modalities (e.g., imagery, official records, telemetry logs, witness statements)."
        )

    if norm_recency < 65.0:
        recommendations.append(
            "Obtain fresh corroborating evidence closer to the reference event timeline."
        )

    if not recommendations:
        recommendations.append(
            "Evidence package meets high evidentiary standards across all evaluation criteria."
        )

    primary_recommendation = recommendations[0] if recommendations else "Maintain evidence chain of custody."

    # 8. Return comprehensive, transparent breakdown
    return {
        "final_score": final_score,
        "result": result,
        "result_description": result_description,
        "base_score": base_score,
        "component_scores": {
            "quality_score": norm_quality,
            "reliability_score": norm_reliability,
            "consistency_score": norm_consistency,
            "completeness_score": norm_completeness,
            "diversity_score": norm_diversity,
            "recency_score": norm_recency,
        },
        "weights": WEIGHTS,
        "weighted_contributions": {
            "quality": contrib_quality,
            "reliability": contrib_reliability,
            "consistency": contrib_consistency,
            "completeness": contrib_completeness,
            "diversity": contrib_diversity,
            "recency": contrib_recency,
        },
        "penalties": {
            "duplicate_penalty": norm_dup_penalty,
            "contradiction_penalty": norm_contra_penalty,
            "total_penalty": total_penalty,
        },
        "recommendation": primary_recommendation,
        "recommendations": recommendations,
        "limitations": list(DEFAULT_LIMITATIONS),
    }


# Alias for convenience
score_evidence = calculate_evidence_score


# ==============================================================================
# Legacy / Aggregation Compatibility Helper
# ==============================================================================
def compute_credibility_score(
    evaluations: List[Dict[str, Any]]
) -> Tuple[float, float, str, Dict[str, Any]]:
    """
    Computes an aggregate credibility score (0-100), confidence percentage (0-100),
    and a definitive verdict based on evaluated evidence items for legacy claim pipelines.
    """
    if not evaluations:
        return 50.0, 10.0, "Inconclusive / No Evidence", {
            "supporting_weight": 0.0,
            "refuting_weight": 0.0,
            "neutral_weight": 0.0,
            "total_effective_weight": 0.0,
        }

    supporting_weight = 0.0
    refuting_weight = 0.0
    neutral_weight = 0.0

    for item in evaluations:
        reliability = float(item.get("reliability_score", 0.7) or 0.7)
        similarity = float(item.get("similarity_score", 0.5) or 0.5)
        stance = item.get("stance", "neutral")
        contradiction = float(item.get("contradiction_score", 0.0) or 0.0)

        # Normalize 0-100 scores if provided in percentage format
        if reliability > 1.0:
            reliability = reliability / 100.0
        if similarity > 1.0:
            similarity = similarity / 100.0
        if contradiction > 1.0:
            contradiction = contradiction / 100.0

        effective_weight = reliability * (0.3 + 0.7 * similarity)

        if stance == "supports":
            supporting_weight += effective_weight
        elif stance == "refutes":
            refuting_weight += effective_weight * (1.0 + contradiction * 0.5)
        else:
            neutral_weight += effective_weight * 0.2

    total_weight = supporting_weight + refuting_weight + neutral_weight

    if total_weight <= 0:
        return 50.0, 20.0, "Inconclusive / Low Relevance", {
            "supporting_weight": 0.0,
            "refuting_weight": 0.0,
            "neutral_weight": 0.0,
            "total_effective_weight": 0.0,
        }

    directional_weight = supporting_weight + refuting_weight

    if directional_weight > 0:
        raw_credibility = (supporting_weight / directional_weight) * 100.0
    else:
        raw_credibility = 50.0

    evidence_count_factor = min(len(evaluations) / 3.0, 1.0)
    dominance_factor = abs(supporting_weight - refuting_weight) / (directional_weight + 0.001)
    confidence = (evidence_count_factor * 0.5 + dominance_factor * 0.5) * 100.0
    confidence = min(max(round(confidence, 1), 15.0), 98.0)

    if raw_credibility >= 70.0 and confidence >= 40.0:
        verdict = "Verified True"
    elif raw_credibility <= 30.0 and confidence >= 40.0:
        verdict = "Contradicted / False"
    elif raw_credibility > 55.0:
        verdict = "Likely Supported"
    elif raw_credibility < 45.0:
        verdict = "Likely Disputed"
    else:
        verdict = "Inconclusive / Mixed"

    metrics = {
        "supporting_weight": round(supporting_weight, 3),
        "refuting_weight": round(refuting_weight, 3),
        "neutral_weight": round(neutral_weight, 3),
        "total_effective_weight": round(total_weight, 3),
    }

    return round(raw_credibility, 1), confidence, verdict, metrics
