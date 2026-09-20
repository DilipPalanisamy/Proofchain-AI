"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Layers,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Info,
  Sliders,
  FileCheck,
  FileX,
  FileQuestion,
  GitBranch,
  Target,
  FileSearch,
  Zap,
  Scale,
  LogOut,
  User,
} from "lucide-react";

import {
  Claim,
  ProofChainAnalysisResponse,
  analyzeClaim,
  fetchClaims,
} from "../../lib/api";
import { ScoreCard } from "../../components/ScoreCard";
import { EvidenceChain } from "../../components/EvidenceChain";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryClaimId = searchParams.get("claimId") || "";
  const [selectedClaimId, setSelectedClaimId] = useState<string>(queryClaimId);
  const [inputClaimId, setInputClaimId] = useState<string>(queryClaimId || "CLM-2026-0011");

  const [claimsList, setClaimsList] = useState<Claim[]>([]);
  const [analysis, setAnalysis] = useState<ProofChainAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // Check demo authentication state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("proofchain_logged_in");
      if (loggedIn !== "true") {
        router.push("/login");
      } else {
        setIsAuthenticated(true);
        setUserEmail(localStorage.getItem("proofchain_user_email") || "demo@proofchain.ai");
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("proofchain_logged_in");
      localStorage.removeItem("proofchain_user_email");
      localStorage.removeItem("proofchain_user_name");
    }
    router.push("/login");
  };

  // Load available claims for quick selection
  useEffect(() => {
    fetchClaims()
      .then((data) => setClaimsList(data))
      .catch((err) => console.warn("Failed to load claims list", err));
  }, []);

  // Run analysis whenever selectedClaimId changes
  useEffect(() => {
    const claimToAnalyze = selectedClaimId.trim() || queryClaimId.trim();
    if (claimToAnalyze) {
      handleRunAnalysis(claimToAnalyze);
    }
  }, [selectedClaimId, queryClaimId]);

  const handleRunAnalysis = async (claimId: string) => {
    if (!claimId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await analyzeClaim(claimId);
      setAnalysis(data);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setErrorMessage(err.message || "Failed to analyze claim evidence package.");
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputClaimId.trim()) {
      setSelectedClaimId(inputClaimId.trim());
      router.push(`/dashboard?claimId=${encodeURIComponent(inputClaimId.trim())}`);
    }
  };

  // Calculate dynamic relevance stats
  const totalEvidence = analysis?.evidence_evaluations?.length || 0;
  const relevantCount =
    analysis?.evidence_evaluations?.filter(
      (e) => e.relevance_classification === "RELEVANT"
    ).length || 0;
  const partialCount =
    analysis?.evidence_evaluations?.filter(
      (e) => e.relevance_classification === "PARTIALLY_RELEVANT"
    ).length || 0;
  const irrelevantCount =
    analysis?.evidence_evaluations?.filter(
      (e) => e.relevance_classification === "IRRELEVANT"
    ).length || 0;

  // Filter significant similarities
  const noticeableSimilarities = (analysis?.similarities || []).filter(
    (s) => s.similarity_score >= 60 || s.relationship === "LIKELY_DUPLICATE" || s.relationship === "HIGHLY_SIMILAR"
  );

  // Filter contradictions
  const activeContradictions = (analysis?.contradictions || []).filter(
    (c) => c.contradiction_score > 0 || c.relationship === "POTENTIAL_CONTRADICTION"
  );

  if (isAuthenticated === null) {
    return (
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "120px 24px",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--accent-cyan)" }} />
        <p style={{ fontSize: "0.9rem" }}>Verifying ProofChain session...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* 1. Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
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
            <Shield size={15} />
            ProofChain AI
          </div>
          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            Evidence Intelligence Dashboard
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Multi-modal evidence evaluation, semantic relevance, contradiction audit, and transparent scoring.
          </p>
        </div>

        {/* Right Header Controls: User & Claim Form */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* User / Logout Control */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
            }}
          >
            <User size={14} color="var(--accent-cyan)" />
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                fontFamily: "monospace",
                maxWidth: "160px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userEmail}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "6px",
                backgroundColor: "rgba(244, 63, 94, 0.12)",
                color: "var(--accent-rose)",
                border: "1px solid rgba(244, 63, 94, 0.25)",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                marginLeft: "4px",
              }}
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>

          {/* Claim Input / Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(18, 24, 38, 0.9)",
              padding: "6px 12px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
            }}
          >
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="e.g. CLM-2026-0011"
            value={inputClaimId}
            onChange={(e) => setInputClaimId(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#ffffff",
              fontSize: "0.88rem",
              fontFamily: "monospace",
              width: "160px",
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: "6px 14px", fontSize: "0.82rem" }}
            disabled={isLoading}
          >
            {isLoading ? <RefreshCw size={14} className="animate-spin" /> : "Analyze"}
          </button>
          </form>
        </div>
      </div>

      {/* Quick Switcher Chips */}
      {claimsList.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "24px",
            fontSize: "0.8rem",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Quick Select:</span>
          {claimsList.slice(0, 6).map((c) => {
            const idStr = c.claim_id || `CLM-2026-${String(c.id).padStart(4, "0")}`;
            const isCurrent = analysis?.claim_id === idStr;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setInputClaimId(idStr);
                  setSelectedClaimId(idStr);
                  router.push(`/dashboard?claimId=${encodeURIComponent(idStr)}`);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  backgroundColor: isCurrent ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.04)",
                  color: isCurrent ? "var(--accent-cyan)" : "var(--text-secondary)",
                  border: isCurrent ? "1px solid var(--accent-cyan)" : "1px solid var(--border-color)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {idStr}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div
          className="glass-panel"
          style={{
            padding: "60px 24px",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <RefreshCw
            size={36}
            color="var(--accent-cyan)"
            style={{ margin: "0 auto 16px", animation: "spin 1.5s linear infinite" }}
          />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: "6px" }}>
            Running ProofChain AI Analysis Pipeline...
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Extracting multimodal facts, calculating semantic relevance, and executing contradiction audits.
          </p>
        </div>
      )}

      {/* Error State */}
      {errorMessage && !isLoading && (
        <div
          className="glass-panel"
          style={{
            padding: "24px",
            marginBottom: "24px",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            backgroundColor: "rgba(244, 63, 94, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--accent-rose)" }}>
            <AlertTriangle size={20} />
            <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>Analysis Request Notice</h4>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "6px" }}>
            {errorMessage}
          </p>
        </div>
      )}

      {/* Main Analysis Display */}
      {analysis && !isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* 2. Claim Header Card */}
          <div
            className="glass-panel"
            style={{
              padding: "22px 26px",
              borderLeft: "4px solid var(--accent-cyan)",
              background: "linear-gradient(180deg, rgba(18, 24, 38, 0.9) 0%, rgba(10, 14, 23, 0.95) 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  className="mono"
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    color: "var(--accent-cyan)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                  }}
                >
                  {analysis.claim_id}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {analysis.evidence_count} Evidence Items Linked
                </span>
              </div>

              {analysis.analyzed_at && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Analyzed: {new Date(analysis.analyzed_at).toLocaleString()}
                </span>
              )}
            </div>

            <h2
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.01em",
                marginBottom: "8px",
              }}
            >
              {analysis.claim_title}
            </h2>

            {analysis.claim_description && (
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {analysis.claim_description}
              </p>
            )}
          </div>

          {/* 3. Main Score Card */}
          <ScoreCard analysis={analysis} />

          {/* 9. Relevance Insight Card */}
          <div
            className="glass-panel"
            style={{
              padding: "22px 26px",
              background: "linear-gradient(180deg, rgba(18, 24, 38, 0.9) 0%, rgba(10, 14, 23, 0.95) 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(168, 85, 247, 0.15)",
                  color: "#c084fc",
                }}
              >
                <Target size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                  Evidence Relevance Insights
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Verification of whether submitted evidence items topically align with the claim assertion
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
                gap: "16px",
                alignItems: "center",
              }}
            >
              {/* Dynamic Text Banner */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Summary Assessment
                </span>
                <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.4 }}>
                  {relevantCount} of {totalEvidence} evidence items are strongly relevant to this claim.
                </p>
              </div>

              {/* Relevant Count */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", fontWeight: 700 }}>
                  RELEVANT
                </span>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent-emerald)" }}>
                  {relevantCount}
                </div>
              </div>

              {/* Partially Relevant Count */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "var(--accent-amber)", fontWeight: 700 }}>
                  PARTIALLY RELEVANT
                </span>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent-amber)" }}>
                  {partialCount}
                </div>
              </div>

              {/* Irrelevant Count */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(244, 63, 94, 0.08)",
                  border: "1px solid rgba(244, 63, 94, 0.25)",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "var(--accent-rose)", fontWeight: 700 }}>
                  IRRELEVANT
                </span>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent-rose)" }}>
                  {irrelevantCount}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Evidence Chain */}
          <EvidenceChain evaluations={analysis.evidence_evaluations} />

          {/* 5 & 6. Duplicate & Contradiction Section Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
              gap: "24px",
            }}
          >
            {/* 5. Duplicate Section */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    color: "var(--accent-cyan)",
                  }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                    Duplicate & Similarity Audit
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Pairwise semantic similarity to detect redundant unverified items
                  </p>
                </div>
              </div>

              {noticeableSimilarities.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  No duplicate artifacts detected across submitted items.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {noticeableSimilarities.map((pair, pIdx) => (
                    <div
                      key={pIdx}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
                            {pair.evidence_a}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>↔</span>
                          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
                            {pair.evidence_b}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            marginTop: "2px",
                            display: "block",
                          }}
                        >
                          {pair.relationship.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent-cyan)" }}>
                          {pair.similarity_score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Contradiction Section */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor:
                      activeContradictions.length > 0
                        ? "rgba(244, 63, 94, 0.15)"
                        : "rgba(16, 185, 129, 0.15)",
                    color:
                      activeContradictions.length > 0
                        ? "var(--accent-rose)"
                        : "var(--accent-emerald)",
                  }}
                >
                  {activeContradictions.length > 0 ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                    Contradiction & Conflict Audit
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Opposing assertions, negation flips, and polar antonym detections
                  </p>
                </div>
              </div>

              {activeContradictions.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "rgba(16, 185, 129, 0.05)",
                    borderRadius: "8px",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "var(--accent-emerald)",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={18} />
                  No direct contradictions detected
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {activeContradictions.map((cPair, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(244, 63, 94, 0.05)",
                        border: "1px solid rgba(244, 63, 94, 0.25)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--accent-rose)", fontWeight: 700 }}>
                            {cPair.evidence_a}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>≠</span>
                          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--accent-rose)", fontWeight: 700 }}>
                            {cPair.evidence_b}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--accent-rose)" }}>
                          Risk: {cPair.contradiction_score}%
                        </span>
                      </div>

                      {cPair.contradictions && cPair.contradictions.length > 0 && (
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                          {cPair.contradictions.join(" ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 8 & 7. Recommendations & Limitations Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
              gap: "24px",
            }}
          >
            {/* 8. Recommendations */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    color: "var(--accent-cyan)",
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                  System Recommendations
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(analysis.recommendations || [analysis.recommendation]).map((rec, rIdx) => (
                  <div
                    key={rIdx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.4,
                      padding: "10px 14px",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <ArrowRight size={14} color="var(--accent-cyan)" style={{ marginTop: "3px", flexShrink: 0 }} />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Limitations */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    color: "var(--accent-amber)",
                  }}
                >
                  <Info size={18} />
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                  Evaluation Limitations & Disclaimers
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(analysis.limitations || []).map((lim, lIdx) => (
                  <div
                    key={lIdx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.4,
                    }}
                  >
                    <span
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        backgroundColor: "var(--accent-amber)",
                        marginTop: "6px",
                        flexShrink: 0,
                      }}
                    />
                    <span>{lim}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 10. Transparency Pipeline Section */}
          <div
            className="glass-panel"
            style={{
              padding: "26px",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              background: "linear-gradient(180deg, rgba(18, 24, 38, 0.95) 0%, rgba(10, 14, 23, 0.98) 100%)",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--accent-cyan)",
                  letterSpacing: "0.08em",
                  marginBottom: "4px",
                }}
              >
                <GitBranch size={14} />
                Audit Trail & Explainability
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#ffffff" }}>
                How ProofChain calculated this
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Deterministic, transparent pipeline transforming raw evidence into verifiable strength scores
              </p>
            </div>

            {/* Pipeline Step Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "12px",
                alignItems: "stretch",
              }}
            >
              {[
                {
                  step: "01",
                  title: "Evidence",
                  desc: "Raw multimodal files & metadata ingested",
                  icon: FileSearch,
                  color: "var(--accent-cyan)",
                },
                {
                  step: "02",
                  title: "AI Extraction",
                  desc: "Gemini models extract structured observable facts",
                  icon: Sparkles,
                  color: "#38bdf8",
                },
                {
                  step: "03",
                  title: "Relevance Detection",
                  desc: "Semantic & keyword alignment against claim",
                  icon: Target,
                  color: "#a855f7",
                },
                {
                  step: "04",
                  title: "Duplicate Detection",
                  desc: "SentenceTransformer checks pairwise redundancy",
                  icon: Layers,
                  color: "#6366f1",
                },
                {
                  step: "05",
                  title: "Contradiction Detection",
                  desc: "Identifies polar clashes & negation flips",
                  icon: AlertTriangle,
                  color: "#f43f5e",
                },
                {
                  step: "06",
                  title: "Quality / Reliability",
                  desc: "Weighted scoring of completeness, diversity & recency",
                  icon: Scale,
                  color: "#10b981",
                },
                {
                  step: "07",
                  title: "Final Strength",
                  desc: "Deterministic score reflecting evidence strength",
                  icon: Shield,
                  color: "#f59e0b",
                },
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: "16px 14px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <span
                          className="mono"
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            color: "var(--text-muted)",
                          }}
                        >
                          {item.step}
                        </span>
                        <IconComponent size={16} color={item.color} />
                      </div>
                      <h5
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "#ffffff",
                          marginBottom: "4px",
                        }}
                      >
                        {item.title}
                      </h5>
                      <p
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.3,
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "80px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Loading Evidence Intelligence Dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
