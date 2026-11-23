"use client";

import React from "react";
import Link from "next/link";

interface ClubPerk {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const PERKS: ClubPerk[] = [
  {
    id: "gift",
    title: "هدیه تولد",
    subtitle: "سورپرایز ویژه در روز تولد شما",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    id: "points",
    title: "امتیاز خرید",
    subtitle: "تبدیل هر خرید به اعتبار نقدی",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: "support",
    title: "پشتیبانی VIP",
    subtitle: "اولویت در پاسخگویی تخصصی",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
];

export default function DermaClubBanner() {
  return (
    <section
      className="dermalight-club-section"
      style={{
        paddingBlock: "clamp(36px, 5vw, 64px)",
        width: "100%",
      }}
    >
      <div className="container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Purple Banner Container matching Figma */}
        <div
          style={{
            position: "relative",
            background: "linear-gradient(135deg, #BA86C5 0%, #A46FBA 50%, #8553A8 100%)",
            borderRadius: 36,
            padding: "clamp(36px, 5vw, 64px) clamp(24px, 4vw, 56px)",
            color: "#FFFFFF",
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(133, 83, 168, 0.28)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "clamp(32px, 5vw, 56px)",
            alignItems: "center",
          }}
        >
          {/* Subtle Background Glow Circles */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.12)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />

          {/* Right Content Column (in RTL) */}
          <div style={{ position: "relative", zIndex: 2 }}>
            {/* Pill Tag */}
            <div
              style={{
                display: "inline-block",
                fontSize: "0.85rem",
                fontWeight: 800,
                color: "rgba(255, 255, 255, 0.85)",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              DERMA CLUB
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: "clamp(1.6rem, 2.7vw, 2.3rem)",
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.35,
                marginBottom: 16,
                letterSpacing: "-0.02em",
              }}
            >
              به باشگاه مشتریان درمالایت بپیوندید
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: "clamp(0.95rem, 1.1vw, 1.05rem)",
                color: "rgba(255, 255, 255, 0.92)",
                lineHeight: 1.75,
                maxWidth: "520px",
                marginBottom: 32,
              }}
            >
              با عضویت در باشگاه، از مشاوره رایگان اختصاصی، کدهای تخفیف دوره‌ای و اولویت در تست محصولات جدید بهره‌مند شوید. همین حالا عضو شوید و اولین امتیاز خود را دریافت کنید.
            </p>

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <Link
                href="/loyalty"
                style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  borderRadius: 14,
                  background: "#FFFFFF",
                  color: "#7E4FA3",
                  fontSize: "0.98rem",
                  fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.12)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                عضویت رایگان
              </Link>

              <Link
                href="/loyalty"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  borderRadius: 14,
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  color: "#FFFFFF",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")}
              >
                مشاهده مزایا
              </Link>
            </div>
          </div>

          {/* Left Column (Frosted Glass Perks Card in RTL) */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 380,
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                borderRadius: 24,
                border: "1px solid rgba(255, 255, 255, 0.25)",
                padding: "24px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
                boxShadow: "0 18px 45px rgba(0, 0, 0, 0.12)",
              }}
            >
              {PERKS.map((perk) => (
                <div
                  key={perk.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  {/* Icon Circle */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(255, 255, 255, 0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {perk.icon}
                  </div>

                  {/* Texts */}
                  <div>
                    <h4
                      style={{
                        fontSize: "0.98rem",
                        fontWeight: 700,
                        color: "#FFFFFF",
                        margin: 0,
                      }}
                    >
                      {perk.title}
                    </h4>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        color: "rgba(255, 255, 255, 0.78)",
                      }}
                    >
                      {perk.subtitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
