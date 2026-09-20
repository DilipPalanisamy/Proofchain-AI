export interface Claim {
  id: number;
  claim_id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
}

export interface EvidenceItem {
  id: number;
  evidence_id: string;
  claim_id: string;
  title: string;
  description?: string;
  file_name?: string;
  type?: string;
  evidence_type: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  source?: string;
  location?: string;
  timestamp?: string;
  reliability_score?: number;
  quality_score?: number;
  created_at?: string;
  observable_facts?: string[];
  extraction_confidence?: number;
  extraction_timestamp?: string;
  uploaded_at?: string;
}

export interface EvidenceEvaluation {
  evidence_id: string;
  evidence_title: string;
  evidence_type: string;
  file_name?: string;
  type?: string;
  file_path?: string;
  summary?: string;
  observations?: string[];
  location?: string;
  date?: string;
  severity?: string;
  quality_score?: number;
  reliability_score?: number;
  observable_facts?: string[];
  relevance_score: number;
  relevance_classification: "RELEVANT" | "PARTIALLY_RELEVANT" | "IRRELEVANT";
  relevance_justification?: string;
  relevance_reason?: string;
  extracted_claims?: string[];
  extraction_confidence?: number;
  extraction_timestamp?: string;
  similarity_information?: SimilarityPair[];
}

export interface SimilarityPair {
  evidence_a: string;
  evidence_b: string;
  similarity_score: number;
  relationship: string;
}

export interface ContradictionPair {
  evidence_a: string;
  evidence_b: string;
  contradiction_score: number;
  relationship: string;
  contradictions?: string[];
}

export interface ProofChainAnalysisResponse {
  claim_id: string;
  claim_title: string;
  claim_description?: string;
  evidence_count: number;
  evidence_evaluations: EvidenceEvaluation[];
  similarities: SimilarityPair[];
  contradictions: ContradictionPair[];
  overall_score: number;
  overall_justification: string;
  analyzed_at: string;
  final_score?: number;
  result?: string;
  result_description?: string;
  component_scores?: {
    quality_score?: number;
    reliability_score?: number;
    consistency_score?: number;
    completeness_score?: number;
    diversity_score?: number;
    recency_score?: number;
    relevance_score?: number;
  };
  weighted_contributions?: {
    quality?: number;
    reliability?: number;
    consistency?: number;
    completeness?: number;
    diversity?: number;
    recency?: number;
    relevance_adjustment?: number;
  };
  penalties?: {
    duplicate_penalty: number;
    contradiction_penalty: number;
    total_penalty: number;
  };
  recommendations?: string[];
  recommendation?: string;
  limitations?: string[];
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://proofchain-ai.onrender.com"
    : "http://localhost:8000");

export const backendUrl = BACKEND_URL;

export type EvidenceType = "DOCUMENT" | "IMAGE" | "DATA" | "TEXT" | "OTHER";

export interface AddEvidenceInput {
  claim_id: string | number;
  type: EvidenceType;
  file_name?: string;
  description: string;
  source?: string;
  location?: string;
  reliability_score?: number;
}

export async function fetchClaims(): Promise<Claim[]> {
  const res = await fetch(`${BACKEND_URL}/claims`);
  if (!res.ok) throw new Error(`Failed to fetch claims (${res.status})`);
  return await res.json();
}

export async function createClaim(
  titleOrData: string | { title: string; description?: string; status?: string; idempotency_key?: string },
  description?: string
): Promise<Claim> {
  const title = typeof titleOrData === "string" ? titleOrData : titleOrData.title;
  const desc = typeof titleOrData === "string" ? description : titleOrData.description;

  try {
    const res = await fetch(`${BACKEND_URL}/claims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: desc }),
    });
    if (!res.ok) throw new Error("Failed to create claim");
    return await res.json();
  } catch (err) {
    throw err instanceof Error ? err : new Error("Failed to create claim");
  }
}

export async function addEvidence(input: AddEvidenceInput): Promise<EvidenceItem> {
  try {
    const res = await fetch(`${BACKEND_URL}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, claim_id: String(input.claim_id) }),
    });

    if (!res.ok) {
      throw new Error("Failed to attach evidence");
    }

    return await res.json();
  } catch (err) {
    throw err instanceof Error ? err : new Error("Failed to attach evidence");
  }
}

export async function uploadEvidenceFile(
  claimIdOrFormData: string | number | FormData,
  file?: File,
  title?: string,
  evidenceType?: string
): Promise<EvidenceItem> {
  try {
    let body: FormData;
    let claimIdStr = "CLM-2026-0011";

    if (claimIdOrFormData instanceof FormData) {
      body = claimIdOrFormData;
      claimIdStr = (body.get("claim_id") as string) || claimIdStr;
    } else {
      body = new FormData();
      if (file) body.append("file", file);
      if (title) body.append("title", title);
      if (evidenceType) body.append("evidence_type", evidenceType);
      claimIdStr = String(claimIdOrFormData);
    }

    const res = await fetch(`${BACKEND_URL}/evidence/upload`, {
      method: "POST",
      body,
    });
    if (!res.ok) throw new Error("Failed to upload evidence file");
    return await res.json();
  } catch (err) {
    throw err instanceof Error ? err : new Error("Failed to upload evidence file");
  }
}

export async function fetchClaimEvidence(claimId: string | number): Promise<EvidenceItem[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/claims/${encodeURIComponent(String(claimId))}/evidence`);
    if (!res.ok) throw new Error("Failed to fetch evidence");
    return await res.json();
  } catch (err) {
    throw err instanceof Error ? err : new Error("Failed to fetch evidence");
  }
}

export async function analyzeIndividualEvidence(evidenceId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/ai/evidence/${encodeURIComponent(evidenceId)}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to run AI extraction");
    return await res.json();
  } catch {
    throw new Error("AI evidence analysis is unavailable. Start the backend and try again.");
  }
}

export async function seedDemoClaim(): Promise<Claim> {
  try {
    const res = await fetch(`${BACKEND_URL}/claims/demo/seed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to seed demo claim");
    return await res.json();
  } catch (err) {
    throw err instanceof Error ? err : new Error("Failed to seed demo claim");
  }
}

export async function analyzeClaim(claimId: string): Promise<ProofChainAnalysisResponse> {
  const encodedId = encodeURIComponent(claimId);
  let lastError = "Evidence package analysis is unavailable.";

  // Endpoint 1: POST /analysis/claim/{claimId}
  try {
    const res1 = await fetch(`${BACKEND_URL}/analysis/claim/${encodedId}`, { method: "POST" });
    if (res1.ok) return await res1.json();
    const body = await res1.json().catch(() => null);
    lastError = body?.detail || `Analysis failed with status ${res1.status}.`;
  } catch (err) {
    console.warn("POST /analysis/claim/ failed, trying GET /claims/analyze", err);
  }

  // Endpoint 2: GET /claims/{claimId}/analyze
  try {
    const res2 = await fetch(`${BACKEND_URL}/claims/${encodedId}/analyze`);
    if (res2.ok) return await res2.json();
    const body = await res2.json().catch(() => null);
    lastError = body?.detail || lastError;
  } catch (err) {
    console.warn("GET /claims/analyze failed, using local offline fallback analysis", err);
  }

  // Endpoint 3: POST /claims/{claimId}/analyze
  try {
    const res3 = await fetch(`${BACKEND_URL}/claims/${encodedId}/analyze`, { method: "POST" });
    if (res3.ok) return await res3.json();
    const body = await res3.json().catch(() => null);
    lastError = body?.detail || lastError;
  } catch (err) {
    console.warn("POST /claims/analyze failed", err);
  }

  throw new Error(lastError);
}
