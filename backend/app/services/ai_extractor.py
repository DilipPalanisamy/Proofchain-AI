import json
import os
from pathlib import Path

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    try:
        import google.generativeai as genai
        types = None
        HAS_GENAI = True
    except ImportError:
        genai = None
        types = None
        HAS_GENAI = False


MODEL_NAME = "gemini-3.7-flash"


def get_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key or not HAS_GENAI:
        return None

    return genai.Client(api_key=api_key)



def analyze_evidence(file_path: str, evidence_type: str):
    """
    Analyze an uploaded evidence file and extract structured facts.
    """

    print(f"[ProofChain AI] Starting AI evidence extraction using model: {MODEL_NAME}")

    client = get_client()

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Evidence file not found: {file_path}"
        )

    prompt = """
You are the evidence-analysis engine for ProofChain AI.

Your job is NOT to decide whether a claim is true.

Your job is to extract observable or explicitly stated facts from the
provided evidence so that another system can evaluate the evidence.

Return ONLY valid JSON.

Use this exact structure:

{
  "summary": "short factual summary",
  "observations": [
    "fact 1",
    "fact 2"
  ],
  "entities": [
    "important entity"
  ],
  "location": "location if explicitly visible or stated, otherwise null",
  "date": "date if explicitly visible or stated, otherwise null",
  "severity": "LOW | MEDIUM | HIGH | UNKNOWN",
  "evidence_type": "VISUAL | DOCUMENT | TEXT",
  "extraction_confidence": 0,
  "limitations": [
    "limitation 1"
  ]
}

Rules:

1. Do not invent facts.
2. Do not assume a location that is not visible or stated.
3. Do not assume a date that is not visible or stated.
4. Clearly separate observations from assumptions.
5. extraction_confidence must be between 0 and 100.
6. If something cannot be determined, use null or UNKNOWN.
7. For images, describe only what can actually be observed.
8. For documents, extract explicitly stated facts.
9. Keep observations concise.
"""

    uploaded_file = client.files.upload(file=str(path))

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[
            uploaded_file,
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response")

    try:
        result = json.loads(response.text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Gemini returned invalid JSON: {response.text}"
        ) from exc

    return result