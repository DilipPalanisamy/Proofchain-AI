import re
from typing import Dict, List


NEGATION_WORDS = {
    "no",
    "not",
    "never",
    "none",
    "without",
    "absent",
    "missing",
    "false",
    "doesn't",
    "doesnt",
    "isn't",
    "isnt",
    "wasn't",
    "wasnt",
    "cannot",
    "can't",
    "cant",
}


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def words(text: str) -> set:
    return set(normalize(text).split())


def contradiction_score(text1: str, text2: str) -> Dict:
    """
    Detect simple factual contradictions between two evidence descriptions.

    This is intentionally transparent:
    - identifies shared subject terms
    - checks opposing negation patterns
    - reports the reason instead of hiding the decision
    """

    if not text1 or not text2:
        return {
            "contradiction_score": 0.0,
            "relationship": "INSUFFICIENT_DATA",
            "contradictions": [],
        }

    original1 = text1
    original2 = text2

    w1 = words(text1)
    w2 = words(text2)

    shared_words = w1.intersection(w2)

    # Remove generic words that don't provide useful evidence.
    stop_words = {
        "the", "a", "an", "is", "are", "was", "were",
        "this", "that", "there", "near", "with",
        "and", "or", "of", "to", "in", "on", "at",
        "has", "have", "had", "very"
    }

    meaningful_shared = {
        word for word in shared_words
        if word not in stop_words and len(word) > 2
    }

    neg1 = bool(w1.intersection(NEGATION_WORDS))
    neg2 = bool(w2.intersection(NEGATION_WORDS))

    contradictions: List[str] = []

    # Strongest simple signal:
    # both statements discuss the same subject but one contains negation.
    if meaningful_shared and neg1 != neg2:
        contradictions.append(
            "The evidence statements share important subject terms "
            "but differ in negation."
        )

    # Explicit opposing phrases.
    positive_patterns = [
        r"\bvisible\b",
        r"\bpresent\b",
        r"\bexists\b",
        r"\bexisting\b",
        r"\bhas\b",
        r"\bcontains\b",
        r"\bshows\b",
    ]

    negative_patterns = [
        r"\bnot visible\b",
        r"\bnot present\b",
        r"\bdoes not exist\b",
        r"\bdoesn't exist\b",
        r"\bno damage\b",
        r"\bno issue\b",
        r"\bno problem\b",
        r"\bwithout damage\b",
    ]

    positive1 = any(re.search(p, normalize(original1)) for p in positive_patterns)
    positive2 = any(re.search(p, normalize(original2)) for p in positive_patterns)

    negative1 = any(re.search(p, normalize(original1)) for p in negative_patterns)
    negative2 = any(re.search(p, normalize(original2)) for p in negative_patterns)

    if meaningful_shared and (
        (positive1 and negative2)
        or
        (negative1 and positive2)
    ):
        contradictions.append(
            "One evidence statement indicates presence while the other "
            "indicates absence."
        )

    if contradictions:
        score = 85.0
        relationship = "POTENTIAL_CONTRADICTION"
    else:
        score = 0.0
        relationship = "NO_DIRECT_CONTRADICTION"

    return {
        "contradiction_score": score,
        "relationship": relationship,
        "contradictions": contradictions,
        "shared_terms": sorted(meaningful_shared),
    }
def detect_contradiction(text1: str, text2: str) -> Dict:
    return contradiction_score(text1, text2)