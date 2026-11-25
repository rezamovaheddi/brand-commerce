"use client";

import React from "react";
import Link from "next/link";

interface CategoryItem {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: "face",
    name: "مراقبت صورت",
    href: "/products?category=cleansers",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.6" />
        <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.6" />
      </svg>
    ),
  },
  {
    id: "hair",
    name: "مراقبت مو",
    href: "/products?category=hair",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: "body",
    name: "بهداشت بدن",
    href: "/products?category=moisturizers",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        <path d="M7.5 12.5h2.2l1.3-2.5 1.8 5 1.4-2.5h2.3" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "sun",
    name: "ضد آفتاب",
    href: "/products?category=sunscreens",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    ),
  },
  {
    id: "serums",
    name: "سرم‌های درمانی",
    href: "/products?category=serums",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
];

export default function CategoryGrid() {
  return (
    <section
      className="dermalight-categories-section"
      style={{
        position: "relative",
        zIndex: 10,
        backgroundColor: "#FFFFFF",
        paddingBlock: "clamp(56px, 8vw, 92px)",
        width: "100%",
      }}
    >
      <div className="container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Section Header */}
        <div style={{ textAlign: "right", marginBottom: "clamp(32px, 4.5vw, 48px)" }}>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)",
              fontWeight: 800,
              color: "#1A2254",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            دسته‌بندی محصولات
          </h2>
          <p
            style={{
              fontSize: "1rem",
              color: "#64748B",
              margin: 0,
            }}
          >
            براساس نیاز خود جستجو کنید
          </p>
        </div>

        {/* 5 Larger Sharp-Cornered Category Cards with Richer Blue Tint and Increased Spacing */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "clamp(20px, 2.8vw, 36px)",
          }}
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              style={{
                backgroundColor: "#E2EEFD",
                borderRadius: 0,
                border: "none",
                minHeight: "clamp(230px, 26vw, 280px)",
                padding: "clamp(38px, 4.5vw, 56px) 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 22,
                textDecoration: "none",
                transition: "all 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 4px 16px rgba(37, 99, 235, 0.06)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.backgroundColor = "#D4E6FC";
                e.currentTarget.style.boxShadow = "0 18px 40px rgba(37, 99, 235, 0.16)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.backgroundColor = "#E2EEFD";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(37, 99, 235, 0.06)";
              }}
            >
              {/* White Icon Circle Badge */}
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 20px rgba(37, 99, 235, 0.1)",
                }}
              >
                {cat.icon}
              </div>

              {/* Title */}
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(1.1rem, 1.35vw, 1.25rem)",
                  fontWeight: 800,
                  color: "#1E293B",
                  textAlign: "center",
                  letterSpacing: "-0.01em",
                }}
              >
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
