from sentence_transformers import SentenceTransformer
from typing import Dict


MODEL_NAME = "all-MiniLM-L6-v2"

_model = None


def get_model():
    global _model

    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)

    return _model


def calculate_similarity(text1: str, text2: str) -> Dict:
    """
    Calculate semantic similarity between two pieces of evidence.
    """

    if not text1 or not text2:
        return {
            "similarity_score": 0.0,
            "relationship": "INSUFFICIENT_DATA",
        }

    model = get_model()

    embeddings = model.encode(
        [text1, text2],
        normalize_embeddings=True,
    )

    similarity = float(embeddings[0] @ embeddings[1])

    # Convert [-1, 1] to [0, 100]
    score = ((similarity + 1) / 2) * 100

    score = round(score, 2)

    if score >= 90:
        relationship = "LIKELY_DUPLICATE"
    elif score >= 70:
        relationship = "HIGHLY_SIMILAR"
    elif score >= 45:
        relationship = "PARTIALLY_SIMILAR"
    else:
        relationship = "DIFFERENT"

    return {
        "similarity_score": score,
        "relationship": relationship,
    }