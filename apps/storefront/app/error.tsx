"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Global client error boundary — Persian message plus a retry action. */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[storefront] unexpected error:", error);
  }, [error]);

  return (
    <div className="container dv-center-state">
      <h1>خطای غیرمنتظره رخ داد</h1>
      <p>مشکلی در نمایش این بخش پیش آمد. می‌توانید دوباره تلاش کنید.</p>
      <button type="button" onClick={reset} className="dv-btn">تلاش دوباره</button>
    </div>
  );
}
