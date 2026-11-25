"use client";

import React from "react";
import Link from "next/link";

export default function WhyDermatologists() {
  return (
    <section
      className="dermalight-why-section"
      style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        paddingBlock: "clamp(64px, 8vw, 110px)",
        background: "radial-gradient(circle at 6% 50%, rgba(200, 180, 230, 0.28) 0%, transparent 45%), radial-gradient(circle at 94% 50%, rgba(200, 180, 230, 0.28) 0%, transparent 45%), #FFFFFF",
        overflow: "hidden",
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 clamp(20px, 4vw, 48px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "clamp(36px, 5vw, 64px)",
          alignItems: "center",
        }}
      >
        {/* Column 1 in RTL: Right side -> Asymmetrical Staggered 2-Column Cards Grid matching Figma */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(170px, 1fr))",
            gap: "clamp(20px, 2.5vw, 30px)",
            width: "100%",
            alignItems: "start",
          }}
        >
          {/* Right Sub-Column in RTL: Taller cards starting at top */}
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px, 2.5vw, 30px)" }}>
            {/* 1. فرمولاسیون گیاهی (Taller) */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 26,
                border: "2px solid #52278F",
                padding: "clamp(36px, 4.2vw, 48px) 22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                justifyContent: "center",
                gap: 16,
                minHeight: "clamp(220px, 24vw, 270px)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 8px 24px rgba(82, 39, 143, 0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 18px 36px rgba(82, 39, 143, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(82, 39, 143, 0.04)";
              }}
            >
              {/* Green Leaf Icon */}
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
              <h3 style={{ fontSize: "clamp(1.1rem, 1.35vw, 1.25rem)", fontWeight: 800, color: "#1A2254", margin: 0 }}>
                فرمولاسیون گیاهی
              </h3>
              <p style={{ fontSize: "clamp(0.82rem, 1vw, 0.88rem)", color: "#64748B", lineHeight: 1.6, margin: 0, maxWidth: "230px" }}>
                استفاده از عصاره‌های طبیعی و ارگانیک در تمامی محصولات
              </p>
            </div>

            {/* 2. ضمانت اصالت (Taller) */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 26,
                border: "2px solid #52278F",
                padding: "clamp(36px, 4.2vw, 48px) 22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                justifyContent: "center",
                gap: 16,
                minHeight: "clamp(220px, 24vw, 270px)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 8px 24px rgba(82, 39, 143, 0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 18px 36px rgba(82, 39, 143, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(82, 39, 143, 0.04)";
              }}
            >
              {/* Blue Shield Icon */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <h3 style={{ fontSize: "clamp(1.1rem, 1.35vw, 1.25rem)", fontWeight: 800, color: "#1A2254", margin: 0 }}>
                ضمانت اصالت
              </h3>
              <p style={{ fontSize: "clamp(0.82rem, 1vw, 0.88rem)", color: "#64748B", lineHeight: 1.6, margin: 0, maxWidth: "230px" }}>
                تضمین ۱۰۰٪ اورجینال بودن تمامی برندهای موجود در سایت
              </p>
            </div>
          </div>

          {/* Left Sub-Column in RTL: Shorter cards shifted downward (staggered) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px, 2.5vw, 30px)", marginTop: "clamp(36px, 4.5vw, 52px)" }}>
            {/* 3. بدون تست حیوانی (Shorter) */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 26,
                border: "2px solid #52278F",
                padding: "clamp(26px, 3.2vw, 36px) 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                justifyContent: "center",
                gap: 14,
                minHeight: "clamp(180px, 19vw, 215px)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 8px 24px rgba(82, 39, 143, 0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 18px 36px rgba(82, 39, 143, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(82, 39, 143, 0.04)";
              }}
            >
              {/* Orange Rabbit Icon */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.5 4.5c.8-1.5 2.2-2.5 3.8-2 1.5.5 2 2.5 1 4.5l-1.3 2.5" />
                <path d="M11 6.5c1-1.8 2.5-3 4-2.5 1.5.5 1.8 2.2.8 4l-1.8 3" />
                <path d="M8.5 11c-2 0-3.5 1.2-4 2.8-.6 1.8.2 3.8 2 4.5 1 .4 2 .2 3-.5l2 1.7c1.5 1.2 3.8 1 5-.5 1-1.2 1-3-.2-4.2l-1.3-1.3c-.8-.8-1.8-1.5-3-1.8" />
                <circle cx="7.5" cy="13.5" r="0.8" fill="#F97316" />
              </svg>
              <h3 style={{ fontSize: "clamp(1.05rem, 1.3vw, 1.2rem)", fontWeight: 800, color: "#1A2254", margin: 0 }}>
                بدون تست حیوانی
              </h3>
              <p style={{ fontSize: "clamp(0.82rem, 1vw, 0.88rem)", color: "#64748B", lineHeight: 1.6, margin: 0, maxWidth: "220px" }}>
                حمایت از محیط زیست و احترام به حقوق تمامی حیوانات
              </p>
            </div>

            {/* 4. پشتوانه علمی (Shorter) */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 26,
                border: "2px solid #52278F",
                padding: "clamp(26px, 3.2vw, 36px) 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                justifyContent: "center",
                gap: 14,
                minHeight: "clamp(180px, 19vw, 215px)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 8px 24px rgba(82, 39, 143, 0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 18px 36px rgba(82, 39, 143, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(82, 39, 143, 0.04)";
              }}
            >
              {/* Blue Microscope Icon */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18h8" />
                <path d="M3 22h18" />
                <path d="M14 22a7 7 0 1 0 0-14h-1" />
                <path d="M9 14h2" />
                <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
                <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
              </svg>
              <h3 style={{ fontSize: "clamp(1.05rem, 1.3vw, 1.2rem)", fontWeight: 800, color: "#1A2254", margin: 0 }}>
                پشتوانه علمی
              </h3>
              <p style={{ fontSize: "clamp(0.82rem, 1vw, 0.88rem)", color: "#64748B", lineHeight: 1.6, margin: 0, maxWidth: "220px" }}>
                تولید تحت نظارت دقیق آزمایشگاه‌های پیشرفته اروپایی
              </p>
            </div>
          </div>
        </div>

        {/* Column 2 in RTL: Left side -> Main Headline, Paragraph Description, and CTA Button */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: "540px",
            textAlign: "right",
          }}
        >
          {/* Main Title with blue highlighted 'درمالایت' and wavy underline */}
          <h2
            style={{
              fontSize: "clamp(1.8rem, 2.8vw, 2.45rem)",
              fontWeight: 800,
              color: "#1A2254",
              lineHeight: 1.4,
              marginBottom: 20,
              letterSpacing: "-0.02em",
            }}
          >
            چرا متخصصان پوست
            <br />
            <span
              style={{
                position: "relative",
                display: "inline-block",
                color: "#0284C7",
                marginInline: "4px",
              }}
            >
              درمالایت
              {/* Wavy Underline matching design */}
              <svg
                width="100%"
                height="8"
                viewBox="0 0 100 8"
                fill="none"
                style={{
                  position: "absolute",
                  bottom: -6,
                  left: 0,
                  right: 0,
                  width: "100%",
                }}
              >
                <path
                  d="M2 5C6 2.5 10 2.5 14 5C18 7.5 22 7.5 26 5C30 2.5 34 2.5 38 5C42 7.5 46 7.5 50 5C54 2.5 58 2.5 62 5C66 7.5 70 7.5 74 5C78 2.5 82 2.5 86 5C90 7.5 94 7.5 98 5"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            را انتخاب می‌کنند؟
          </h2>

          {/* Description Paragraph */}
          <p
            style={{
              fontSize: "clamp(0.92rem, 1.1vw, 1.02rem)",
              color: "#5A6A85",
              lineHeight: 1.85,
              marginBottom: 32,
              letterSpacing: "-0.01em",
            }}
          >
            سال‌ها تجربه در بازار درموکازمتیک به ما آموخته است که سلامت پوست، چیزی فراتر از زیبایی ظاهری است. ما با گلچین کردن بهترین برندهایی که تمرکزشان بر سلامت سلولی است، به شما کمک می‌کنیم تا نسخه بهتری از خودتان باشید.
          </p>

          {/* CTA Button */}
          <div>
            <Link
              href="/about"
              style={{
                display: "inline-block",
                padding: "13px 32px",
                borderRadius: 14,
                background: "#4C248A",
                color: "#FFFFFF",
                fontSize: "0.98rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(76, 36, 138, 0.28)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(76, 36, 138, 0.38)";
                e.currentTarget.style.background = "#3E1B73";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(76, 36, 138, 0.28)";
                e.currentTarget.style.background = "#4C248A";
              }}
            >
              بیشتر درباره ما بدانید
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
