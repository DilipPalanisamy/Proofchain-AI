import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Network,
} from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px 80px" }}>
      {/* Hero Section */}
      <section style={{ textAlign: "center", marginBottom: "64px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            fontSize: "0.8rem",
            color: "var(--accent-cyan)",
            fontWeight: 600,
            marginBottom: "24px",
          }}
        >
          <Sparkles size={16} /> Autonomous Verification & Credibility Engine
        </div>

        <h1
          style={{
            fontSize: "3.5rem",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            marginBottom: "20px",
          }}
        >
          Verify Claims with <br />
          <span className="gradient-text">Verifiable Evidence Chains</span>
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            color: "var(--text-secondary)",
            maxWidth: "680px",
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          ProofChain AI automatically ingests multi-source documentation, computes semantic
          similarity, detects hidden factual contradictions, and builds an auditable chain of
          reasoning for every assertion.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          <Link href="/analyze" className="btn-primary" style={{ padding: "14px 28px", fontSize: "1rem" }}>
            <Search size={18} /> Launch Analysis Workspace
          </Link>
          <Link href="/dashboard" className="btn-secondary" style={{ padding: "14px 28px", fontSize: "1rem" }}>
            Explore Verified Claims <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          marginBottom: "64px",
        }}
      >
        <div className="glass-panel" style={{ padding: "28px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "rgba(56, 189, 248, 0.15)",
              color: "var(--accent-cyan)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "18px",
            }}
          >
            <Cpu size={24} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: "8px" }}>
            Semantic Similarity
          </h3>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Computes multi-dimensional vector and contextual overlap between complex assertions and
            corpus passages to eliminate false matches.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "28px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "rgba(244, 63, 94, 0.15)",
              color: "var(--accent-rose)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "18px",
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: "8px" }}>
            Contradiction Detection
          </h3>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Identifies subtle negation inversions, antonym clashes, and factual refutations across
            academic papers and news feeds.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "28px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              color: "var(--accent-indigo)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "18px",
            }}
          >
            <GitBranch size={24} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: "8px" }}>
            Auditable Proof Chains
          </h3>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Generates step-by-step reasoning nodes with quantifiable confidence deltas so every
            verdict can be independently scrutinized.
          </p>
        </div>
      </section>

      {/* Quick Architecture Overview Box */}
      <section
        className="glass-panel"
        style={{
          padding: "36px",
          background: "linear-gradient(180deg, rgba(15, 20, 31, 0.8) 0%, rgba(7, 9, 14, 0.9) 100%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 700, textTransform: "uppercase" }}>
              Pipeline Architecture
            </span>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#ffffff" }}>
              How ProofChain AI Delivers Trustworthy Truth Assessment
            </h3>
          </div>
          <Link href="/analyze" className="btn-primary" style={{ fontSize: "0.85rem" }}>
            Try Live Demo
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 700 }}>01. CLAIM INGESTION</span>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              Extracts factual statements and core entities from unstructured claims.
            </p>
          </div>
          <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-indigo)", fontWeight: 700 }}>02. CORPUS CORRELATION</span>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              Matches semantic keywords and vector embeddings against verified sources.
            </p>
          </div>
          <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-rose)", fontWeight: 700 }}>03. DISCREPANCY AUDIT</span>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              Applies polarity checks and stance analysis to surface counter-claims.
            </p>
          </div>
          <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", fontWeight: 700 }}>04. SCORE SYNTHESIS</span>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              Synthesizes overall Credibility Score (0-100) and produces the ProofChain.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
