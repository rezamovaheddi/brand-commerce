"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart/CartProvider";

interface HeroProductVariant {
  id: string;
  name: string;
  subtitle: string;
  heroImage: string;
  thumbImage: string;
  sku: string;
  slug: string;
}

const HERO_VARIANTS: HeroProductVariant[] = [
  {
    id: "tube",
    name: "کرم مرطوب‌کننده و بازسازی‌کننده سلولی",
    subtitle: "فرمولاسیون غنی از سرامیدهای خالص و شی‌باتر ارگانیک",
    heroImage: "/images/hero_tube_swirl.png",
    thumbImage: "/images/hero_thumb_tube.png",
    sku: "DMV-MST-50",
    slug: "ethereal-barrier-cream",
  },
  {
    id: "pump",
    name: "لوسیون بدن عمیقاً هیدراته‌کننده",
    subtitle: "تغذیه ۲۴ ساعته سد دفاعی پوست با بافت ابریشمی و بدون چربی",
    heroImage: "/images/hero_pump.png",
    thumbImage: "/images/hero_thumb_pump.png",
    sku: "DMV-MST-100",
    slug: "ethereal-light-moisturizer",
  },
  {
    id: "jar",
    name: "کرم جوانساز و ضدچروک اکسیر شب",
    subtitle: "تحریک بیوسنتز کلاژن با ریزپپتیدها و نیاسینامید خالص",
    heroImage: "/images/hero_jar.png",
    thumbImage: "/images/hero_thumb_jar.png",
    sku: "DMV-MST-50",
    slug: "ethereal-barrier-cream",
  },
  {
    id: "dropper",
    name: "سرم تغذیه‌کننده ویتامینه و اسید هیالورونیک",
    subtitle: "روشن‌کننده قوی و آنتی‌اکسیدان محافظت‌کننده در برابر آلودگی",
    heroImage: "/images/hero_dropper.png",
    thumbImage: "/images/hero_thumb_dropper.png",
    sku: "DMV-SRM-30H",
    slug: "ethereal-hyaluronic-serum",
  },
];

export default function HomeHero() {
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const { add, openDrawer } = useCart();
  const currentVariant = HERO_VARIANTS[activeVariantIndex];

  const handleQuickAdd = async () => {
    try {
      await add(currentVariant.sku, 1);
      openDrawer();
    } catch {
      window.location.href = `/products/${currentVariant.slug}`;
    }
  };

  return (
    <section
      className="dermalight-hero-section"
      style={{
        position: "relative",
        minHeight: "clamp(540px, 62vw, 760px)",
        width: "100%",
        overflow: "hidden",
        background: "radial-gradient(ellipse 90% 80% at 75% 45%, rgba(246, 230, 240, 0.45) 0%, rgba(255, 255, 255, 1) 75%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        paddingTop: "clamp(80px, 12vw, 140px)",
        paddingBottom: "clamp(24px, 4vw, 48px)",
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          width: "100%",
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Right-aligned Main Hero Product Visual */}
        <div
          style={{
            position: "absolute",
            top: "clamp(10px, 3vw, 40px)",
            left: "clamp(20px, 6vw, 80px)",
            width: "clamp(280px, 36vw, 540px)",
            height: "clamp(340px, 44vw, 620px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          {/* Soft Circular Amethyst/Rose Glow behind Product */}
          <div
            style={{
              position: "absolute",
              width: "clamp(260px, 32vw, 480px)",
              height: "clamp(260px, 32vw, 480px)",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(229, 200, 213, 0.75) 0%, rgba(242, 222, 232, 0.35) 55%, transparent 75%)",
              filter: "blur(40px)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          {/* Product Image with smooth transition */}
          <div
            key={currentVariant.id}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              zIndex: 2,
              animation: "fadeInScale 0.45s ease-out forwards",
            }}
          >
            <Image
              src={currentVariant.heroImage}
              alt={currentVariant.name}
              fill
              priority
              sizes="(max-width: 768px) 80vw, 45vw"
              style={{
                objectFit: "contain",
                filter: "drop-shadow(0 20px 35px rgba(110, 80, 100, 0.18))",
              }}
            />
          </div>
        </div>

        {/* Hero Branding / Headline Area (Subtle Clinical Elegance) */}
        <div
          style={{
            maxWidth: "600px",
            marginRight: 0,
            zIndex: 12,
            paddingTop: "clamp(20px, 4vw, 60px)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 9999,
              background: "rgba(82, 39, 155, 0.08)",
              border: "1px solid rgba(82, 39, 155, 0.18)",
              color: "#52279B",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            <span>✨</span>
            <span>نوآوری درموکازمتیک با پشتوانه بالینی</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(1.8rem, 3.2vw, 2.7rem)",
              fontWeight: 800,
              color: "#1A2254",
              lineHeight: 1.35,
              marginBottom: 14,
              letterSpacing: "-0.02em",
            }}
          >
            زیبایی اصیل پوست؛
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #52279B 0%, #0284C7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              فرمولاسیون علمی با جذب سلولی
            </span>
          </h1>

          <p
            style={{
              fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
              color: "#5A6A85",
              lineHeight: 1.8,
              maxWidth: "500px",
              marginBottom: 24,
            }}
          >
            {currentVariant.subtitle}. ترکیبی هم‌افزا از فناوری نانوپپتیدها و عصاره‌های ناب برای احیای سلامت و شادابی درخشان پوست شما.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="button"
              onClick={handleQuickAdd}
              style={{
                padding: "12px 26px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #52279B 0%, #431E82 100%)",
                color: "#FFFFFF",
                fontSize: "0.98rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 22px rgba(82, 39, 155, 0.28)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(82, 39, 155, 0.38)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 22px rgba(82, 39, 155, 0.28)";
              }}
            >
              ثبت سفارش مستقیم
            </button>

            <Link
              href="/products"
              style={{
                padding: "12px 22px",
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.9)",
                border: "1.5px solid #CBD5E1",
                color: "#1A2254",
                fontSize: "0.95rem",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#52279B";
                e.currentTarget.style.color = "#52279B";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#CBD5E1";
                e.currentTarget.style.color = "#1A2254";
              }}
            >
              مشاهده کاتالوگ
            </Link>
          </div>
        </div>

        {/* Bottom Interactive 4-Product Thumbnail Selector */}
        <div
          style={{
            zIndex: 15,
            paddingTop: "clamp(30px, 5vw, 60px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(18px, 3.5vw, 42px)",
              padding: "10px 16px",
              background: "rgba(255, 255, 255, 0.75)",
              backdropFilter: "blur(12px)",
              borderRadius: 22,
              border: "1px solid rgba(226, 232, 240, 0.8)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
            }}
          >
            {HERO_VARIANTS.map((item, idx) => {
              const isSelected = idx === activeVariantIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveVariantIndex(idx)}
                  aria-label={`انتخاب محصول ${item.name}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    position: "relative",
                    transition: "transform 0.2s ease",
                    transform: isSelected ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  <div
                    style={{
                      width: "clamp(46px, 5vw, 64px)",
                      height: "clamp(58px, 6.5vw, 84px)",
                      position: "relative",
                      filter: isSelected ? "drop-shadow(0 6px 14px rgba(82, 39, 155, 0.25))" : "grayscale(25%) opacity(0.8)",
                      transition: "filter 0.2s ease",
                    }}
                  >
                    <Image
                      src={item.thumbImage}
                      alt={item.name}
                      fill
                      sizes="64px"
                      style={{ objectFit: "contain" }}
                    />
                  </div>

                  {/* Active Indicator Bar matching node_11_35.svg */}
                  <div
                    style={{
                      width: "clamp(40px, 4vw, 54px)",
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: isSelected ? "#52279B" : "transparent",
                      transition: "background-color 0.25s ease",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
