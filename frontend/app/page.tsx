"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedIn = localStorage.getItem("proofchain_logged_in") === "true";
      if (isLoggedIn) {
        router.replace("/analyze");
      } else {
        router.replace("/login");
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
