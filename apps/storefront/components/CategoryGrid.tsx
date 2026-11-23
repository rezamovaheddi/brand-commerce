"use client";

import React from "react";
import Link from "next/link";

interface CategoryItem {
  id: string;
  name: string;
  countHint: string;
  href: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: "serums",
    name: "سرم‌های درمانی و اسیدها",
    countHint: "ویتامین C، نیاسینامید، هیالورونیک",
    href: "/products?category=serums",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A4B60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    id: "cleansers",
    name: "پاک‌کننده‌های ملایم",
    countHint: "ژل و شیر پاک‌کننده با pH فیزیولوژیک",
    href: "/products?category=cleansers",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A4B60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
        <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: "moisturizers",
    name: "مرطوب‌کننده‌ها و کرم‌ها",
    countHint: "ترمیم سد دفاعی و آبرسانی ۲۴ ساعته",
    href: "/products?category=moisturizers",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A4B60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M12 5v14" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: "sunscreens",
    name: "ضدآفتاب و فلوئید محافظ",
    countHint: "حفاظت وسیع‌الطیف SPF 50+ بدون چربی",
    href: "/products?category=sunscreens",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A4B60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
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
    id: "b2b",
    name: "سفارشات سازمانی و B2B",
    countHint: "استعلام قیمت کلینیکال و OEM",
    href: "/b2b/rfq",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A4B60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    id: "catalog",
    name: "مشاهده کل کاتالوگ",
    countHint: "۸ فرمولاسیون فعال بالینی",
    href: "/products",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A4B60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

export default function CategoryGrid() {
  return (
    <section
      className="dermalight-categories-section"
      style={{
        paddingBlock: "clamp(48px, 6vw, 72px)",
        width: "100%",
      }}
    >
      <div className="container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Section Header */}
        <div style={{ textAlign: "right", marginBottom: "clamp(24px, 3.5vw, 36px)" }}>
          <h2
            style={{
              fontSize: "clamp(1.4rem, 2.2vw, 1.85rem)",
              fontWeight: 800,
              color: "#172343",
              marginBottom: 6,
              letterSpacing: "-0.02em",
            }}
          >
            دسته‌بندی فرمولاسیون‌های بالینی
          </h2>
          <p
            style={{
              fontSize: "0.95rem",
              color: "#705649",
              margin: 0,
            }}
          >
            بر اساس نوع درمان، مرحله روتین یا نیاز بالینی پوست خود انتخاب کنید
          </p>
        </div>

        {/* 6 Category Cards in a Responsive Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "clamp(14px, 2vw, 24px)",
          }}
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              style={{
                background: "#FAF7F3",
                borderRadius: 24,
                padding: "clamp(24px, 3vw, 34px) 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                textDecoration: "none",
                transition: "all 0.25s ease",
                border: "1px solid rgba(216, 200, 188, 0.7)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.background = "#FFFFFF";
                e.currentTarget.style.boxShadow = "0 14px 32px rgba(122, 75, 96, 0.12)";
                e.currentTarget.style.borderColor = "#7A4B60";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "#FAF7F3";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "rgba(216, 200, 188, 0.7)";
              }}
            >
              {/* Icon Circle */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(73, 46, 34, 0.06)",
                  border: "1px solid rgba(216, 200, 188, 0.5)",
                }}
              >
                {cat.icon}
              </div>

              {/* Title & Hint */}
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.98rem",
                    fontWeight: 700,
                    color: "#231a15",
                    marginBottom: 4,
                  }}
                >
                  {cat.name}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.76rem",
                    color: "#705649",
                    lineHeight: 1.4,
                  }}
                >
                  {cat.countHint}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
