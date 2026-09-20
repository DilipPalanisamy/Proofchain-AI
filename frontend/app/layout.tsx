import "./globals.css";
import React from "react";
import { Navbar } from "../components/Navbar";

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
        <Navbar />
        <main style={{ minHeight: "calc(100vh - 72px)" }}>{children}</main>
      </body>
    </html>
  );
}

