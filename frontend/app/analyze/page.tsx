"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Database,
  Search,
  RefreshCw,
  Plus,
  Play,
  FileCheck,
  AlertTriangle,
  Info,
  Calendar,
  MapPin,
  Flame,
  Scale,
} from "lucide-react";

import {
  Claim,
  EvidenceItem,
  createClaim,
  uploadEvidenceFile,
  fetchClaimEvidence,
  analyzeIndividualEvidence,
  analyzeClaim,
  seedDemoClaim,
} from "../../lib/api";

interface UploadedEvidenceState extends EvidenceItem {
  uploadStatus: "uploaded" | "uploading" | "failed";
  errorMessage?: string;
  isAiAnalyzing?: boolean;
  aiAnalysisResult?: {
    summary?: string;
    observations?: string[];
    entities?: string[];
    location?: string | null;
    date?: string | null;
    severity?: string | null;
    extraction_confidence?: number;
    limitations?: string[];
  };
  aiAnalysisError?: string;
}

export default function AnalyzePage() {
  const router = useRouter();

  // Authentication check
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("proofchain_logged_in");
      if (loggedIn !== "true") {
        router.push("/login?redirect=/analyze");
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  // Workflow state
  const [claimTitle, setClaimTitle] = useState("");
  const [claimDescription, setClaimDescription] = useState("");
  const [isCreatingClaim, setIsCreatingClaim] = useState(false);
  const [activeClaim, setActiveClaim] = useState<Claim | null>(null);

  // Evidence upload state
  const [evidenceItems, setEvidenceItems] = useState<UploadedEvidenceState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // ProofChain Analysis execution state
  const [isRunningProofChain, setIsRunningProofChain] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalNotice, setGlobalNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing evidence when active claim changes
  const refreshEvidence = async (claimId: string | number) => {
    try {
      const items = await fetchClaimEvidence(claimId);
      setEvidenceItems((prev) => {
        // Merge with existing local analysis results if available
        const map = new Map(prev.map((i) => [i.evidence_id || String(i.id), i]));
        return items.map((it) => {
          const key = it.evidence_id || String(it.id);
          const existing = map.get(key);
          return {
            ...it,
            uploadStatus: "uploaded",
            aiAnalysisResult: existing?.aiAnalysisResult,
          };
        });
      });
    } catch (err) {
      console.warn("Could not fetch evidence list", err);
    }
  };

  // 1. Create Claim
  const handleCreateClaim = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!claimTitle.trim() || !claimDescription.trim()) {
      setGlobalError("Please provide both a Claim Title and Claim Description.");
      return;
    }

    setIsCreatingClaim(true);
    setGlobalError(null);
    setGlobalNotice(null);

    try {
      const claim = await createClaim({
        title: claimTitle.trim(),
        description: claimDescription.trim(),
        status: "pending",
        idempotency_key: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      });

      setActiveClaim(claim);
      setGlobalNotice(`Claim created successfully with ID: ${claim.claim_id || `CLM-2026-${String(claim.id).padStart(4, "0")}`}`);
      await refreshEvidence(claim.claim_id || claim.id);
    } catch (err: any) {
      console.error("Create claim failed:", err);
      if (err?.message === "Failed to fetch") {
        setGlobalNotice("Backend service offline. Using local investigation pipeline.");
      } else {
        setGlobalError(err?.message || "Failed to create claim.");
      }
    } finally {
      setIsCreatingClaim(false);
    }
  };

  // 8. Try Demo Claim
  const handleTryDemoClaim = async () => {
    setIsCreatingClaim(true);
    setGlobalError(null);
    setGlobalNotice(null);

    try {
      const demoClaim = await seedDemoClaim();
      setActiveClaim(demoClaim);
      setClaimTitle(demoClaim.title);
      setClaimDescription(demoClaim.description || "");

      setGlobalNotice(
        `Demo claim loaded: "${demoClaim.title}". Includes both relevant road damage items and unrelated documentation to test relevance filtering.`
      );
      await refreshEvidence(demoClaim.claim_id || demoClaim.id);
    } catch (err: any) {
      console.error("Demo seed failed:", err);
      if (err?.message === "Failed to fetch") {
        setGlobalNotice("Backend service offline. Loaded demo claim in offline mode.");
      } else {
        setGlobalError(err?.message || "Failed to load demo claim.");
      }
    } finally {
      setIsCreatingClaim(false);
    }
  };

  // 2. Upload Evidence Files
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !activeClaim) return;

    const claimIdentifier = activeClaim.claim_id || String(activeClaim.id);
    setIsUploading(true);
    setGlobalError(null);

    const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf", ".txt", ".docx"];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = "." + (file.name.split(".").pop() || "").toLowerCase();

      if (!allowedExtensions.includes(ext)) {
        setGlobalError(
          `File "${file.name}" has an unsupported format (${ext}). Supported: PNG, JPG, JPEG, PDF, TXT, DOCX.`
        );
        continue;
      }

      // Prepare optimistic state
      const tempId = `TEMP-${Date.now()}-${i}`;
      const tempItem: UploadedEvidenceState = {
        id: Math.floor(Math.random() * 10000),
        evidence_id: tempId,

        claim_id: claimIdentifier,
        evidence_type: ext.includes("png") || ext.includes("jpg") || ext.includes("jpeg") ? "IMAGE" : "DOCUMENT",
        title: file.name,

        description: `Uploaded file ${file.name}`,
        uploadStatus: "uploading",
      };

      setEvidenceItems((prev) => [tempItem, ...prev]);

      try {
        const formData = new FormData();
        formData.append("claim_id", claimIdentifier);
        formData.append("file", file);
        formData.append("description", `Artifact: ${file.name}`);
        formData.append("source", "Direct File Upload");
        formData.append("reliability_score", "85");

        const uploaded = await uploadEvidenceFile(formData);

        // Replace temp item with uploaded backend record
        setEvidenceItems((prev) =>
          prev.map((item) =>
            item.evidence_id === tempId
              ? {
                  ...uploaded,
                  uploadStatus: "uploaded",
                }
              : item
          )
        );
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}:`, err);
        setEvidenceItems((prev) =>
          prev.map((item) =>
            item.evidence_id === tempId
              ? {
                  ...item,
                  uploadStatus: "failed",
                  errorMessage: err.message || "Upload failed",
                }
              : item
          )
        );
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 3. Analyze Individual Evidence Item (POST /ai/evidence/{evidence_id})
  const handleAnalyzeEvidence = async (evidenceId: string) => {
    if (!evidenceId) return;

    setEvidenceItems((prev) =>
      prev.map((item) =>
        (item.evidence_id === evidenceId || String(item.id) === evidenceId)
          ? { ...item, isAiAnalyzing: true, aiAnalysisError: undefined }
          : item
      )
    );

    try {
      const response = await analyzeIndividualEvidence(evidenceId);
      const aiResult = response.ai_analysis || response;

      setEvidenceItems((prev) =>
        prev.map((item) =>
          (item.evidence_id === evidenceId || String(item.id) === evidenceId)
            ? {
                ...item,
                isAiAnalyzing: false,
                aiAnalysisResult: aiResult,
              }
            : item
        )
      );
    } catch (err: any) {
      console.error(`AI analysis failed for ${evidenceId}:`, err);
      setEvidenceItems((prev) =>
        prev.map((item) =>
          (item.evidence_id === evidenceId || String(item.id) === evidenceId)
            ? {
                ...item,
                isAiAnalyzing: false,
                aiAnalysisError: err.message || "AI extraction failed on file.",
              }
            : item
        )
      );
    }
  };

  // 4. Run ProofChain Analysis (POST /analysis/claim/{claim_id})
  const handleRunProofChain = async () => {
    if (!activeClaim) return;
    const claimIdentifier = activeClaim.claim_id || String(activeClaim.id);

    if (evidenceItems.length === 0) {
      setGlobalError("At least one evidence item is required to run ProofChain analysis.");
      return;
    }

    setIsRunningProofChain(true);
    setGlobalError(null);

    try {
      const analysisData = await analyzeClaim(claimIdentifier);
      // 5. Navigate to Dashboard automatically with actual response
      const targetId = analysisData.claim_id || claimIdentifier;
      router.push(`/dashboard?claimId=${encodeURIComponent(targetId)}`);
    } catch (err: any) {
      console.error("ProofChain analysis failed:", err);
      setGlobalError(err.message || "ProofChain analysis failed. Verify backend services.");
      setIsRunningProofChain(false);
    }
  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "16px",
          color: "var(--text-secondary)",
        }}
      >
        <Loader2 size={32} className="animate-spin" color="var(--accent-cyan)" />
        <p style={{ fontSize: "0.95rem" }}>Verifying session & loading investigation workspace...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "36px 24px 80px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent-cyan)",
              marginBottom: "4px",
            }}
          >
            <ShieldCheck size={16} />
            ProofChain Investigation Pipeline
          </div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
            Create Evidence Investigation
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Ingest claims, upload multimodal evidence, run AI extractions, and compute verifiable proof chains.
          </p>
        </div>

        {/* Try Demo Claim Button */}
        <button
          type="button"
          onClick={handleTryDemoClaim}
          disabled={isCreatingClaim || isRunningProofChain}
          className="btn-secondary"
          style={{
            fontSize: "0.85rem",
            padding: "8px 16px",
            borderColor: "rgba(168, 85, 247, 0.4)",
            color: "#c084fc",
          }}
        >
          <Sparkles size={15} color="#c084fc" /> Try Demo Claim
        </button>
      </div>

      {/* Global Notifications */}
      {globalNotice && (
        <div
          className="glass-panel"
          style={{
            padding: "14px 18px",
            marginBottom: "24px",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            color: "var(--accent-emerald)",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{globalNotice}</span>
        </div>
      )}

      {globalError && (
        <div
          className="glass-panel"
          style={{
            padding: "14px 18px",
            marginBottom: "24px",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            backgroundColor: "rgba(244, 63, 94, 0.08)",
            color: "var(--accent-rose)",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertTriangle size={18} />
          <span>{globalError}</span>
        </div>
      )}

      {/* STEP 1: CREATE CLAIM CARD */}
      <div
        className="glass-panel"
        style={{
          padding: "28px",
          marginBottom: "32px",
          borderLeft: activeClaim ? "4px solid var(--accent-emerald)" : "4px solid var(--accent-cyan)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: activeClaim ? "var(--accent-emerald)" : "var(--accent-cyan)",
                color: "#07090e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.85rem",
              }}
            >
              1
            </span>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff" }}>
                Claim Definition
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Specify the factual proposition to be audited and scored
              </p>
            </div>
          </div>

          {activeClaim && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                className="mono"
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "var(--accent-emerald)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                {activeClaim.claim_id || `CLM-2026-${String(activeClaim.id).padStart(4, "0")}`}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", fontWeight: 700 }}>
                ACTIVE
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleCreateClaim} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "var(--text-secondary)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Claim Title
            </label>
            <input
              type="text"
              placeholder="e.g. Damaged road near school"
              value={claimTitle}
              onChange={(e) => setClaimTitle(e.target.value)}
              disabled={isCreatingClaim || isRunningProofChain}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "rgba(10, 14, 23, 0.8)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "var(--text-secondary)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Claim Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the context, location, and specific assertion..."
              value={claimDescription}
              onChange={(e) => setClaimDescription(e.target.value)}
              disabled={isCreatingClaim || isRunningProofChain}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "rgba(10, 14, 23, 0.8)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.9rem",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <button
              type="submit"
              disabled={isCreatingClaim || isRunningProofChain || !claimTitle.trim()}
              className="btn-primary"
              style={{ padding: "10px 22px", fontSize: "0.9rem" }}
            >
              {isCreatingClaim ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating Claim...
                </>
              ) : activeClaim ? (
                <>
                  <RefreshCw size={16} /> Update / Create New Claim
                </>
              ) : (
                <>
                  <Plus size={16} /> Create Claim
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* STEP 2 & 3: EVIDENCE UPLOAD & LIST */}
      {activeClaim && (
        <div
          className="glass-panel"
          style={{
            padding: "28px",
            marginBottom: "32px",
            borderLeft: "4px solid var(--accent-indigo)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-indigo)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                }}
              >
                2
              </span>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff" }}>
                  Add Evidence Artifacts
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Upload multiple multimodal artifacts (PNG, JPG, JPEG, PDF, TXT, DOCX)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refreshEvidence(activeClaim.claim_id || activeClaim.id)}
              className="btn-secondary"
              style={{ fontSize: "0.78rem", padding: "6px 12px" }}
            >
              <RefreshCw size={13} /> Refresh List
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            style={{
              padding: "36px 24px",
              borderRadius: "12px",
              border: dragActive ? "2px dashed var(--accent-cyan)" : "2px dashed rgba(255, 255, 255, 0.15)",
              backgroundColor: dragActive ? "rgba(56, 189, 248, 0.08)" : "rgba(0, 0, 0, 0.25)",
              textAlign: "center",
              cursor: "pointer",
              marginBottom: "28px",
              transition: "all 0.2s ease",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf,.txt,.docx"
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <Upload size={36} color="var(--accent-cyan)" style={{ margin: "0 auto 12px" }} />
            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff", marginBottom: "4px" }}>
              {isUploading ? "Uploading Evidence Files..." : "Click or Drag Evidence Files Here"}
            </h4>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Supported: PNG, JPG, JPEG, PDF, TXT, DOCX. Multi-file selection supported.
            </p>
          </div>

          {/* STEP 3: EVIDENCE LIST & AI EXTRACTION CARDS */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Attached Evidence Items ({evidenceItems.length})
              </h4>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Click "Analyze Evidence" on any artifact to extract structured AI observations
              </span>
            </div>

            {evidenceItems.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-color)",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                No evidence items attached to this claim yet. Use the upload area above or load the demo claim.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {evidenceItems.map((item, idx) => {
                  const evId = item.evidence_id || `EVD-${item.id || idx}`;
                  const isAnalyzing = item.isAiAnalyzing;
                  const aiResult = item.aiAnalysisResult;

                  return (
                    <div
                      key={evId || idx}
                      className="glass-panel"
                      style={{
                        padding: "18px 20px",
                        backgroundColor: "rgba(10, 14, 23, 0.75)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "10px",
                      }}
                    >
                      {/* Evidence Card Top Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "10px",
                          marginBottom: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            className="mono"
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 800,
                              color: "var(--accent-cyan)",
                              backgroundColor: "rgba(56, 189, 248, 0.12)",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                            }}
                          >
                            {evId}
                          </span>

                          <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "#ffffff" }}>
                            {item.file_name || item.description || `Evidence Record #${idx + 1}`}
                          </span>

                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {item.type}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: item.uploadStatus === "failed" ? "var(--accent-rose)" : "var(--accent-emerald)",
                            }}
                          >
                            {item.uploadStatus === "failed" ? (
                              <>
                                <AlertCircle size={14} /> Upload Failed
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={14} /> Ready
                              </>
                            )}
                          </span>

                          {/* Analyze Evidence Button */}
                          <button
                            type="button"
                            onClick={() => handleAnalyzeEvidence(evId)}
                            disabled={isAnalyzing || item.uploadStatus === "failed" || isRunningProofChain}
                            className="btn-secondary"
                            style={{
                              fontSize: "0.78rem",
                              padding: "5px 12px",
                              backgroundColor: aiResult ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.05)",
                              borderColor: aiResult ? "var(--accent-cyan)" : "var(--border-color)",
                            }}
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 size={13} className="animate-spin" /> Extracting Facts...
                              </>
                            ) : aiResult ? (
                              <>
                                <Sparkles size={13} color="var(--accent-cyan)" /> Re-Analyze
                              </>
                            ) : (
                              <>
                                <Sparkles size={13} /> Analyze Evidence
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Error if AI failed */}
                      {item.aiAnalysisError && (
                        <div
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "rgba(244, 63, 94, 0.08)",
                            border: "1px solid rgba(244, 63, 94, 0.25)",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            color: "var(--accent-rose)",
                            marginTop: "8px",
                          }}
                        >
                          {item.aiAnalysisError}
                        </div>
                      )}

                      {/* Real Gemini Response Breakdown */}
                      {aiResult && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "14px 16px",
                            backgroundColor: "rgba(0, 0, 0, 0.35)",
                            border: "1px solid rgba(56, 189, 248, 0.2)",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                color: "var(--accent-cyan)",
                                letterSpacing: "0.06em",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Sparkles size={12} /> Real Gemini AI Extraction
                            </span>

                            {aiResult.extraction_confidence !== undefined && (
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-emerald)" }}>
                                Confidence: {aiResult.extraction_confidence}%
                              </span>
                            )}
                          </div>

                          {/* Summary */}
                          {aiResult.summary && (
                            <p style={{ fontSize: "0.85rem", color: "#ffffff", lineHeight: 1.4, marginBottom: "8px" }}>
                              <strong>Summary:</strong> {aiResult.summary}
                            </p>
                          )}

                          {/* Observations */}
                          {aiResult.observations && aiResult.observations.length > 0 && (
                            <div style={{ marginBottom: "8px" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
                                Observations:
                              </span>
                              <ul style={{ paddingLeft: "18px", marginTop: "4px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                {aiResult.observations.map((obs, oIdx) => (
                                  <li key={oIdx}>{obs}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Entities, Location, Date, Severity Badges */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "10px",
                              fontSize: "0.75rem",
                              marginTop: "10px",
                              paddingTop: "8px",
                              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                            }}
                          >
                            {aiResult.location && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
                                <MapPin size={12} color="var(--accent-cyan)" /> {aiResult.location}
                              </span>
                            )}

                            {aiResult.date && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
                                <Calendar size={12} color="var(--accent-cyan)" /> {aiResult.date}
                              </span>
                            )}

                            {aiResult.severity && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontWeight: 700,
                                  color: aiResult.severity === "HIGH" ? "var(--accent-rose)" : "var(--accent-amber)",
                                }}
                              >
                                <Flame size={12} /> Severity: {aiResult.severity}
                              </span>
                            )}

                            {aiResult.entities && aiResult.entities.length > 0 && (
                              <span style={{ color: "var(--text-muted)" }}>
                                Entities: {aiResult.entities.join(", ")}
                              </span>
                            )}
                          </div>

                          {/* Limitations */}
                          {aiResult.limitations && aiResult.limitations.length > 0 && (
                            <div style={{ marginTop: "8px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                              <em>Limitations: {aiResult.limitations.join("; ")}</em>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: RUN PROOFCHAIN ANALYSIS PROMINENT ACTION */}
      {activeClaim && (
        <div
          className="glass-panel"
          style={{
            padding: "28px",
            textAlign: "center",
            background: "linear-gradient(180deg, rgba(18, 24, 38, 0.95) 0%, rgba(10, 14, 23, 0.98) 100%)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            boxShadow: "0 10px 30px -10px rgba(56, 189, 248, 0.2)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent-cyan)",
              marginBottom: "8px",
            }}
          >
            <Scale size={16} /> Complete Verification Step
          </div>

          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", marginBottom: "8px" }}>
            Ready to Synthesize the Evidence Chain?
          </h3>

          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto 20px" }}>
            Execute multi-evidence pairwise similarity, contradiction audits, topic relevance calculations, and deterministic ProofChain strength scoring.
          </p>

          <button
            type="button"
            onClick={handleRunProofChain}
            disabled={isRunningProofChain || evidenceItems.length === 0}
            className="btn-primary"
            style={{
              padding: "14px 36px",
              fontSize: "1.05rem",
              fontWeight: 800,
              letterSpacing: "0.02em",
              boxShadow: "0 4px 25px rgba(56, 189, 248, 0.35)",
            }}
          >
            {isRunningProofChain ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Analyzing evidence chain...
              </>
            ) : (
              <>
                <Play size={20} fill="#ffffff" /> Run ProofChain Analysis
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
