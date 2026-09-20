"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, LayoutDashboard, Search, User, LogOut } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const loggedIn = localStorage.getItem("proofchain_logged_in") === "true";
        setIsLoggedIn(loggedIn);
        setUserEmail(localStorage.getItem("proofchain_user_email") || "");
      }
    };

    checkAuth();
    // Re-check auth state periodically or on storage event
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [pathname]);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("proofchain_logged_in");
      localStorage.removeItem("proofchain_user_email");
      localStorage.removeItem("proofchain_user_name");
      setIsLoggedIn(false);
    }
    router.push("/login");
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        backgroundColor: "rgba(7, 9, 14, 0.85)",
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
            color: pathname === "/overview" ? "var(--accent-cyan)" : "var(--text-secondary)",
            fontWeight: pathname === "/overview" ? 600 : 500,
            textDecoration: "none",
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
            color: pathname === "/analyze" ? "var(--accent-cyan)" : "var(--text-secondary)",
            fontWeight: pathname === "/analyze" ? 600 : 500,
            textDecoration: "none",
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
            color: pathname === "/dashboard" ? "var(--accent-cyan)" : "var(--text-secondary)",
            fontWeight: pathname === "/dashboard" ? 600 : 500,
            textDecoration: "none",
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

        {isLoggedIn ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 10px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                fontSize: "0.78rem",
                color: "var(--accent-cyan)",
                fontWeight: 600,
              }}
            >
              <User size={14} />
              <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userEmail || "User"}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(244, 63, 94, 0.1)",
                border: "1px solid rgba(244, 63, 94, 0.25)",
                fontSize: "0.8rem",
                color: "var(--accent-rose)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </nav>
  );
}
