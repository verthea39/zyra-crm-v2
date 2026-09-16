"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, LayoutDashboard } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global-client-error]", { message: error.message, digest: error.digest, stack: error.stack });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 16, fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <div style={{ width: "100%", maxWidth: 448, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", padding: 32, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fffbeb", color: "#d97706", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle width={32} height={32} />
            </div>

            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
              A critical error occurred and the application could not continue. The issue has been logged for review.
            </p>
            {error.digest && (
              <p style={{ fontSize: 12, fontFamily: "monospace", color: "#94a3b8", marginBottom: 24 }}>Incident Ref: {error.digest}</p>
            )}
            {!error.digest && <div style={{ marginBottom: 24 }} />}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{ flex: 1, minWidth: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                <RotateCcw width={16} height={16} /> Try Again
              </button>
              <a
                href="/dashboard"
                style={{ flex: 1, minWidth: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, background: "#98682E", color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
              >
                <LayoutDashboard width={16} height={16} /> Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
