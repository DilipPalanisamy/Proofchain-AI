import re
from typing import Dict, List, Any
from app.services.similarity import get_model

STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers",
    "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've",
    "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more",
    "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only",
    "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
    "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than",
    "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd",
    "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where",
    "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't",
    "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
    "yourself", "yourselves"
}


def _tokenize(text: str) -> List[str]:
    """Normalize and extract alphanumeric words."""
    if not text:
        return []
    text = text.lower()
    return re.findall(r"\b[a-z0-9_]+\b", text)


def _get_meaningful_keywords(text: str) -> set:
    words = _tokenize(text)
    return {w for w in words if w not in STOP_WORDS and len(w) > 2}


def calculate_relevance(
    claim_title: str,
    claim_description: str,
    evidence_summary: str,
    evidence_observations: list
) -> dict:
    """
    Evaluates whether an evidence item is topically relevant to the claim.

    Formula:
        semantic_score = cosine_similarity converted to 0-100
        keyword_score = percentage of meaningful claim keywords appearing in evidence
        relevance_score = (semantic_score * 0.75) + (keyword_score * 0.25)
    """
    limitations: List[str] = []

    claim_title = (claim_title or "").strip()
    claim_description = (claim_description or "").strip()
    evidence_summary = (evidence_summary or "").strip()
    observations = [
        str(o).strip()
        for o in (evidence_observations or [])
        if str(o).strip()
    ]

    claim_text = f"{claim_title}. {claim_description}".strip()
    obs_combined = " ".join(observations)
    evidence_text = f"{evidence_summary}. {obs_combined}".strip()

    if not claim_text or not evidence_text:
        return {
            "relevance_score": 0.0,
            "classification": "IRRELEVANT",
            "reason": "Missing claim description or evidence content for relevance analysis.",
            "matched_terms": [],
            "limitations": ["Insufficient text content provided to evaluate relevance."],
        }

    # 1. Semantic similarity via sentence-transformers
    try:
        model = get_model()
        embeddings = model.encode(
            [claim_text, evidence_text],
            normalize_embeddings=True,
        )
        cos_sim = float(embeddings[0] @ embeddings[1])
        # Convert [-1, 1] to [0, 100]
        semantic_score = ((cos_sim + 1) / 2) * 100.0
    except Exception as exc:
        semantic_score = 50.0
        limitations.append(f"Semantic embedding calculation failed: {str(exc)}")

    # 2. Keyword overlap
    claim_kw = _get_meaningful_keywords(claim_text)
    evidence_kw = _get_meaningful_keywords(evidence_text)

    if claim_kw:
        matched = sorted(list(claim_kw.intersection(evidence_kw)))
        keyword_score = (len(matched) / len(claim_kw)) * 100.0
    else:
        matched = []
        keyword_score = 50.0
        limitations.append("Claim contains minimal distinctive keywords.")

    # 3. Combine into composite relevance score
    raw_score = (semantic_score * 0.75) + (keyword_score * 0.25)
    relevance_score = round(max(0.0, min(100.0, raw_score)), 2)

    # 4. Classification (80-100 = RELEVANT, 50-79 = PARTIALLY_RELEVANT, 0-49 = IRRELEVANT)
    if relevance_score >= 80.0:
        classification = "RELEVANT"
        if matched:
            reason = f"High topical alignment with claim context; matched key terms: {', '.join(matched[:5])}."
        else:
            reason = "High semantic contextual alignment with claim subject matter."
    elif relevance_score >= 50.0:
        classification = "PARTIALLY_RELEVANT"
        if matched:
            reason = f"Moderate topical overlap with claim context; matched terms: {', '.join(matched[:5])}."
        else:
            reason = "Moderate semantic similarity to claim; partial topical relation."
    else:
        classification = "IRRELEVANT"
        reason = "Low topical and semantic alignment with the claim subject matter."

    return {
        "relevance_score": relevance_score,
        "classification": classification,
        "reason": reason,
        "matched_terms": matched,
        "limitations": limitations,
    }
