"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCart } from "./cart/CartProvider";
import { useCanopy } from "./CanopyContext";

interface HeroProductVariant {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  sku: string;
  slug: string;
  productImage: string;
  swatchImage: string;
  thumbImage: string;
  productTransform: string;
  productWidth: string;
  productHeight: string;
  productOffset: { top?: string; bottom?: string; left?: string; right?: string };
  swatchTransform: string;
  swatchWidth: string;
  swatchHeight: string;
  swatchOffset: { top?: string; bottom?: string; left?: string; right?: string };
}

const HERO_VARIANTS: HeroProductVariant[] = [
  {
    id: "tube",
    name: "کرم مرطوب‌کننده و بازسازی‌کننده سلولی",
    subtitle: "فرمولاسیون غنی از سرامیدهای خالص و شی‌باتر ارگانیک",
    description: "ترمیم عمیق و پایدار سد دفاعی پوست با بافت کرمی غنی و آبرسانی مداوم ۲۴ ساعته.",
    sku: "DMV-MST-50",
    slug: "ethereal-barrier-cream",
    productImage: "/images/hero/item_tube.png",
    swatchImage: "/images/hero/swatch_cream.png",
    thumbImage: "/images/hero/item_tube.png",
    productTransform: "translate(-50%, -50%) rotate(-28deg)",
    productWidth: "clamp(210px, 24vw, 300px)",
    productHeight: "clamp(330px, 37vw, 470px)",
    productOffset: { top: "45%", left: "47%" },
    swatchTransform: "translate(-50%, -50%) rotate(-20deg)",
    swatchWidth: "clamp(180px, 21vw, 270px)",
    swatchHeight: "clamp(250px, 29vw, 370px)",
    swatchOffset: { top: "66%", left: "56%" },
  },
  {
    id: "pump",
    name: "ژل و فوم شست‌وشوی ملایم صورت با pH متعادل",
    subtitle: "پاک‌کننده ملایم با فوم ابریشمی و بدون چربی",
    description: "فرمولاسیون اکسیژن‌رسان و پاک‌کننده منافذ با کف متراکم بدون ایجاد حس خشکی و کشیدگی.",
    sku: "DMV-CLN-150",
    slug: "ethereal-gentle-cleanser",
    productImage: "/images/hero/item_pump.png",
    swatchImage: "/images/hero/swatch_foam.png",
    thumbImage: "/images/hero/item_pump.png",
    productTransform: "translate(-50%, -50%) rotate(-26deg)",
    productWidth: "clamp(220px, 25vw, 310px)",
    productHeight: "clamp(340px, 38vw, 480px)",
    productOffset: { top: "44%", left: "48%" },
    swatchTransform: "translate(-50%, -50%) rotate(5deg)",
    swatchWidth: "clamp(220px, 25vw, 320px)",
    swatchHeight: "clamp(220px, 25vw, 320px)",
    swatchOffset: { top: "67%", left: "56%" },
  },
  {
    id: "jar",
    name: "کرم جوانساز و ضدچروک اکسیر شب",
    subtitle: "تحریک بیوسنتز کلاژن با ریزپپتیدها و نیاسینامید خالص",
    description: "بافت مخملی غنی از آنتی‌اکسیدان‌های فعال برای ترمیم بافت خسته و بازیابی شفافیت پوست در طول شب.",
    sku: "DMV-MST-50",
    slug: "ethereal-barrier-cream",
    productImage: "/images/hero/item_jar.png",
    swatchImage: "/images/hero/swatch_cream.png",
    thumbImage: "/images/hero/item_jar.png",
    productTransform: "translate(-50%, -50%) rotate(-18deg)",
    productWidth: "clamp(240px, 28vw, 350px)",
    productHeight: "clamp(240px, 28vw, 350px)",
    productOffset: { top: "45%", left: "47%" },
    swatchTransform: "translate(-50%, -50%) rotate(-25deg)",
    swatchWidth: "clamp(190px, 22vw, 280px)",
    swatchHeight: "clamp(260px, 30vw, 380px)",
    swatchOffset: { top: "66%", left: "56%" },
  },
  {
    id: "dropper",
    name: "سرم تغذیه‌کننده ویتامینه و اسید هیالورونیک",
    subtitle: "روشن‌کننده قوی و آنتی‌اکسیدان محافظت‌کننده در برابر آلودگی",
    description: "فرمولاسیون کنسانتره با جذب سلولی فوری برای شفاف‌سازی تن پوست و درخشش طبیعی روزانه.",
    sku: "DMV-SRM-30H",
    slug: "ethereal-hyaluronic-serum",
    productImage: "/images/hero/item_dropper.png",
    swatchImage: "/images/hero/swatch_gold.png",
    thumbImage: "/images/hero/item_dropper.png",
    productTransform: "translate(-50%, -50%) rotate(-28deg)",
    productWidth: "clamp(190px, 22vw, 280px)",
    productHeight: "clamp(340px, 39vw, 490px)",
    productOffset: { top: "44%", left: "48%" },
    swatchTransform: "translate(-50%, -50%) rotate(15deg)",
    swatchWidth: "clamp(230px, 26vw, 330px)",
    swatchHeight: "clamp(260px, 30vw, 380px)",
    swatchOffset: { top: "67%", left: "56%" },
  },
];

export default function HomeHero() {
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { add, openDrawer } = useCart();
  const { setCanopyIndex } = useCanopy();
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const visualBoxRef = useRef<HTMLDivElement | null>(null);
  const activeIndexRef = useRef<number>(0);
  const spinDirRef = useRef<number>(1);
  const isFirstMountRef = useRef<boolean>(true);

  const currentVariant = HERO_VARIANTS[activeVariantIndex];

  // Trigger GSAP rotational transition when switching to a different variant
  const switchVariantWithSpin = useCallback(
    (index: number) => {
      if (index === activeIndexRef.current) return;

      const prevIndex = activeIndexRef.current;
      activeIndexRef.current = index;

      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReduced || !visualBoxRef.current) {
        setActiveVariantIndex(index);
        setCanopyIndex(index);
        return;
      }

      spinDirRef.current = index > prevIndex ? 1 : -1;
      gsap.killTweensOf(visualBoxRef.current);
      gsap.to(visualBoxRef.current, {
        rotation: spinDirRef.current * -90,
        scale: 0.72,
        opacity: 0,
        duration: 0.24,
        ease: "power2.in",
        onComplete: () => {
          setActiveVariantIndex(index);
          setCanopyIndex(index);
        },
      });
    },
    [setCanopyIndex],
  );

  // Manual click on thumbnail
  const handleSelectVariant = (index: number) => {
    switchVariantWithSpin(index);
  };

  useEffect(() => {
    setCanopyIndex(0);
  }, [setCanopyIndex]);

  // GSAP ScrollTrigger: pin hero section & cycle through all 4 products on scroll,
  // then unpin naturally into the next catalog section (CategoryGrid).
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !heroSectionRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: heroSectionRef.current,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 2.4)}`,
        pin: true,
        anticipatePin: 1,
        scrub: 0.4,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
          const nextIdx = Math.min(
            HERO_VARIANTS.length - 1,
            Math.floor(self.progress * HERO_VARIANTS.length),
          );
          if (nextIdx !== activeIndexRef.current) {
            switchVariantWithSpin(nextIdx);
          }
        },
      });
    }, heroSectionRef);

    return () => ctx.revert();
  }, [switchVariantWithSpin]);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (!visualBoxRef.current) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        visualBoxRef.current,
        {
          rotation: spinDirRef.current * 90,
          scale: 0.72,
          opacity: 0,
        },
        {
          rotation: 0,
          scale: 1,
          opacity: 1,
          duration: 0.56,
          ease: "back.out(1.4)",
        },
      );
    });

    return () => ctx.revert();
  }, [activeVariantIndex]);

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
      ref={heroSectionRef}
      className="dermalight-hero-section"
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingTop: "clamp(90px, 11vw, 130px)",
        paddingBottom: "clamp(36px, 4vw, 60px)",
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
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "clamp(28px, 4vw, 56px)",
          alignItems: "center",
        }}
      >
        {/* Column 1 in RTL: Right side -> Dual-layer Floating Visual centered directly inside the circle */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "clamp(420px, 50vw, 620px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          {/* Background Soft Subtle Circle centered right behind the product */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "clamp(400px, 46vw, 600px)",
              height: "clamp(400px, 46vw, 600px)",
              borderRadius: "50%",
              backgroundColor: "#F4F4F6",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          {/* Animated Container holding Product Bottle + Swatch */}
          <div
            ref={visualBoxRef}
            key={`visual-box-${currentVariant.id}`}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              zIndex: 2,
              transformOrigin: "50% 50%",
              willChange: "transform, opacity",
            }}
          >
            {/* Swatch Layer underneath */}
            <div
              style={{
                position: "absolute",
                width: currentVariant.swatchWidth,
                height: currentVariant.swatchHeight,
                transform: currentVariant.swatchTransform,
                ...currentVariant.swatchOffset,
                zIndex: 1,
                filter: "drop-shadow(0 14px 24px rgba(0, 0, 0, 0.08))",
                pointerEvents: "none",
              }}
            >
              <Image
                src={currentVariant.swatchImage}
                alt={`${currentVariant.name} بافت`}
                fill
                priority
                sizes="(max-width: 768px) 70vw, 35vw"
                style={{ objectFit: "contain" }}
              />
            </div>

            {/* Product Bottle Layer on top */}
            <div
              style={{
                position: "absolute",
                width: currentVariant.productWidth,
                height: currentVariant.productHeight,
                transform: currentVariant.productTransform,
                ...currentVariant.productOffset,
                zIndex: 2,
                filter: "drop-shadow(0 22px 38px rgba(0, 0, 0, 0.15))",
              }}
            >
              <Image
                src={currentVariant.productImage}
                alt={currentVariant.name}
                fill
                priority
                sizes="(max-width: 768px) 80vw, 40vw"
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        </div>

        {/* Column 2 in RTL: Left side -> Texts, 4 Thumbnails, and Actions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: "580px",
            zIndex: 10,
          }}
        >
          {/* Main Headline */}
          <h1
            style={{
              fontSize: "clamp(1.7rem, 3vw, 2.5rem)",
              fontWeight: 800,
              color: "#1A2254",
              lineHeight: 1.35,
              marginBottom: 12,
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

          {/* Dynamic Variant Subtitle & Description */}
          <div
            key={`desc-${currentVariant.id}`}
            style={{
              animation: "fadeInScale 0.35s ease-out forwards",
              minHeight: 88,
            }}
          >
            <p
              style={{
                fontSize: "clamp(0.98rem, 1.2vw, 1.1rem)",
                fontWeight: 700,
                color: "#2C3E50",
                lineHeight: 1.5,
                marginBottom: 6,
              }}
            >
              {currentVariant.name}
            </p>
            <p
              style={{
                fontSize: "clamp(0.88rem, 1vw, 0.96rem)",
                color: "#5A6A85",
                lineHeight: 1.7,
                maxWidth: "520px",
                margin: 0,
              }}
            >
              {currentVariant.subtitle}. {currentVariant.description}
            </p>
          </div>

          {/* 4 Thumbnails Strip placed directly under text matching Figma */}
          <div
            style={{
              direction: "ltr",
              marginBlock: "20px 24px",
              display: "inline-flex",
              alignItems: "flex-end",
              gap: "clamp(16px, 2.5vw, 30px)",
              padding: "10px 16px",
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(12px)",
              borderRadius: 20,
              border: "1px solid rgba(226, 232, 240, 0.85)",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)",
              width: "fit-content",
            }}
          >
            {HERO_VARIANTS.map((item, idx) => {
              const isSelected = idx === activeVariantIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectVariant(idx)}
                  aria-label={`انتخاب فرمولاسیون ${item.name}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 6px 2px",
                    position: "relative",
                    transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: isSelected ? "scale(1.15)" : "scale(0.96)",
                  }}
                >
                  <div
                    style={{
                      width: "clamp(42px, 4.5vw, 60px)",
                      height: "clamp(52px, 5.5vw, 76px)",
                      position: "relative",
                      filter: isSelected
                        ? "drop-shadow(0 6px 14px rgba(82, 39, 155, 0.28))"
                        : "grayscale(20%) opacity(0.7)",
                      transition: "filter 0.25s ease",
                    }}
                  >
                    <Image
                      src={item.thumbImage}
                      alt={item.name}
                      fill
                      sizes="65px"
                      style={{ objectFit: "contain" }}
                    />
                  </div>

                  {/* Active Indicator Bar matching Figma node_11_35 */}
                  <div
                    style={{
                      width: "clamp(34px, 3.8vw, 46px)",
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isSelected ? "#B0A992" : "transparent",
                      boxShadow: isSelected ? "0 2px 5px rgba(176, 169, 146, 0.35)" : "none",
                      transition: "background-color 0.25s ease, box-shadow 0.25s ease",
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleQuickAdd}
              style={{
                padding: "11px 26px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #52279B 0%, #431E82 100%)",
                color: "#FFFFFF",
                fontSize: "0.95rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(82, 39, 155, 0.25)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 26px rgba(82, 39, 155, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(82, 39, 155, 0.25)";
              }}
            >
              ثبت سفارش مستقیم
            </button>

            <Link
              href="/products"
              style={{
                padding: "11px 20px",
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.9)",
                border: "1.5px solid #CBD5E1",
                color: "#1A2254",
                fontSize: "0.92rem",
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
          {/* Scroll-driven Catalog Progress Indicator */}
          <div
            style={{
              marginTop: 18,
              display: "flex",
              alignItems: "center",
              gap: 12,
              maxWidth: 340,
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#52279B",
                whiteSpace: "nowrap",
              }}
            >
              {(activeVariantIndex + 1).toLocaleString("fa-IR")} /{" "}
              {HERO_VARIANTS.length.toLocaleString("fa-IR")}
            </span>
            <div
              style={{
                flex: 1,
                height: 4,
                borderRadius: 99,
                background: "#EAE6F3",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.max(25, Math.round(((activeVariantIndex + 1) / HERO_VARIANTS.length) * 100))}%`,
                  height: "100%",
                  borderRadius: 99,
                  background: "linear-gradient(90deg, #52279B 0%, #0284C7 100%)",
                  transition: "width 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#64748B",
                whiteSpace: "nowrap",
              }}
            >
              {scrollProgress > 0.85 ? "ورود به کاتالوگ ↓" : "اسکرول برای محصول بعدی ↓"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
