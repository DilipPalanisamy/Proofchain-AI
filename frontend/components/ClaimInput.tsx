"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, CheckCircle2, FileText, Copy, Loader2, AlertCircle, PlusCircle } from "lucide-react";
import { createClaim, Claim } from "../lib/api";

interface ClaimInputProps {
  onClaimCreated?: (claim: Claim) => void;
}

const SAMPLE_CLAIMS = [
  {
    title: "Waterlogging during heavy rainfall",
    description:
      "This location repeatedly experiences waterlogging during heavy rainfall due to inadequate storm drainage capacity.",
  },
  {
    title: "Damaged road near school",
    description:
      "Severe potholes and broken asphalt near the primary school entrance pose hazard to pedestrian traffic.",
  },
  {
    title: "Quantum Computer Factorization of RSA-2048",
    description:
      "A research laboratory demonstrated that an engineered 1,000-qubit quantum processor successfully factored RSA-2048 in polynomial time.",
  },
];

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `key_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export const ClaimInput: React.FC<ClaimInputProps> = ({ onClaimCreated }) => {
  const [title, setTitle] = useState("Waterlogging during heavy rainfall");
  const [description, setDescription] = useState(
    "This location repeatedly experiences waterlogging during heavy rainfall."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdClaim, setCreatedClaim] = useState<Claim | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Synchronous ref protection against rapid synchronous clicks & idempotency key
  const isRequestInFlightRef = useRef(false);
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey());

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (createdClaim) {
      setCreatedClaim(null);
      idempotencyKeyRef.current = generateIdempotencyKey();
    }
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (createdClaim) {
      setCreatedClaim(null);
      idempotencyKeyRef.current = generateIdempotencyKey();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard: Prevent double-submission synchronously
    if (isRequestInFlightRef.current || isSubmitting || createdClaim) {
      return;
    }

    if (!title.trim() || !description.trim()) {
      setErrorMsg("Please fill in both the Claim Title and Description.");
      return;
    }

    isRequestInFlightRef.current = true;
    setIsSubmitting(true);
    setErrorMsg(null);

    const currentKey = idempotencyKeyRef.current || generateIdempotencyKey();

    try {
      const result = await createClaim({
        title: title.trim(),
        description: description.trim(),
        status: "pending",
        idempotency_key: currentKey,
      });

      setCreatedClaim(result);
      if (onClaimCreated) {
        onClaimCreated(result);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit claim to backend.");
    } finally {
      isRequestInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle("");
    setDescription("");
    setCreatedClaim(null);
    setErrorMsg(null);
    idempotencyKeyRef.current = generateIdempotencyKey();
  };

  const handleCopyId = () => {
    if (!createdClaim?.claim_id) return;
    navigator.clipboard.writeText(createdClaim.claim_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadSample = (sample: { title: string; description: string }) => {
    setTitle(sample.title);
    setDescription(sample.description);
    setCreatedClaim(null);
    setErrorMsg(null);
    idempotencyKeyRef.current = generateIdempotencyKey();
  };

  const isButtonDisabled = isSubmitting || !!createdClaim;

  return (
    <div className="glass-panel" style={{ padding: "28px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(56, 189, 248, 0.15)",
              color: "var(--accent-cyan)",
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff" }}>
              Submit Claim to ProofChain
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Ingest a new factual assertion with duplicate & idempotency protection
            </p>
          </div>
        </div>

        {/* Sample Selectors */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            <Sparkles size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
            Load Sample:
          </span>
          {SAMPLE_CLAIMS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadSample(sample)}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "0.72rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-cyan)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#fecdd3",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "18px",
            fontSize: "0.85rem",
          }}
        >
          <AlertCircle size={18} color="var(--accent-rose)" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Banner */}
      {createdClaim && (
        <div
          style={{
            padding: "20px",
            borderRadius: "12px",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            marginBottom: "24px",
            boxShadow: "0 4px 20px rgba(16, 185, 129, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <CheckCircle2 size={24} color="var(--accent-emerald)" />
              <div>
                <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>
                  Claim Successfully Registered
                </h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Persisted to SQLite database with verified unique reference
                </p>
              </div>
            </div>

            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                color: "var(--accent-emerald)",
              }}
            >
              STATUS: {createdClaim.status}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(7, 9, 14, 0.6)",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                Claim Reference ID
              </span>
              <span
                className="mono"
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  color: "var(--accent-cyan)",
                  letterSpacing: "0.05em",
                }}
              >
                {createdClaim.claim_id || `CLM-2026-${String(createdClaim.id).padStart(4, "0")}`}
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={handleCopyId}
                className="btn-secondary"
                style={{ fontSize: "0.78rem", padding: "6px 12px" }}
              >
                <Copy size={14} /> {copied ? "Copied!" : "Copy ID"}
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="btn-secondary"
                style={{ fontSize: "0.78rem", padding: "6px 12px", borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }}
              >
                <PlusCircle size={14} /> New Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingestion Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: "6px",
            }}
          >
            Claim Title / Headline *
          </label>
          <input
            type="text"
            placeholder="e.g. Waterlogging during heavy rainfall"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "12px 14px",
              backgroundColor: "rgba(10, 14, 23, 0.8)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "0.95rem",
              outline: "none",
            }}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: "6px",
            }}
          >
            Claim Description / Statement *
          </label>
          <textarea
            rows={4}
            placeholder="Enter the factual statement or complaint to be registered..."
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "12px 14px",
              backgroundColor: "rgba(10, 14, 23, 0.8)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "0.9rem",
              lineHeight: 1.5,
              resize: "vertical",
              outline: "none",
            }}
            required
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <button
            type="button"
            onClick={handleResetForm}
            className="btn-secondary"
            style={{ fontSize: "0.85rem" }}
          >
            Clear Fields
          </button>

          <button
            type="submit"
            disabled={isButtonDisabled}
            className="btn-primary"
            style={{
              fontSize: "0.95rem",
              padding: "12px 28px",
              opacity: isButtonDisabled ? 0.65 : 1,
              cursor: isButtonDisabled ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Submitting...
              </>
            ) : createdClaim ? (
              <>
                <CheckCircle2 size={18} color="var(--accent-emerald)" /> Claim Submitted
              </>
            ) : (
              <>
                <Send size={16} /> Submit Claim to Backend
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
