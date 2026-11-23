"use client";

import React from "react";
import Link from "next/link";
import SampleBadge from "./SampleBadge";

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FEATURES: FeatureCard[] = [
  {
    id: "plant",
    title: "فرمولاسیون پاک و هدفمند",
    description: "استفاده از مواد موثره خالص، بدون الکل‌های مضر، پارابن و اسانس مصنوعی",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#276749" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
  },
  {
    id: "cruelty-free",
    title: "بدون تست حیوانی",
    description: "تعهد کامل به استانداردهای اخلاقی کرولتی‌فری و عدم آزمایش روی حیوانات",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8A5A14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 11a2 2 0 1 1 4 0v2a2 2 0 1 1-4 0z" />
        <path d="M12 11a2 2 0 1 1 4 0v2a2 2 0 1 1-4 0z" />
        <path d="M10 17h4" />
      </svg>
    ),
  },
  {
    id: "original",
    title: "تضمین اصالت بچ و مواد",
    description: "رهگیری دقیق لات نامبر، تاریخ تولید، پایداری میکروبی و انقضا در سیستم لجر",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7A4B60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "science",
    title: "پشتوانه شواهد بالینی",
    description: "طراحی فرمولاسیون‌ها بر اساس شواهد معتبر بیوشیمی پوست و رفرنس‌های علمی",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#172343" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18h8" />
        <path d="M3 22h18" />
        <path d="M14 22a7 7 0 1 0 0-14h-1" />
        <path d="M9 14h2" />
        <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
        <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
      </svg>
    ),
  },
];

export default function WhyDermatologists() {
  return (
    <section
      className="dermalight-why-section"
      style={{
        paddingBlock: "clamp(48px, 6vw, 72px)",
        width: "100%",
        background: "#FAF7F3",
        borderTop: "1px solid rgba(216, 200, 188, 0.4)",
        borderBottom: "1px solid rgba(216, 200, 188, 0.4)",
      }}
    >
      <div className="container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 56px)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#7A4B60",
                letterSpacing: "0.04em",
              }}
            >
              استانداردهای مراقبت علمی
            </span>
            <SampleBadge />
          </div>

          <h2
            style={{
              fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
              fontWeight: 800,
              color: "#172343",
              marginBottom: 10,
              letterSpacing: "-0.02em",
            }}
          >
            چرا متخصصین پوست DERMAVIA را توصیه می‌کنند؟
          </h2>
          <p
            style={{
              fontSize: "0.98rem",
              color: "#705649",
              maxWidth: "680px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            ترکیب دانش درماتولوژی نوین با عصاره‌های پاک طبیعی؛ توسعه‌یافته برای سازگاری کامل با فیزیولوژی طبیعی پوست‌های حساس
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "clamp(20px, 2.5vw, 28px)",
            marginBottom: "clamp(36px, 4vw, 48px)",
          }}
        >
          {FEATURES.map((feat) => (
            <div
              key={feat.id}
              style={{
                background: "#FFFFFF",
                borderRadius: 24,
                padding: "clamp(28px, 3.5vw, 36px) 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                border: "1px solid rgba(216, 200, 188, 0.6)",
                boxShadow: "0 10px 28px rgba(73, 46, 34, 0.04)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 18px 40px rgba(122, 75, 96, 0.1)";
                e.currentTarget.style.borderColor = "#7A4B60";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 28px rgba(73, 46, 34, 0.04)";
                e.currentTarget.style.borderColor = "rgba(216, 200, 188, 0.6)";
              }}
            >
              {/* Icon Container */}
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background: "#F7F0E9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  boxShadow: "0 4px 14px rgba(73, 46, 34, 0.06)",
                }}
              >
                {feat.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: "1.08rem",
                  fontWeight: 700,
                  color: "#231a15",
                  marginBottom: 10,
                }}
              >
                {feat.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "#705649",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {feat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Doctor Consultation Banner */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            padding: "24px 32px",
            border: "1px dashed rgba(122, 75, 96, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h4
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#172343",
                margin: "0 0 4px",
              }}
            >
              نیاز به راهنمایی در انتخاب فرمولاسیون مناسب دارید؟
            </h4>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#705649",
                margin: 0,
              }}
            >
              کارشناسان بالینی و مشاوره پوست ما برای پاسخ به سؤالات و تحلیل نیازهای پوستی شما آماده‌اند.
            </p>
          </div>

          <Link
            href="/support"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 14,
              background: "#7A4B60",
              color: "#FFFFFF",
              fontSize: "0.9rem",
              fontWeight: 700,
              textDecoration: "none",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#653C4F")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#7A4B60")}
          >
            <span>دریافت مشاوره تخصصی پوست</span>
            <span>‹</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
