"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart/CartProvider";

interface SpecialProduct {
  id: string;
  slug: string;
  sku: string;
  brand: string;
  title: string;
  image: string;
  isSpecial?: boolean;
  hasWishlist?: boolean;
}

const SPECIAL_PRODUCTS: SpecialProduct[] = [
  {
    id: "sp-1",
    slug: "ethereal-hyaluronic-serum",
    sku: "DMV-SRM-30H",
    brand: "برند لاروش پوزی",
    title: "سرم آبرسان هیالورونیک اسید B5",
    image: "/images/product_serum_b5.png",
    hasWishlist: true,
  },
  {
    id: "sp-2",
    slug: "ethereal-fluid-sunscreen-spf50",
    sku: "DMV-SUN-50F",
    brand: "برند ویشی",
    title: "کرم ضد آفتاب فاقد چربی مدال اس",
    image: "/images/product_sunscreen.png",
    isSpecial: true,
  },
  {
    id: "sp-3",
    slug: "ethereal-gentle-cleanser",
    sku: "DMV-CLN-150",
    brand: "برند بایودرما",
    title: "ژل شستشوی صورت پوست چرب",
    image: "/images/product_cleanser.png",
  },
  {
    id: "sp-4",
    slug: "ethereal-barrier-cream",
    sku: "DMV-MST-50",
    brand: "برند اوردینری",
    title: "لایه بردار شیمیایی قوی AHA/BHA",
    image: "/images/product_aha_bha.png",
  },
];

export default function SpecialOffers() {
  const { add, openDrawer } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  const handleAddToCart = async (product: SpecialProduct) => {
    setAddingId(product.id);
    try {
      await add(product.sku, 1);
      openDrawer();
    } catch {
      window.location.href = `/products/${product.slug}`;
    } finally {
      setTimeout(() => setAddingId(null), 500);
    }
  };

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section
      className="dermalight-special-offers-section"
      style={{
        position: "relative",
        zIndex: 10,
        backgroundColor: "#FFFFFF",
        paddingBlock: "clamp(60px, 8vw, 96px)",
        width: "100%",
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
          padding: "0 clamp(20px, 4vw, 48px)",
          width: "100%",
        }}
      >
        {/* Section Header: Centered */}
        <div style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 56px)" }}>
          <h2
            style={{
              fontSize: "clamp(1.7rem, 2.7vw, 2.3rem)",
              fontWeight: 800,
              color: "#1A2254",
              marginBottom: 10,
              letterSpacing: "-0.02em",
            }}
          >
            پیشنهادات ویژه درمالایت
          </h2>
          <p
            style={{
              fontSize: "clamp(0.92rem, 1.1vw, 1.02rem)",
              color: "#64748B",
              maxWidth: "680px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            محبوب‌ترین و موثرترین محصولات مراقبتی برگزیده توسط کاربران ما در ماه گذشته
          </p>
        </div>

        {/* Full-width 4 Product Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "clamp(24px, 3vw, 36px)",
            marginBottom: "clamp(36px, 5vw, 52px)",
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
                {/* Soft Lavender Layered Backdrop matching design */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 26,
                    backgroundColor: "#D3C8E4",
                    transform: "translate(-8px, 10px)",
                    zIndex: 1,
                    opacity: 0.9,
                    transition: "transform 0.25s ease",
                  }}
                />

                {/* Main White Product Card */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    background: "#FFFFFF",
                    borderRadius: 26,
                    padding: "16px 16px 20px",
                    border: "1px solid rgba(226, 232, 240, 0.9)",
                    boxShadow: "0 10px 28px rgba(0, 0, 0, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 18px 40px rgba(82, 39, 155, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 10px 28px rgba(0, 0, 0, 0.04)";
                  }}
                >
                  {/* Top Image Box */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 240,
                      borderRadius: 20,
                      overflow: "hidden",
                      backgroundColor: "#F8FAFC",
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

                    {/* Wishlist Heart Button for item 1 */}
                    {item.hasWishlist && (
                      <button
                        type="button"
                        onClick={(e) => toggleWishlist(item.id, e)}
                        aria-label="افزودن به لیست علاقه‌مندی"
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.92)",
                          backdropFilter: "blur(6px)",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: isWished ? "#DC2626" : "#64748B",
                          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
                          transition: "color 0.2s, transform 0.2s",
                          zIndex: 3,
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={isWished ? "#DC2626" : "none"}
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    )}

                    {/* Special Coral Badge for item 2 */}
                    {item.isSpecial && (
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          padding: "4px 12px",
                          borderRadius: 9999,
                          backgroundColor: "#EF4444",
                          color: "#FFFFFF",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          zIndex: 3,
                          boxShadow: "0 4px 10px rgba(239, 68, 68, 0.3)",
                        }}
                      >
                        ویژه
                      </div>
                    )}
                  </div>

                  {/* Content Details */}
                  <div>
                    {/* Brand Tag */}
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        color: "#2563EB",
                        marginBottom: 6,
                        textAlign: "right",
                      }}
                    >
                      {item.brand}
                    </span>

                    {/* Product Title */}
                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 800,
                        color: "#1A2254",
                        lineHeight: 1.5,
                        marginBottom: 18,
                        minHeight: "3rem",
                        textAlign: "right",
                      }}
                    >
                      <Link href={`/products/${item.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                        {item.title}
                      </Link>
                    </h3>
                  </div>

                  {/* Bottom Action Bar: Text on Right, Plus button on Left */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 12,
                      borderTop: "1px solid #F1F5F9",
                    }}
                  >
                    {/* Plus Icon Button on left in RTL */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      aria-label={`افزودن ${item.title} به سبد خرید`}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isAdding ? "#16A34A" : "#EFF6FF",
                        color: isAdding ? "#FFFFFF" : "#2563EB",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isAdding) {
                          e.currentTarget.style.backgroundColor = "#2563EB";
                          e.currentTarget.style.color = "#FFFFFF";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isAdding) {
                          e.currentTarget.style.backgroundColor = "#EFF6FF";
                          e.currentTarget.style.color = "#2563EB";
                        }
                      }}
                    >
                      {isAdding ? "✓" : "+"}
                    </button>

                    {/* Order Link / Action on right in RTL */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: "#1A2254",
                        cursor: "pointer",
                        padding: 0,
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#2563EB")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#1A2254")}
                    >
                      {isAdding ? "در حال افزودن..." : "ثبت سفارش"}
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
              gap: 8,
              fontSize: "0.98rem",
              fontWeight: 800,
              color: "#1A2254",
              textDecoration: "underline",
              textUnderlineOffset: 8,
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#2563EB")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#1A2254")}
          >
            <span>مشاهده تمامی محصولات کاتالوگ</span>
            <span style={{ fontSize: "1.1rem" }}>‹</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
