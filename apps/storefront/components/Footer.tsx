import React from "react";
import Link from "next/link";
import DermalightLogo from "./DermalightLogo";

export default function Footer() {
  return (
    <footer
      className="dermalight-footer"
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
        paddingTop: "clamp(48px, 6vw, 72px)",
        paddingBottom: "36px",
        width: "100%",
      }}
    >
      <div className="container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* 4 Columns Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "clamp(32px, 4vw, 48px)",
            marginBottom: "clamp(40px, 5vw, 56px)",
          }}
        >
          {/* Column 1: Brand Info (Right in RTL) */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <DermalightLogo size="md" />
            </div>

            <p
              style={{
                fontSize: "0.88rem",
                color: "#64748B",
                lineHeight: 1.8,
                marginBottom: 20,
                maxWidth: "280px",
              }}
            >
              مرجع تخصصی نقد، بررسی و تامین محصولات درموکازمتیک در ایران. ما به سلامت پوست شما اهمیت می‌دهیم.
            </p>

            {/* Social Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="اینستاگرام درمالایت"
                className="dermalight-social-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* Twitter */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="توییتر درمالایت"
                className="dermalight-social-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="لینکدین درمالایت"
                className="dermalight-social-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: دسترسی سریع */}
          <div>
            <h4
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#1A2254",
                marginBottom: 16,
              }}
            >
              دسترسی سریع
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { href: "/products", label: "همه محصولات" },
                { href: "/products?sort=popular", label: "پرفروش‌ترین‌ها" },
                { href: "/products?discount=true", label: "تخفیفات فصلی" },
                { href: "/products", label: "برندهای همکار" },
                { href: "/account#wishlist", label: "لیست علاقه‌مندی" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="dermalight-footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: راهنمای مشتریان */}
          <div>
            <h4
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#1A2254",
                marginBottom: 16,
              }}
            >
              راهنمای مشتریان
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { href: "/support", label: "سوالات متداول" },
                { href: "/account", label: "پیگیری سفارش" },
                { href: "/support#shipping", label: "روش‌های ارسال" },
                { href: "/support#returns", label: "شرایط بازگشت کالا" },
                { href: "/support#privacy", label: "حریم خصوصی" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="dermalight-footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: ارتباط با ما (Left in RTL) */}
          <div>
            <h4
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#1A2254",
                marginBottom: 16,
              }}
            >
              ارتباط با ما
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Address */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A4B60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span style={{ fontSize: "0.85rem", color: "#64748B", lineHeight: 1.6 }}>
                  تهران، خیابان ولیعصر، برج تجارت، طبقه ۱۲، واحد ۱۲۰۴
                </span>
              </div>

              {/* Phone */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A4B60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <a
                  href="tel:02188990022"
                  className="dermalight-footer-link"
                  style={{
                    fontFamily: "var(--font-vazir), Vazirmatn, sans-serif",
                    direction: "ltr",
                  }}
                >
                  ۰۲۱-۸۸۹۹۰۰۲۲
                </a>
              </div>

              {/* Email */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A4B60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a
                  href="mailto:info@dermalight.ir"
                  className="dermalight-footer-link"
                  style={{ direction: "ltr" }}
                >
                  info@dermalight.ir
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright and Trust Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            paddingTop: 24,
            borderTop: "1px solid #F1F5F9",
          }}
        >
          {/* Copyright */}
          <span
            style={{
              fontSize: "0.82rem",
              color: "#94A3B8",
            }}
          >
            © ۱۴۰۳ تمامی حقوق مادی و معنوی متعلق به درمالایت است.
          </span>

          {/* Trust Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 64,
                height: 40,
                borderRadius: 8,
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                color: "#94A3B8",
                fontWeight: 600,
              }}
            >
              اینماد
            </div>
            <div
              style={{
                width: 64,
                height: 40,
                borderRadius: 8,
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                color: "#94A3B8",
                fontWeight: 600,
              }}
            >
              ساماندهی
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
