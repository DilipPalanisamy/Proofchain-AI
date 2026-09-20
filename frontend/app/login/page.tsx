"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Scale,
  FileCheck,
  Info,
} from "lucide-react";
import { backendUrl } from "../../lib/api";

function redirectToAnalyzePage() {
  if (typeof window === "undefined") return;

  localStorage.setItem("proofchain_logged_in", "true");

  const pathname = window.location.pathname;
  let basePath = pathname.replace(/\/login\/?$/, "");
  if (basePath.endsWith("/")) {
    basePath = basePath.slice(0, -1);
  }

  let cleanRoute = "/analyze/";
  if (!cleanRoute.endsWith("/")) {
    cleanRoute += "/";
  }

  const targetUrl = `${basePath}${cleanRoute}`;
  window.location.href = targetUrl;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const googleAuth = searchParams.get("google_auth");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setErrors({
        general:
          searchParams.get("error_description") ||
          `Google sign-in notice: ${oauthError}`,
      });
      return;
    }

    if (googleAuth === "success") {
      const userEmail = searchParams.get("email");
      const userName = searchParams.get("name");
      localStorage.setItem("proofchain_logged_in", "true");
      if (userEmail) localStorage.setItem("proofchain_user_email", userEmail);
      if (userName) localStorage.setItem("proofchain_user_name", userName);
      window.history.replaceState(null, "", window.location.pathname);
      redirectToAnalyzePage();
      return;
    }
  }, [searchParams, router]);

  // Validate fields
  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleNotice(null);

    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      if (typeof window !== "undefined") {
        localStorage.setItem("proofchain_logged_in", "true");
        localStorage.setItem("proofchain_user_email", cleanEmail || "demo@proofchain.ai");
      }
      redirectToAnalyzePage();
    }, 400);
  };

  const handleGoogleClick = () => {
    setIsSubmitting(true);
    setErrors({});
    setGoogleNotice("Signing in with Google...");
    window.location.assign(`${backendUrl}/auth/google/login`);
  };

  const handleFillDemo = () => {
    setEmail("demo@proofchain.ai");
    setPassword("proofchain123");
    setErrors({});
    setGoogleNotice(null);
  };


  return (
    <div
      style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "1040px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          overflow: "hidden",
          borderRadius: "20px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* LEFT SIDE: ProofChain AI Branding & Visual Chain */}
        <div
          style={{
            padding: "48px 40px",
            background: "linear-gradient(145deg, rgba(7, 9, 14, 0.95) 0%, rgba(18, 24, 38, 0.85) 100%)",
            borderRight: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(56, 189, 248, 0.4)",
                }}
              >
                <ShieldCheck size={26} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                Proof<span style={{ color: "var(--accent-cyan)" }}>Chain</span> AI
              </h2>
            </div>

            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: "6px" }}>
              "Evidence you can inspect. Decisions you can trust."
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "36px" }}>
              From evidence to transparent decisions.
            </p>

            {/* Simple Visual Chain */}
            <div
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                padding: "24px 20px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                marginBottom: "28px",
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  display: "block",
                  marginBottom: "16px",
                }}
              >
                Auditable Verification Architecture
              </span>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { title: "CLAIM", desc: "Proposition under investigation", icon: FileCheck, color: "var(--accent-cyan)" },
                  { title: "EVIDENCE", desc: "Multimodal artifacts & metadata", icon: Layers, color: "#38bdf8" },
                  { title: "AI ANALYSIS", desc: "Observable facts & relevance", icon: Sparkles, color: "#a855f7" },
                  { title: "PROOFCHAIN SCORE", desc: "Transparent deterministic strength", icon: Scale, color: "var(--accent-emerald)" },
                ].map((step, idx, arr) => {
                  const IconComp = step.icon;
                  return (
                    <React.Fragment key={step.title}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            backgroundColor: `${step.color}15`,
                            color: step.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <IconComp size={15} />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#ffffff", letterSpacing: "0.04em" }}>
                            {step.title}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                            {step.desc}
                          </span>
                        </div>
                      </div>

                      {idx < arr.length - 1 && (
                        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem", lineHeight: 0.8 }}>
                          ↓
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(56, 189, 248, 0.06)",
              borderRadius: "8px",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
            }}
          >
            <strong style={{ color: "var(--accent-cyan)" }}>Hackathon Demo Login:</strong> Use prefilled credentials{" "}
            <code className="mono" style={{ color: "#ffffff" }}>demo@proofchain.ai</code> /{" "}
            <code className="mono" style={{ color: "#ffffff" }}>proofchain123</code>.
          </div>
        </div>

        {/* RIGHT SIDE: Login Card */}
        <div style={{ padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
              Welcome back
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Sign in to continue your evidence investigations.
            </p>
          </div>

          {/* General Error Notice */}
          {errors.general && (
            <div
              style={{
                padding: "12px 14px",
                marginBottom: "20px",
                borderRadius: "8px",
                backgroundColor: "rgba(244, 63, 94, 0.1)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                color: "var(--accent-rose)",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Google Informative Notice */}
          {googleNotice && (
            <div
              style={{
                padding: "12px 14px",
                marginBottom: "20px",
                borderRadius: "8px",
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                color: "var(--accent-cyan)",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Info size={16} />
              <span>{googleNotice}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Email Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Email
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  backgroundColor: "rgba(10, 14, 23, 0.8)",
                  border: errors.email ? "1px solid var(--accent-rose)" : "1px solid var(--border-color)",
                  borderRadius: "8px",
                }}
              >
                <Mail size={16} color="var(--text-muted)" />
                <input
                  type="email"
                  placeholder="demo@proofchain.ai"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    width: "100%",
                  }}
                />
              </div>
              {errors.email && (
                <span style={{ fontSize: "0.75rem", color: "var(--accent-rose)", marginTop: "4px", display: "block" }}>
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-cyan)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Fill Demo Credentials
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  backgroundColor: "rgba(10, 14, 23, 0.8)",
                  border: errors.password ? "1px solid var(--accent-rose)" : "1px solid var(--border-color)",
                  borderRadius: "8px",
                }}
              >
                <Lock size={16} color="var(--text-muted)" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    width: "100%",
                  }}
                />
              </div>
              {errors.password && (
                <span style={{ fontSize: "0.75rem", color: "var(--accent-rose)", marginTop: "4px", display: "block" }}>
                  {errors.password}
                </span>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "0.95rem",
                fontWeight: 700,
                justifyContent: "center",
                marginTop: "6px",
              }}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>

          </form>

          {/* Link to Register */}
          <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Don't have an account?{" "}
            <Link href="/register" style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "80px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Loading ProofChain AI Login...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
