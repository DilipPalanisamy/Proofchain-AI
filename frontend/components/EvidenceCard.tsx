"use client";

import React from "react";
import {
  FileText,
  Image as ImageIcon,
  Database,
  MapPin,
  Calendar,
  AlertOctagon,
  Sparkles,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Hash,
} from "lucide-react";
import { EvidenceEvaluation } from "../lib/api";

interface EvidenceCardProps {
  evaluation: EvidenceEvaluation;
  index: number;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evaluation, index }) => {
  const {
    evidence_id,
    file_name,
    type = "DOCUMENT",
    summary,
    observations = [],
    location,
    date,
    severity = "UNKNOWN",
    quality_score = 0,
    reliability_score = 0,
    relevance_score = 0,
    relevance_classification = "PARTIALLY_RELEVANT",
    relevance_reason,
    similarity_information = [],
  } = evaluation;

  // Relevance styling
  const isRelevant = relevance_classification === "RELEVANT";
  const isPartiallyRelevant = relevance_classification === "PARTIALLY_RELEVANT";
  const isIrrelevant = relevance_classification === "IRRELEVANT";

  const relColor = isRelevant
    ? "var(--accent-emerald)"
    : isPartiallyRelevant
    ? "var(--accent-amber)"
    : "var(--accent-rose)";

  const RelIcon = isRelevant
    ? CheckCircle2
    : isPartiallyRelevant
    ? AlertCircle
    : XCircle;

  // Type icon
  const TypeIcon =
    type.toUpperCase() === "IMAGE"
      ? ImageIcon
      : type.toUpperCase() === "DATA"
      ? Database
      : FileText;

  // Max similarity with other nodes
  const maxSimilarity = similarity_information.length > 0
    ? Math.max(...similarity_information.map((s) => s.similarity_score))
    : null;

  // Severity color
  const sevUpper = (severity || "").toUpperCase();
  const sevColor =
    sevUpper === "HIGH"
      ? "var(--accent-rose)"
      : sevUpper === "MEDIUM"
      ? "var(--accent-amber)"
      : sevUpper === "LOW"
      ? "var(--accent-emerald)"
      : "var(--text-muted)";

  return (
    <div
      className="glass-panel"
      style={{
        padding: "22px 24px",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${relColor}35`,
        background: `linear-gradient(180deg, rgba(18, 24, 38, 0.85) 0%, rgba(10, 14, 23, 0.95) 100%)`,
        boxShadow: `0 4px 20px -3px ${relColor}15`,
        position: "relative",
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Index Node Pill */}
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              color: "var(--text-secondary)",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid var(--border-color)",
            }}
          >
            #{index + 1}
          </span>

          {/* Evidence ID */}
          <span
            className="mono"
            style={{
              fontSize: "0.85rem",
              fontWeight: 800,
              color: "#ffffff",
              backgroundColor: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              padding: "4px 10px",
              borderRadius: "6px",
            }}
          >
            {evidence_id}
          </span>

          {/* Type Badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid var(--border-color)",
            }}
          >
            <TypeIcon size={13} color="var(--accent-cyan)" />
            {type}
          </span>

          {/* File Name */}
          {file_name && (
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                fontFamily: "monospace",
              }}
            >
              {file_name}
            </span>
          )}
        </div>

        {/* Relevance Classification Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            backgroundColor: `${relColor}18`,
            color: relColor,
            border: `1px solid ${relColor}40`,
          }}
        >
          <RelIcon size={14} />
          {relevance_classification.replace(/_/g, " ")} ({relevance_score}/100)
        </div>
      </div>

      {/* AI Extraction Summary Box */}
      <div
        style={{
          padding: "14px 16px",
          borderRadius: "8px",
          backgroundColor: "rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.04)",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.74rem",
            fontWeight: 700,
            color: "var(--accent-cyan)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "6px",
          }}
        >
          <Sparkles size={13} />
          AI Extraction Summary
        </div>
        <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
          {summary || "No extraction summary available."}
        </p>
      </div>

      {/* Observations List */}
      {observations && observations.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Factual Observations
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {observations.map((obs, oIdx) => (
              <div
                key={oIdx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-cyan)",
                    marginTop: "6px",
                    flexShrink: 0,
                  }}
                />
                <span>{obs}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata & Scores Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "10px",
          paddingTop: "14px",
          borderTop: "1px solid var(--border-color)",
          fontSize: "0.78rem",
        }}
      >
        {/* Location */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
          <MapPin size={14} color="var(--text-muted)" />
          <span>
            <strong style={{ color: "var(--text-muted)" }}>Loc:</strong> {location || "Unspecified"}
          </span>
        </div>

        {/* Date */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
          <Calendar size={14} color="var(--text-muted)" />
          <span>
            <strong style={{ color: "var(--text-muted)" }}>Date:</strong> {date ? String(date).slice(0, 10) : "Unspecified"}
          </span>
        </div>

        {/* Severity */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
          <AlertOctagon size={14} color={sevColor} />
          <span>
            <strong style={{ color: "var(--text-muted)" }}>Severity:</strong>{" "}
            <span style={{ color: sevColor, fontWeight: 700 }}>{severity || "UNKNOWN"}</span>
          </span>
        </div>

        {/* Quality & Reliability */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
          <Shield size={14} color="var(--accent-cyan)" />
          <span>
            <strong style={{ color: "var(--text-muted)" }}>Qual:</strong> {quality_score}% |{" "}
            <strong style={{ color: "var(--text-muted)" }}>Rel:</strong> {reliability_score}%
          </span>
        </div>

        {/* Peer Similarity */}
        {maxSimilarity !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
            <Layers size={14} color="var(--accent-indigo)" />
            <span>
              <strong style={{ color: "var(--text-muted)" }}>Peer Sim:</strong> {maxSimilarity}%
            </span>
          </div>
        )}
      </div>

      {/* Relevance Reason if available */}
      {relevance_reason && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            backgroundColor: `${relColor}08`,
            borderRadius: "6px",
            border: `1px solid ${relColor}20`,
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
          }}
        >
          <strong style={{ color: relColor }}>Relevance Assessment:</strong> {relevance_reason}
        </div>
      )}
    </div>
  );
};
