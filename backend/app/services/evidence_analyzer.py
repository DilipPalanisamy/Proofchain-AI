from typing import List, Dict, Any, Optional

from app.schemas.evidence import (
    EvidenceBase,
    EvidenceEvaluation,
    ProofChainStep,
    ProofChainAnalysisResponse,
)
from app.services.similarity import calculate_similarity
from app.services.contradiction import detect_contradiction
from app.services.scoring import compute_credibility_score


def analyze_claim_evidence(
    claim_text: str,
    claim_title: Optional[str],
    evidence_items: List[EvidenceBase],
    claim_id: Optional[int] = None,
) -> ProofChainAnalysisResponse:
    """
    Complete analysis pipeline:
    1. Evaluates each piece of evidence against the claim
    2. Calculates semantic similarity and contradiction stance
    3. Synthesizes a sequential proof chain of reasoning steps
    4. Computes aggregate credibility score and final verdict
    """
    title = claim_title or (claim_text[:60] + "..." if len(claim_text) > 60 else claim_text)
    evaluations: List[EvidenceEvaluation] = []
    proof_chain_steps: List[ProofChainStep] = []

    supporting_count = 0
    refuting_count = 0
    neutral_count = 0

    running_score_effect = 0.0

    for idx, ev in enumerate(evidence_items, start=1):
        # 1. Semantic Similarity
        sim_score = calculate_similarity(claim_text, ev.content)

        # 2. Contradiction & Stance Detection
        contra_result = detect_contradiction(claim_text, ev.content, sim_score)
        stance = contra_result["stance"]
        contradiction_score = contra_result["contradiction_score"]
        key_findings = contra_result["reasons"]

        # Track counts
        if stance == "supports":
            supporting_count += 1
            step_impact = "positive"
            delta = +15.0 * ev.reliability_score
        elif stance == "refutes":
            refuting_count += 1
            step_impact = "negative"
            delta = -25.0 * ev.reliability_score * (1.0 + contradiction_score)
        else:
            neutral_count += 1
            step_impact = "neutral"
            delta = 0.0

        eval_obj = EvidenceEvaluation(
            title=ev.title,
            content=ev.content,
            source=ev.source,
            similarity_score=sim_score,
            contradiction_score=contradiction_score,
            stance=stance,
            reliability_score=ev.reliability_score or 0.7,
            key_findings=key_findings,
        )
        evaluations.append(eval_obj)

        # 3. Build ProofChain Step
        proof_chain_steps.append(
            ProofChainStep(
                step_number=idx,
                title=f"Evaluated: {ev.title}",
                description=f"Source [{ev.source or 'Unknown'}] identified stance as '{stance.upper()}'. Similarity: {int(sim_score * 100)}%, Contradiction Risk: {int(contradiction_score * 100)}%.",
                evidence_source=ev.source,
                impact=step_impact,
                confidence_delta=round(delta, 2),
            )
        )

    # 4. Compute Overall Score & Verdict
    eval_dicts = [e.model_dump() for e in evaluations]
    credibility_score, confidence, verdict, metrics = compute_credibility_score(eval_dicts)

    # 5. Synthesize summary reasoning
    summary = (
        f"Analyzed {len(evidence_items)} evidence source(s) against the claim. "
        f"Identified {supporting_count} corroborating, {refuting_count} disputing, "
        f"and {neutral_count} inconclusive source(s). Overall verdict is assessed as '{verdict}' "
        f"with a credibility index of {credibility_score}/100 at {confidence}% system confidence."
    )

    return ProofChainAnalysisResponse(
        claim_id=claim_id,
        claim_title=title,
        verdict=verdict,
        overall_credibility_score=credibility_score,
        overall_confidence=confidence,
        supporting_count=supporting_count,
        refuting_count=refuting_count,
        neutral_count=neutral_count,
        summary_reasoning=summary,
        evidence_evaluations=evaluations,
        proof_chain=proof_chain_steps,
        metadata=metrics,
    )
