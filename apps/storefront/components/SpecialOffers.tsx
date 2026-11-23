"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart/CartProvider";
import SampleBadge from "./SampleBadge";

interface SpecialProduct {
  id: string;
  slug: string;
  sku: string;
  brand: string;
  title: string;
  volumeHint: string;
  image: string;
  isSpecial?: boolean;
}

const SPECIAL_PRODUCTS: SpecialProduct[] = [
  {
    id: "sp-1",
    slug: "ethereal-hyaluronic-serum",
    sku: "DMV-SRM-30H",
    brand: "فرمولاسیون DERMAVIA",
    title: "سرم آبرسان سه‌وزنی هیالورونیک اسید",
    volumeHint: "حجم ۳۰ میلی‌لیتر • بدون بو",
    image: "/images/product_serum_b5.png",
  },
  {
    id: "sp-2",
    slug: "ethereal-fluid-sunscreen-spf50",
    sku: "DMV-SUN-50F",
    brand: "فرمولاسیون DERMAVIA",
    title: "فلوئید ضدآفتاب SPF 50+ بی‌رنگ و سبک",
    volumeHint: "حجم ۵۰ میلی‌لیتر • فاقد چربی",
    image: "/images/product_sunscreen.png",
    isSpecial: true,
  },
  {
    id: "sp-3",
    slug: "ethereal-gentle-cleanser",
    sku: "DMV-CLN-150",
    brand: "فرمولاسیون DERMAVIA",
    title: "ژل شست‌وشوی ملایم صورت با pH متعادل",
    volumeHint: "حجم ۱۵۰ میلی‌لیتر • بدون سولفات",
    image: "/images/product_cleanser.png",
  },
  {
    id: "sp-4",
    slug: "ethereal-barrier-cream",
    sku: "DMV-MST-50",
    brand: "فرمولاسیون DERMAVIA",
    title: "کرم ترمیم‌کننده و تقویت سد دفاعی پوست",
    volumeHint: "حجم ۵۰ میلی‌لیتر • غنی از سرامید",
    image: "/images/product_aha_bha.png",
  },
];

export default function SpecialOffers() {
  const { add } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  const handleAddToCart = async (product: SpecialProduct) => {
    setAddingId(product.id);
    try {
      await add(product.sku, 1);
    } catch {
      window.location.href = `/products/${product.slug}`;
    } finally {
      setTimeout(() => setAddingId(null), 600);
    }
  };

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section
      className="dermalight-special-offers-section"
      style={{
        paddingBlock: "clamp(36px, 5vw, 64px)",
        width: "100%",
      }}
    >
      <div className="container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Soft Parchment Card Container */}
        <div
          style={{
            background: "#FAF7F3",
            borderRadius: 36,
            padding: "clamp(32px, 5vw, 56px) clamp(20px, 4vw, 44px)",
            border: "1px solid rgba(216, 200, 188, 0.7)",
            boxShadow: "0 20px 50px rgba(73, 46, 34, 0.05)",
          }}
        >
          {/* Section Header */}
          <div style={{ textAlign: "center", marginBottom: "clamp(28px, 4vw, 44px)" }}>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 2.5vw, 2.1rem)",
                fontWeight: 800,
                color: "#172343",
                marginBottom: 8,
                letterSpacing: "-0.02em",
              }}
            >
              فرمولاسیون‌های منتخب بالینی DERMAVIA
            </h2>
            <p
              style={{
                fontSize: "0.95rem",
                color: "#705649",
                maxWidth: "640px",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              مؤثرترین ترکیبات مراقبتی با درصد غلظت اثبات‌شده بالینی و شفافیت کامل در اجزای تشکیل‌دهنده
            </p>
          </div>

          {/* 4 Product Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "clamp(20px, 2.5vw, 28px)",
              marginBottom: 36,
            }}
          >
            {SPECIAL_PRODUCTS.map((item) => {
              const isWished = wishlist[item.id];
              const isAdding = addingId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    position: "relative",
                  }}
                >
                  {/* Subtle layered backdrop under card matching warm aesthetic */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 24,
                      backgroundColor: "#EFE5DE",
                      transform: "translate(-6px, 8px)",
                      zIndex: 1,
                      opacity: 0.7,
                      transition: "transform 0.25s ease",
                    }}
                  />

                  {/* Main Product Card */}
                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      background: "#FFFFFF",
                      borderRadius: 24,
                      padding: 16,
                      border: "1px solid rgba(216, 200, 188, 0.8)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                      transition: "all 0.25s ease",
                    }}
                  >
                    {/* Top Image Box with Wishlist & Badge */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: 220,
                        borderRadius: 18,
                        overflow: "hidden",
                        backgroundColor: "#F7F0E9",
                        marginBottom: 16,
                      }}
                    >
                      <Link href={`/products/${item.slug}`}>
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 25vw"
                          style={{ objectFit: "cover" }}
                        />
                      </Link>

                      {/* Wishlist Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleWishlist(item.id, e)}
                        aria-label="افزودن به لیست علاقه‌مندی"
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.88)",
                          backdropFilter: "blur(6px)",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: isWished ? "#A12B2B" : "#705649",
                          transition: "color 0.2s, transform 0.2s",
                          zIndex: 3,
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={isWished ? "#A12B2B" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      {/* Sample Badge */}
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          zIndex: 3,
                        }}
                      >
                        <SampleBadge />
                      </div>
                    </div>

                    {/* Content Details */}
                    <div>
                      {/* Brand Tag */}
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "#7A4B60",
                          marginBottom: 6,
                        }}
                      >
                        {item.brand}
                      </span>

                      {/* Product Title */}
                      <h3
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#231a15",
                          lineHeight: 1.5,
                          marginBottom: 8,
                          minHeight: "3rem",
                        }}
                      >
                        <Link href={`/products/${item.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                          {item.title}
                        </Link>
                      </h3>

                      {/* Volume Hint */}
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#705649",
                          margin: "0 0 14px",
                        }}
                      >
                        {item.volumeHint}
                      </p>
                    </div>

                    {/* Bottom Action: "مشاهده و ثبت سفارش" */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 12,
                        borderTop: "1px solid rgba(216, 200, 188, 0.4)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: 12,
                          background: isAdding ? "#276749" : "transparent",
                          color: isAdding ? "#FFFFFF" : "#172343",
                          border: "none",
                          fontWeight: 700,
                          fontSize: "0.92rem",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isAdding) e.currentTarget.style.color = "#7A4B60";
                        }}
                        onMouseLeave={(e) => {
                          if (!isAdding) e.currentTarget.style.color = "#172343";
                        }}
                      >
                        <span>{isAdding ? "در حال انتقال به محصول..." : "مشاهده و ثبت سفارش"}</span>

                        {/* Arrow Icon */}
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: isAdding ? "rgba(255,255,255,0.3)" : "rgba(122, 75, 96, 0.1)",
                            color: isAdding ? "#FFFFFF" : "#7A4B60",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1rem",
                            fontWeight: 600,
                          }}
                        >
                          ‹
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Catalog Link */}
          <div style={{ textAlign: "center" }}>
            <Link
              href="/products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#172343",
                textDecoration: "underline",
                textUnderlineOffset: 6,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#7A4B60")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#172343")}
            >
              <span>مشاهده تمامی فرمولاسیون‌های کاتالوگ درماویا</span>
              <span>‹</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
