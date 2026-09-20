"use client";

import React, { useState } from "react";
import { Plus, Trash2, FileText, Image, Database, AlignLeft, HelpCircle, Shield, Clock, Loader2, AlertCircle } from "lucide-react";
import { EvidenceItem, EvidenceType, addEvidence } from "../lib/api";

interface EvidenceUploadProps {
  claimId: string | number;
  evidenceList: EvidenceItem[];
  onEvidenceAttached: () => void;
}

const EVIDENCE_TYPES: { label: string; value: EvidenceType; icon: React.ReactNode }[] = [
  { label: "DOCUMENT", value: "DOCUMENT", icon: <FileText size={14} /> },
  { label: "IMAGE", value: "IMAGE", icon: <Image size={14} /> },
  { label: "DATA", value: "DATA", icon: <Database size={14} /> },
  { label: "TEXT", value: "TEXT", icon: <AlignLeft size={14} /> },
  { label: "OTHER", value: "OTHER", icon: <HelpCircle size={14} /> },
];

export const EvidenceUpload: React.FC<EvidenceUploadProps> = ({
  claimId,
  evidenceList,
  onEvidenceAttached,
}) => {
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [type, setType] = useState<EvidenceType>("DOCUMENT");
  const [location, setLocation] = useState("");
  const [reliability, setReliability] = useState<number>(0.85);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg("Please provide an evidence description or statement excerpt.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await addEvidence({
        claim_id: claimId,
        type: type,
        file_name: fileName.trim() || undefined,
        description: description.trim(),
        source: source.trim() || undefined,
        location: location.trim() || undefined,
        reliability_score: reliability,
      });

      // Clear input fields
      setFileName("");
      setDescription("");
      setSource("");
      setLocation("");

      // Immediately refresh parent claim's evidence list
      onEvidenceAttached();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to attach evidence.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLoadPreset = (preset: {
    type: EvidenceType;
    file_name: string;
    description: string;
    source: string;
    location: string;
    reliability: number;
  }) => {
    setType(preset.type);
    setFileName(preset.file_name);
    setDescription(preset.description);
    setSource(preset.source);
    setLocation(preset.location);
    setReliability(preset.reliability);
    setErrorMsg(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Attached Counter Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "14px",
        }}
      >
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em" }}>
            Linked to Claim: <strong style={{ color: "var(--accent-cyan)" }}>{String(claimId)}</strong>
          </span>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff", marginTop: "2px" }}>
            Evidence Items Attached: <span style={{ color: "var(--accent-cyan)" }}>{evidenceList.length}</span>
          </div>
        </div>

        {/* Quick presets */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            onClick={() =>
              handleQuickLoadPreset({
                type: "DOCUMENT",
                file_name: "nist_quantum_standards_2024.pdf",
                description:
                  "NIST assessment concludes that factoring RSA-2048 requires 4,000 logical qubits; noisy 1,000 physical qubits cannot perform fault-tolerant modular arithmetic.",
                source: "National Institute of Standards and Technology",
                location: "Gaithersburg, MD",
                reliability: 0.95,
              })
            }
            className="btn-secondary"
            style={{ fontSize: "0.72rem", padding: "5px 10px" }}
          >
            Preset: Document
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickLoadPreset({
                type: "DATA",
                file_name: "transmon_coherence_telemetry.csv",
                description:
                  "Empirical run logs show qubit relaxation time T1 averaging 112 microseconds, resulting in 99.1% 2-qubit gate error during Shor compilation.",
                source: "IBM Quantum Cloud Services",
                location: "Yorktown Heights, NY",
                reliability: 0.92,
              })
            }
            className="btn-secondary"
            style={{ fontSize: "0.72rem", padding: "5px 10px" }}
          >
            Preset: Data
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            backgroundColor: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#fecdd3",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} color="var(--accent-rose)" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
              File / Document Name
            </label>
            <input
              type="text"
              placeholder="e.g. nist_report_2024.pdf"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "rgba(10, 14, 23, 0.8)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
              Source / Citation
            </label>
            <input
              type="text"
              placeholder="e.g. NIST, Nature, ArXiv"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "rgba(10, 14, 23, 0.8)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
              Evidence Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EvidenceType)}
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "rgba(10, 14, 23, 0.8)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none",
              }}
            >
              {EVIDENCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
            Evidence Description / Verbatim Excerpt *
          </label>
          <textarea
            rows={3}
            placeholder="Detailed excerpt, observation, or empirical finding from the evidence source..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              backgroundColor: "rgba(10, 14, 23, 0.8)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "0.85rem",
              lineHeight: 1.4,
              resize: "vertical",
              outline: "none",
            }}
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "12px", alignItems: "center" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
              Origin Location / Archive (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Gaithersburg, MD or https://doi.org/..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                backgroundColor: "rgba(10, 14, 23, 0.8)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Reliability Score:
              </label>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-emerald)" }}>
                {Math.round(reliability * 100)}% ({reliability})
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={reliability}
              onChange={(e) => setReliability(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent-cyan)", cursor: "pointer" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ fontSize: "0.9rem", padding: "10px 24px" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Evidence...
              </>
            ) : (
              <>
                <Plus size={16} /> Attach Evidence
              </>
            )}
          </button>
        </div>
      </form>

      {/* Attached Evidence List */}
      <div style={{ marginTop: "12px" }}>
        {evidenceList.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px dashed var(--border-color)",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            No evidence records attached to this claim yet. Use the form above to add supporting or refuting documentation.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {evidenceList.map((item, idx) => {
              const evId =
                item.evidence_id ||
                `EVD-2026-${String(item.id || idx + 1).padStart(4, "0")}`;

              return (
                <div
                  key={item.id || idx}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          color: "var(--accent-cyan)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(56, 189, 248, 0.15)",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                        }}
                      >
                        {evId}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          color: "#ffffff",
                          textTransform: "uppercase",
                        }}
                      >
                        TYPE: {item.type}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Shield size={14} color="var(--accent-emerald)" />
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-emerald)" }}>
                        Reliability: {item.reliability_score !== undefined && item.reliability_score !== null ? `${Math.round(item.reliability_score * 100)}%` : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", marginBottom: "2px" }}>
                      {item.file_name || item.source || "Evidence Excerpt"}
                    </h4>
                    {item.source && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                        Source: {item.source} {item.location ? `• Location: ${item.location}` : ""}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.45, backgroundColor: "rgba(0, 0, 0, 0.2)", padding: "8px 12px", borderRadius: "6px" }}>
                    {item.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px" }}>
                    <Clock size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      Created: {item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
