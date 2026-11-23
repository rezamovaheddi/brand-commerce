"use client";

import { useEffect } from "react";
import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Global client error boundary — Warm Clinical Luxury recovery card
 * with retry action and direct contact button.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[storefront] unexpected error:", error);
  }, [error]);

  return (
    <div className="dv-b2b-container" style={{ textAlign: "center", paddingBlock: "80px 120px" }}>
      <div className="dv-b2b-card" style={{ maxWidth: 680, margin: "0 auto", padding: "48px 36px" }}>
        <span style={{ fontSize: "3rem", display: "block", marginBottom: 16 }}>⚠️</span>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--dv-navy)", margin: "0 0 12px" }}>
          خطای غیرمنتظره در بارگذاری
        </h1>

        <p className="dv-muted" style={{ fontSize: "0.95rem", lineHeight: 1.8, marginBottom: 24 }}>
          مشکلی در دریافت اطلاعات پیش آمده است. تیم فنی در حال بررسی وضعیت است.
          می‌توانید دوباره تلاش فرمایید یا با پشتیبانی ارتباط برقرار کنید.
        </p>

        {error?.message ? (
          <div style={{ textAlign: "left", direction: "ltr", background: "#FFF1F2", border: "1px solid #FECDD3", padding: "14px 18px", borderRadius: 12, fontSize: "0.88rem", color: "#9F1239", marginBottom: 24, overflowX: "auto" }}>
            <strong>Error: </strong> {error.message}
            {error.digest ? <div style={{ fontSize: "0.78rem", color: "#BE123C", marginTop: 4 }}>Digest: {error.digest}</div> : null}
            {error.stack ? (
              <pre style={{ marginTop: 8, fontSize: "0.75rem", whiteSpace: "pre-wrap", color: "#881337" }}>
                {error.stack.split("\n").slice(0, 5).join("\n")}
              </pre>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <button type="button" onClick={reset} className="dv-btn dv-btn-gold" style={{ paddingInline: 28 }}>
            تلاش دوباره
          </button>
          <Link href="/" className="dv-btn" style={{ background: "#ffffff", border: "1px solid var(--dv-line)", paddingInline: 24 }}>
            صفحه اصلی
          </Link>
          <Link href="/support" className="dv-btn" style={{ background: "#ffffff", border: "1px solid var(--dv-line)", paddingInline: 24 }}>
            ارسال تیکت پشتیبانی
          </Link>
        </div>
      </div>
    </div>
  );
}
