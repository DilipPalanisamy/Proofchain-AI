import "./globals.css";
import React from "react";
import Link from "next/link";
import { ShieldCheck, Cpu, LayoutDashboard, Search, Github } from "lucide-react";

export const metadata = {
  title: "ProofChain AI - Autonomous Evidence Chain & Claim Verification",
  description: "AI-powered claim verification, multi-source contradiction detection, and credibility analysis engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            backgroundColor: "rgba(7, 9, 14, 0.8)",
            borderBottom: "1px solid var(--border-color)",
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 15px rgba(56, 189, 248, 0.4)",
              }}
            >
              <ShieldCheck size={22} color="#ffffff" />
            </div>
            <div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                }}
              >
                Proof<span style={{ color: "var(--accent-cyan)" }}>Chain</span>
              </span>
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "0.65rem",
                  backgroundColor: "rgba(56, 189, 248, 0.15)",
                  color: "var(--accent-cyan)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontWeight: 700,
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
              >
                AI CORE
              </span>
            </div>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Link
              href="/overview"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              Overview
            </Link>
            <Link
              href="/analyze"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.9rem",
                color: "var(--accent-cyan)",
                fontWeight: 600,
              }}
            >
              <Search size={16} /> Analyze Evidence
            </Link>
            <Link
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                fontSize: "0.75rem",
                color: "var(--accent-emerald)",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-emerald)",
                  boxShadow: "0 0 8px var(--accent-emerald)",
                }}
              />
              System Online
            </div>

            <Link
              href="/login"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-color)",
                fontSize: "0.82rem",
                color: "#ffffff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          </div>
        </nav>

        <main style={{ minHeight: "calc(100vh - 72px)" }}>{children}</main>
      </body>
    </html>
  );
}
