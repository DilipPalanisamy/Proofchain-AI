"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      let basePath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
      if (basePath.endsWith("/login") || basePath.endsWith("/analyze") || basePath.endsWith("/overview")) {
        basePath = basePath.replace(/\/(login|analyze|overview)\/?$/, "");
      }
      // Always direct entry to Sign In page until user logs in
      window.location.replace(`${basePath}/login/`);
    }
  }, []);

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
      Loading ProofChain AI Sign In...
    </div>
  );
}
