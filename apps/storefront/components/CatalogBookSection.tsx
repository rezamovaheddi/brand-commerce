"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ThreeBookCanvas, { type BookSpreadData } from "./ThreeBookCanvas";
import { useCart } from "./cart/CartProvider";

const SPREADS: BookSpreadData[] = [
  {
    id: "spread-1",
    label: "گستره ۱ از ۳ — مراحل مراقبت و کلکسیون درمالایت",
    chapter: "فصل اول • آیین مراقبت",
    rightTitle: "مراحل مراقبت",
    rightLead:
      "ساختار راهنمای مراقبت پوست در این بخش نمایش داده می‌شود؛ مراحل و ترتیب مصرف نهایی پس از تایید دستورالعمل رسمی هر محصول تکمیل خواهند شد.",
    rightBullets: [
      "پاک‌سازی ملایم بدون آسیب به چربی مفید پوست",
      "مرحله آماده‌سازی؛ محصول منتخب پس از تایید کاتالوگ",
      "مرحله استفاده از سرم مطابق برچسب رسمی محصول",
      "ماساژ روبه‌بالای صورت برای جذب حداکثری",
    ],
    rightHighlightTitle: "فوم شست‌وشوی ملایم درمالایت",
    rightHighlightDesc: "پاک‌کننده ملایم با کف ابریشمی و pH متعادل مناسب پوست‌های حساس.",
    rightPageNum: "صفحه ۰۱",
    rightImage: "/images/hero/item_pump.png",
    leftTitle: "سرم اکسیر جوانی و کرم مغذی",
    leftLead:
      "معرفی ترکیبات و سازگاری محصولات در این بخش بر اساس فهرست رسمی INCI و اسناد تاییدشده برند تکمیل می‌شود.",
    leftProducts: [
      {
        name: "سرم هیالورونیک",
        desc: "آبرسان عمقی و روشن‌کننده سلولی برای درخشش طبیعی.",
        btnLabel: "+ افزودن سرم",
        btnColor: "#52279B",
        image: "/images/hero/item_dropper.png",
      },
      {
        name: "کرم بازسازی‌کننده",
        desc: "ترمیم سد دفاعی پوست با سرامید و شی‌باتر ارگانیک.",
        btnLabel: "+ افزودن کرم",
        btnColor: "#0284C7",
        image: "/images/hero/item_jar.png",
      },
    ],
    leftPageNum: "صفحه ۰۲",
    leftFooter: "کلکسیون علمی درمالایت",
  },
  {
    id: "spread-2",
    label: "گستره ۲ از ۳ — فرمولاسیون و شفافیت اطلاعات",
    chapter: "فصل دوم • شواهد علمی",
    rightTitle: "اطلاعات علمی و مستندات",
    rightLead:
      "این بخش پس از دریافت گزارش رسمی آزمون، شامل روش، جامعه آماری، بازه زمانی و محدودیت‌ها تکمیل می‌شود.",
    rightBullets: [
      "درصدها فقط پس از ارائه گزارش معتبر آزمایشگاهی درج می‌شوند",
      "فهرست کامل ترکیبات INCI بر پایه اسناد رسمی برند",
      "بررسی سازگاری پوستی و استاندارد ISO 22716",
      "شفافیت کامل در تاریخ انقضا و شرایط نگهداری",
    ],
    rightHighlightTitle: "اکسیر شفافیت و محافظت",
    rightHighlightDesc: "ترکیبات آنتی‌اکسیدان برای محافظت روزانه در برابر آلودگی محیطی.",
    rightPageNum: "صفحه ۰۳",
    rightImage: "/images/hero/item_dropper.png",
    leftTitle: "سرم ویتامینه و ژل پاک‌کننده",
    leftLead:
      "ترکیبات فعال با جذب سلولی سریع و pH متعادل برای حفظ سد دفاعی پوست در روتین روزانه.",
    leftProducts: [
      {
        name: "ژل و فوم شست‌وشو",
        desc: "پاک‌کننده منافذ با کف متراکم بدون حس خشکی.",
        btnLabel: "+ افزودن فوم",
        btnColor: "#52279B",
        image: "/images/hero/item_pump.png",
      },
      {
        name: "کرم مرطوب‌کننده",
        desc: "آبرسانی مداوم ۲۴ ساعته با بافت ابریشمی سبک.",
        btnLabel: "+ افزودن کرم",
        btnColor: "#0284C7",
        image: "/images/hero/item_tube.png",
      },
    ],
    leftPageNum: "صفحه ۰۴",
    leftFooter: "استاندارد شفافیت INCI",
  },
  {
    id: "spread-3",
    label: "گستره ۳ از ۳ — روتین شبانه و بازسازی سلولی",
    chapter: "فصل سوم • بازسازی شبانه",
    rightTitle: "پروتکل بازسازی شبانه",
    rightLead:
      "هماهنگی پپتیدها و سرامیدهای خالص در ساعات استراحت شبانه برای ترمیم بافت خسته و افزایش لطافت پوست.",
    rightBullets: [
      "گام اول شب: پاک‌سازی ملایم بدون آسیب به سد لیپیدی",
      "گام دوم شب: اعمال سرم پپتید و هیالورونیک اسید",
      "گام سوم شب: قفل رطوبت با کرم بازسازی‌کننده",
      "بیدار شدن با پوستی آرام، مرطوب و شفاف",
    ],
    rightHighlightTitle: "کرم بازسازی‌کننده شب",
    rightHighlightDesc: "غنی از سرامیدهای خالص برای ترمیم عمقی سد دفاعی در طول شب.",
    rightPageNum: "صفحه ۰۵",
    rightImage: "/images/hero/item_jar.png",
    leftTitle: "روتین کامل ۲۴ ساعته",
    leftLead:
      "انتخاب تخصصی متخصصان پوست برای بازگرداندن لطافت و کاهش حساسیت پوستی.",
    leftProducts: [
      {
        name: "سرم هیالورونیک",
        desc: "جذب فوری و تقویت‌کننده رطوبت عمقی پوست.",
        btnLabel: "+ افزودن سرم",
        btnColor: "#52279B",
        image: "/images/hero/item_dropper.png",
      },
      {
        name: "کرم اکسیر شب",
        desc: "بافت مخملی ضدچروک و بازسازی‌کننده سلولی.",
        btnLabel: "+ افزودن اکسیر",
        btnColor: "#0284C7",
        image: "/images/hero/item_tube.png",
      },
    ],
    leftPageNum: "صفحه ۰۶",
    leftFooter: "راهنمای جامع درمالایت",
  },
];

export default function CatalogBookSection() {
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const { add, openDrawer } = useCart();
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const spread = SPREADS[spreadIndex];

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !sectionRef.current || !stageRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.from(stageRef.current, {
        y: 44,
        opacity: 0,
        duration: 0.75,
        ease: "power3.out",
        clearProps: "transform,opacity",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleTurnPage = (delta: number) => {
    setSpreadIndex((prev) => (prev + delta + SPREADS.length) % SPREADS.length);
  };

  const handleQuickAdd = async (sku: string, slug: string) => {
    try {
      await add(sku, 1);
      openDrawer();
    } catch {
      window.location.href = `/products/${slug}`;
    }
  };

  return (
    <section
      ref={sectionRef}
      id="catalog-book"
      aria-label="کاتالوگ کتابی سه‌بعدی Three.js درمالایت"
      style={{
        background: "linear-gradient(180deg, #F8F7FB 0%, #FFFFFF 100%)",
        paddingBlock: "clamp(42px, 5vw, 72px)",
        borderTop: "1px solid #EFEBF6",
        borderBottom: "1px solid #EFEBF6",
        overflow: "hidden",
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          paddingInline: 24,
        }}
      >
        {/* Top Toolbar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              background: "#EFEAF8",
              color: "#52279B",
              fontSize: "0.84rem",
              fontWeight: 700,
              border: "1px solid rgba(82, 39, 155, 0.16)",
            }}
          >
            {spread.label}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
              روی کتاب کلیک کنید یا با دکمه‌ها ورق بزنید
            </span>
            <button
              type="button"
              onClick={() => setIsZoomed((z) => !z)}
              aria-pressed={isZoomed}
              style={{
                padding: "7px 16px",
                borderRadius: 999,
                border: "1px solid #E2DCF0",
                background: isZoomed ? "#52279B" : "#FFFFFF",
                color: isZoomed ? "#FFFFFF" : "#1A2254",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {isZoomed ? "حالت عادی" : "بزرگ‌نمایی سه‌بعدی"}
            </button>
          </div>
        </div>

        {/* Pure Three.js 3D WebGL Book */}
        <div ref={stageRef}>
          <ThreeBookCanvas
            spreads={SPREADS}
            spreadIndex={spreadIndex}
            isZoomed={isZoomed}
            onTurnPage={handleTurnPage}
          />
        </div>

        {/* Bottom Pager + Quick Cart Actions */}
        <nav
          aria-label="پیمایش صفحات کاتالوگ کتابی"
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => handleTurnPage(-1)}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid #E2DCF0",
              background: "#FFFFFF",
              color: "#1A2254",
              fontWeight: 700,
              fontSize: "0.84rem",
              cursor: "pointer",
            }}
          >
            ‹ صفحه قبلی
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {SPREADS.map((s, idx) => {
              const active = idx === spreadIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`گستره ${idx + 1}`}
                  onClick={() => setSpreadIndex(idx)}
                  style={{
                    width: active ? 28 : 10,
                    height: 10,
                    borderRadius: 99,
                    border: "none",
                    background: active ? "#52279B" : "#D6CEE8",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handleTurnPage(1)}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "none",
              background: "#52279B",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.84rem",
              cursor: "pointer",
            }}
          >
            صفحه بعدی ›
          </button>

          <button
            type="button"
            onClick={() => handleQuickAdd("DMV-SRM-30H", "ethereal-hyaluronic-serum")}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              background: "#0284C7",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            + افزودن سریع محصول صفحه
          </button>

          <Link
            href="/products"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#52279B",
              marginInlineStart: 6,
            }}
          >
            مشاهده کاتالوگ کامل ←
          </Link>
        </nav>
      </div>
    </section>
  );
}
