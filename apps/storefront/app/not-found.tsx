import Link from "next/link";

export const metadata = {
  title: "صفحه یافت نشد (۴۰۴) | DERMAVIA",
};

/**
 * Luxury 404 Not Found page with brand tone, cosmic accent, and helpful navigation.
 */
export default function NotFound() {
  return (
    <div className="dv-b2b-container" style={{ textAlign: "center", paddingBlock: "80px 120px" }}>
      <div className="dv-b2b-card" style={{ maxWidth: 580, margin: "0 auto", padding: "48px 36px" }}>
        <span
          className="dv-num"
          style={{
            fontSize: "4.5rem",
            fontWeight: 800,
            color: "var(--dv-gold)",
            display: "block",
            lineHeight: 1,
            marginBottom: 16,
            textShadow: "0 4px 18px rgba(212, 175, 55, 0.25)",
          }}
        >
          ۴۰۴
        </span>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--dv-navy)", margin: "0 0 14px" }}>
          صفحه مورد نظر در آزمایشگاه ما یافت نشد
        </h1>

        <p className="dv-muted" style={{ fontSize: "0.95rem", lineHeight: 1.8, marginBottom: 28 }}>
          نشانی واردشده ممکن است تغییر یافته باشد، یا محصول موردنظر از فهرست خارج شده باشد.
          می‌توانید به صفحه اصلی بازگردید یا کاتالوگ محصولات بالینی را جستجو کنید.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <Link href="/" className="dv-btn dv-btn-gold" style={{ paddingInline: 28 }}>
            بازگشت به خانه
          </Link>
          <Link href="/products" className="dv-btn" style={{ background: "#ffffff", border: "1px solid var(--dv-line)", paddingInline: 24 }}>
            مشاهده محصولات
          </Link>
          <Link href="/support" className="dv-btn" style={{ background: "#ffffff", border: "1px solid var(--dv-line)", paddingInline: 24 }}>
            تماس با پشتیبانی
          </Link>
        </div>
      </div>
    </div>
  );
}
