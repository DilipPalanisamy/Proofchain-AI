"use client";

import React from "react";
import { GitCommit, Layers, FileQuestion } from "lucide-react";
import { EvidenceEvaluation } from "../lib/api";
import { EvidenceCard } from "./EvidenceCard";

interface EvidenceChainProps {
  evaluations: EvidenceEvaluation[];
}

export const EvidenceChain: React.FC<EvidenceChainProps> = ({ evaluations }) => {
  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: "32px", textAlign: "center" }}>
        <FileQuestion size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
        <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", marginBottom: "6px" }}>
          No Evidence Attached
        </h4>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          No evidence records were provided for this claim analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: "26px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: "rgba(56, 189, 248, 0.15)",
              color: "var(--accent-cyan)",
            }}
          >
            <GitCommit size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff" }}>
              Verifiable Evidence Chain
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Detailed multi-modal evaluation and factual extraction across all {evaluations.length} evidence artifacts
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
          }}
        >
          {evaluations.length} Artifacts Analyzed
        </span>
      </div>

      {/* Vertical Evidence Chain Container */}
      <div style={{ position: "relative", paddingLeft: "16px" }}>
        {/* Continuous background connecting line */}
        <div
          style={{
            position: "absolute",
            left: "24px",
            top: "20px",
            bottom: "30px",
            width: "2px",
            backgroundColor: "rgba(56, 189, 248, 0.2)",
            zIndex: 1,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {evaluations.map((item, idx) => (
            <div
              key={item.evidence_id || idx}
              style={{
                position: "relative",
                zIndex: 2,
                paddingLeft: "24px",
              }}
            >
              {/* Connector Node Dot */}
              <div
                style={{
                  position: "absolute",
                  left: "-1px",
                  top: "26px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: "#07090e",
                  border: `3px solid ${
                    item.relevance_classification === "RELEVANT"
                      ? "var(--accent-emerald)"
                      : item.relevance_classification === "PARTIALLY_RELEVANT"
                      ? "var(--accent-amber)"
                      : "var(--accent-rose)"
                  }`,
                  boxShadow: `0 0 10px rgba(56, 189, 248, 0.4)`,
                  zIndex: 3,
                }}
              />

              <EvidenceCard evaluation={item} index={idx} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
