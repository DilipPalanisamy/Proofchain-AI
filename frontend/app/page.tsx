"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedIn = localStorage.getItem("proofchain_logged_in") === "true";
      const pathname = window.location.pathname;
      let basePath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
      if (basePath.endsWith("/login") || basePath.endsWith("/analyze") || basePath.endsWith("/overview")) {
        basePath = basePath.replace(/\/(login|analyze|overview)\/?$/, "");
      }

      if (isLoggedIn) {
        window.location.replace(`${basePath}/analyze/`);
      } else {
        window.location.replace(`${basePath}/login/`);
      }
    }
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: "var(--text-secondary)",
      }}
    >
      Loading ProofChain AI...
    </div>
  );
}
