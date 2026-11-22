"use client";

import { useState } from "react";
import Link from "next/link";
import SampleBadge from "../../components/SampleBadge";

// Helper to calculate luminance for WCAG 2.1
function getLuminance(hex: string): number {
  const c = hex.replace("#", "");
  if (c.length !== 6) return 0;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(fg: string, bg: string): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

const COLOR_PALETTES = [
  {
    group: "Atmospheric Cosmic (Dermavia V6)",
    tokens: [
      { name: "--color-cosmic-950", hex: "#0c132b", label: "Cosmic Deep Space", role: "پس‌زمینه هیرو سینمایی" },
      { name: "--color-cosmic-900", hex: "#152147", label: "Cosmic Midnight", role: "گرادیان و هدر تیره" },
      { name: "--color-cosmic-800", hex: "#253463", label: "Cosmic Navy Light", role: "مرزها و سطوح ثانویه" },
      { name: "--color-twilight-400", hex: "#877b9b", label: "Twilight Violet", role: "متن میانی و افکت‌های ابریشم" },
    ],
  },
  {
    group: "Warm Clinical Luxury (Parchment & Creams)",
    tokens: [
      { name: "--dv-cream", hex: "#f6f1e8", label: "Luxury Cream", role: "پس‌زمینه بوم اصلی و کانوپی" },
      { name: "--dv-paper", hex: "#fffdf8", label: "Warm Paper", role: "کارت‌های محصول و پنل‌ها" },
      { name: "--surface-parchment", hex: "#f4efe6", label: "Parchment Surface", role: "بخش‌های متنی و نقل‌قول‌ها" },
      { name: "--surface-parchment-deep", hex: "#e8dfd0", label: "Parchment Deep", role: "کف فوتر و سطوح تاکید" },
    ],
  },
  {
    group: "Pure Gold & Champagne Accents",
    tokens: [
      { name: "--gold-bright", hex: "#fff4cf", label: "Gold Bright Specular", role: "درخشش‌های نقطه نوری" },
      { name: "--gold-pure", hex: "#e2be74", label: "Champagne Gold", role: "متن طلایی و نشان‌های ویژه" },
      { name: "--gold-rich", hex: "#c29340", label: "Amber Gold", role: "دکمه‌های اصلی و تگ‌ها" },
      { name: "--gold-deep", hex: "#855e1c", label: "Deep Bronze Gold", role: "تیترها و آیکون‌های روی کرم" },
    ],
  },
  {
    group: "Text Typography Inks",
    tokens: [
      { name: "--dv-ink", hex: "#231a15", label: "Espresso Ink", role: "متن اصلی و تیترهای مشکی-قهوه‌ای" },
      { name: "--dv-ink-soft", hex: "#584a3e", label: "Soft Espresso", role: "پاراگراف‌ها و شرح بالینی" },
      { name: "--dv-muted", hex: "#55493e", label: "Muted Warm Slate", role: "متن کمکی و متا دیتای ثانویه" },
      { name: "--text-hero-ivory", hex: "#fffbf2", label: "Ivory White", role: "متن روشن روی زمینه تیره" },
    ],
  },
];

export default function DesignSystemPage() {
  const [surface, setSurface] = useState<"cream" | "cosmic" | "paper">("cream");
  const [fgColor, setFgColor] = useState("#231A15");
  const [bgColor, setBgColor] = useState("#F6F1E8");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const ratio = getContrastRatio(fgColor, bgColor);
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3.0;
  const aaaNormal = ratio >= 7.0;
  const aaaLarge = ratio >= 4.5;

  const handleCopy = (tokenName: string) => {
    navigator.clipboard?.writeText(`var(${tokenName})`);
    setCopiedToken(tokenName);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="container dv-page">
      {/* Breadcrumb */}
      <nav aria-label="خرده‌نان" className="dv-breadcrumb" style={{ marginBottom: 20 }}>
        <ol style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.88rem", margin: 0, padding: 0 }}>
          <li><Link href="/" className="dv-link" style={{ color: "var(--dv-muted)" }}>خانه</Link></li>
          <li aria-hidden="true" style={{ color: "var(--dv-muted)" }}>/</li>
          <li style={{ color: "var(--dv-gold)", fontWeight: 700 }}>سیستم طراحی زنده (Living Design System)</li>
        </ol>
      </nav>

      {/* Hero Header */}
      <div className="dv-b2b-hero" style={{ padding: "40px 32px", borderRadius: 24, marginBottom: 36 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <span className="dv-badge" style={{ background: "rgba(197, 160, 89, 0.2)", color: "var(--gold-deep)", fontWeight: 700 }}>
            DTCG 2025.10 COMPLIANT
          </span>
          <span className="dv-badge" style={{ background: "rgba(36, 82, 60, 0.15)", color: "var(--dv-success)", fontWeight: 700 }}>
            ۱۰۶ کانونیکال توکن
          </span>
          <SampleBadge />
        </div>
        <h1 style={{ fontSize: "2.3rem", color: "var(--dv-navy)", margin: "0 0 12px", fontWeight: 800 }}>
          Dermavia Ethereal — سیستم طراحی و توکن‌های کانونیکال
        </h1>
        <p style={{ color: "var(--dv-ink-soft)", fontSize: "1.05rem", lineHeight: 1.8, maxWidth: 840, margin: 0 }}>
          مرجع یکپارچه و زنده تصمیمات بصری، رنگ‌ها، تایپوگرافی، فواصل، دسترس‌پذیری WCAG 2.1 و مؤلفه‌های رابط کاربری برند مراقبت پوستی درماویا.
          تمامی متغیرها از فایل ساختاریافته <code style={{ background: "rgba(0,0,0,0.06)", padding: "2px 6px", borderRadius: 4 }}>tokens/brand.tokens.json</code> استخراج شده و به استانداردهای صنعتی پایبند هستند.
        </p>
      </div>

      {/* Surface Sandbox Preview */}
      <div style={{ background: "#fff", border: "1px solid var(--dv-line)", borderRadius: 20, padding: 28, marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", color: "var(--dv-navy)", margin: "0 0 6px" }}>آزمایشگاه سطوح و کانتکست (Surface Sandbox)</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--dv-muted)", margin: 0 }}>پیش‌نمایش رفتار مؤلفه‌ها در سه سطح نوری مختلف</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="dv-btn"
              onClick={() => setSurface("cream")}
              style={{
                background: surface === "cream" ? "var(--dv-navy)" : "#f6f1e8",
                color: surface === "cream" ? "#fff" : "var(--dv-ink)",
                fontSize: "0.85rem",
                padding: "8px 16px",
              }}
            >
              کرم اثیری (Cream)
            </button>
            <button
              type="button"
              className="dv-btn"
              onClick={() => setSurface("cosmic")}
              style={{
                background: surface === "cosmic" ? "var(--dv-navy)" : "#0c132b",
                color: "#fff",
                fontSize: "0.85rem",
                padding: "8px 16px",
              }}
            >
              کهکشانی تیره (Cosmic)
            </button>
            <button
              type="button"
              className="dv-btn"
              onClick={() => setSurface("paper")}
              style={{
                background: surface === "paper" ? "var(--dv-navy)" : "#fffdf8",
                color: surface === "paper" ? "#fff" : "var(--dv-ink)",
                border: "1px solid var(--dv-line)",
                fontSize: "0.85rem",
                padding: "8px 16px",
              }}
            >
              کاغذ مات (Paper)
            </button>
          </div>
        </div>

        {/* Live Surface Box */}
        <div
          style={{
            background: surface === "cream" ? "var(--dv-cream)" : surface === "cosmic" ? "var(--color-cosmic-950)" : "var(--dv-paper)",
            color: surface === "cosmic" ? "var(--text-hero-ivory)" : "var(--dv-ink)",
            borderRadius: 16,
            padding: 32,
            transition: "all 0.3s ease",
            border: surface === "cosmic" ? "1px solid rgba(255,255,255,0.12)" : "1px solid var(--dv-line)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "1px", color: surface === "cosmic" ? "var(--gold-pure)" : "var(--gold-deep)" }}>
                ETHEREAL LUXURY SPECIFICATION
              </span>
              <h3 style={{ fontSize: "1.5rem", margin: "8px 0", color: surface === "cosmic" ? "var(--text-hero-ivory)" : "var(--dv-navy)" }}>
                زیبایی در جزئیات مهندسی‌شده معنا پیدا می‌کند
              </h3>
              <p style={{ maxWidth: 600, fontSize: "0.95rem", opacity: 0.9, lineHeight: 1.7, margin: 0 }}>
                تلفیق فرمولاسیون‌های بیوتکنولوژی پیشرفته با زیبایی‌شناسی اثیری و استانداردهای کلینیکی معتبر.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                className="dv-btn"
                style={{
                  background: "linear-gradient(135deg, #c5a059 0%, #855e1c 100%)",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(197, 160, 89, 0.3)",
                }}
              >
                دکمه اصلی طلا
              </button>
              <button
                type="button"
                className="dv-btn"
                style={{
                  background: surface === "cosmic" ? "rgba(255,255,255,0.1)" : "#fff",
                  color: surface === "cosmic" ? "#fff" : "var(--dv-navy)",
                  border: surface === "cosmic" ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--dv-line)",
                }}
              >
                دکمه ثانویه
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive WCAG 2.1 Contrast Lab */}
      <div style={{ background: "#fff", border: "1px solid var(--dv-line)", borderRadius: 20, padding: 28, marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.35rem", color: "var(--dv-navy)", margin: "0 0 6px" }}>آزمایشگاه کنتراست زنده WCAG 2.1 (Contrast Lab)</h2>
        <p style={{ fontSize: "0.88rem", color: "var(--dv-muted)", margin: "0 0 24px" }}>
          محاسبه لحظه‌ای نسبت کنتراست نوری بین متن و پس‌زمینه بر اساس استاندارد رسمی W3C WCAG 2.1 AA و AAA
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "center" }}>
          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="fgColor" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--dv-ink)", marginBottom: 6 }}>
                رنگ متن (Foreground)
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  id="fgColor"
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value.toUpperCase())}
                  style={{ width: 44, height: 44, padding: 2, border: "1px solid var(--dv-line)", borderRadius: 8, cursor: "pointer" }}
                />
                <input
                  type="text"
                  dir="ltr"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value.toUpperCase())}
                  style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--dv-line)", borderRadius: 8, fontSize: "0.95rem", fontFamily: "monospace" }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="bgColor" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--dv-ink)", marginBottom: 6 }}>
                رنگ پس‌زمینه (Background)
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  id="bgColor"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value.toUpperCase())}
                  style={{ width: 44, height: 44, padding: 2, border: "1px solid var(--dv-line)", borderRadius: 8, cursor: "pointer" }}
                />
                <input
                  type="text"
                  dir="ltr"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value.toUpperCase())}
                  style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--dv-line)", borderRadius: 8, fontSize: "0.95rem", fontFamily: "monospace" }}
                />
              </div>
            </div>
          </div>

          {/* Live Preview Sample */}
          <div
            style={{
              background: bgColor,
              color: fgColor,
              padding: 24,
              borderRadius: 16,
              border: "1px solid var(--dv-line)",
              minHeight: 140,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "0.78rem", opacity: 0.8, fontWeight: 600 }}>نمونه آزمون خوانایی فارسی:</span>
            <strong style={{ fontSize: "1.3rem", margin: "6px 0", lineHeight: 1.4 }}>درماویا؛ درخشش ابدی و مراقبت بالینی پوست</strong>
            <small style={{ fontSize: "0.85rem", opacity: 0.85 }}>Dermavia Ethereal — Efficacy, Cleanroom & Transparency</small>
          </div>

          {/* Metrics Results */}
          <div style={{ background: "rgba(246, 241, 232, 0.6)", padding: 20, borderRadius: 16, border: "1px solid var(--dv-line)" }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: ratio >= 4.5 ? "#047857" : "#b91c1c" }}>
                {ratio.toFixed(2)}:1
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--dv-muted)" }}>نسبت کنتراست روشنایی (Contrast Ratio)</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.78rem" }}>
              <div style={{ padding: "6px 10px", borderRadius: 8, background: aaNormal ? "rgba(4,120,87,0.15)" : "rgba(185,28,28,0.15)", color: aaNormal ? "#047857" : "#b91c1c", fontWeight: 700, textAlign: "center" }}>
                AA متن نرمال ({aaNormal ? "قبول" : "رد"})
              </div>
              <div style={{ padding: "6px 10px", borderRadius: 8, background: aaLarge ? "rgba(4,120,87,0.15)" : "rgba(185,28,28,0.15)", color: aaLarge ? "#047857" : "#b91c1c", fontWeight: 700, textAlign: "center" }}>
                AA متن بزرگ ({aaLarge ? "قبول" : "رد"})
              </div>
              <div style={{ padding: "6px 10px", borderRadius: 8, background: aaaNormal ? "rgba(4,120,87,0.15)" : "rgba(185,28,28,0.15)", color: aaaNormal ? "#047857" : "#b91c1c", fontWeight: 700, textAlign: "center" }}>
                AAA متن نرمال ({aaaNormal ? "قبول" : "رد"})
              </div>
              <div style={{ padding: "6px 10px", borderRadius: 8, background: aaaLarge ? "rgba(4,120,87,0.15)" : "rgba(185,28,28,0.15)", color: aaaLarge ? "#047857" : "#b91c1c", fontWeight: 700, textAlign: "center" }}>
                AAA متن بزرگ ({aaaLarge ? "قبول" : "رد"})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Inventory Sections */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.35rem", color: "var(--dv-navy)", margin: "0 0 6px" }}>فهرست کاتالوگ پالت‌های رنگی کانونیکال</h2>
        <p style={{ fontSize: "0.88rem", color: "var(--dv-muted)", margin: "0 0 24px" }}>
          کلیک روی هر رنگ، نام متغیر CSS آن را کپی می‌کند
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {COLOR_PALETTES.map((group) => (
            <div key={group.group}>
              <h3 style={{ fontSize: "1.1rem", color: "var(--dv-gold)", marginBottom: 14 }}>{group.group}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                {group.tokens.map((token) => (
                  <div
                    key={token.name}
                    onClick={() => handleCopy(token.name)}
                    style={{
                      background: "#fff",
                      border: "1px solid var(--dv-line)",
                      borderRadius: 14,
                      padding: 16,
                      cursor: "pointer",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                    title="برای کپی متغیر CSS کلیک کنید"
                  >
                    <div style={{ height: 60, background: token.hex, borderRadius: 10, marginBottom: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <strong style={{ fontSize: "0.88rem", color: "var(--dv-navy)" }}>{token.label}</strong>
                      <span style={{ fontSize: "0.78rem", fontFamily: "monospace", color: "var(--dv-muted)" }}>{token.hex}</span>
                    </div>
                    <code style={{ fontSize: "0.78rem", color: "var(--dv-gold)", display: "block", marginBottom: 6 }}>
                      {copiedToken === token.name ? "کپی شد! ✓" : token.name}
                    </code>
                    <p style={{ fontSize: "0.78rem", color: "var(--dv-muted)", margin: 0 }}>{token.role}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Non-Negotiable Contract Rules */}
      <div style={{ background: "rgba(246, 241, 232, 0.7)", border: "1px solid var(--dv-line)", borderRadius: 20, padding: 28 }}>
        <h2 style={{ fontSize: "1.35rem", color: "var(--dv-navy)", margin: "0 0 16px" }}>قواعد و میثاق‌های معماری غیرقابل مذاکره (Implementation Contracts)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 18 }}>
          <div style={{ background: "#fff", padding: 18, borderRadius: 14, border: "1px solid var(--dv-line)" }}>
            <strong style={{ color: "var(--dv-gold)", fontSize: "0.95rem", display: "block", marginBottom: 6 }}>۱. تقدم RTL با وزیرمتن</strong>
            <p style={{ fontSize: "0.84rem", color: "var(--dv-ink-soft)", margin: 0, lineHeight: 1.6 }}>
              فاصله بین حروف باید دقیقاً <code style={{ color: "var(--dv-danger)" }}>letter-spacing: 0</code> باشد تا پیوستگی حروف فارسی هرگز نشکند. جهت با ویژگی‌های منطقی کنترل می‌شود.
            </p>
          </div>

          <div style={{ background: "#fff", padding: 18, borderRadius: 14, border: "1px solid var(--dv-line)" }}>
            <strong style={{ color: "var(--dv-gold)", fontSize: "0.95rem", display: "block", marginBottom: 6 }}>۲. محاسبات مالی با جزء صحیح</strong>
            <p style={{ fontSize: "0.84rem", color: "var(--dv-ink-soft)", margin: 0, lineHeight: 1.6 }}>
              تمام قیمت‌ها به ریال و با مقادیر صحیح <code style={{ color: "var(--dv-gold)" }}>priceMinor</code> ذخیره و تجمیع می‌شوند؛ کلاینت هرگز مرجع تعیین قیمت نیست.
            </p>
          </div>

          <div style={{ background: "#fff", padding: 18, borderRadius: 14, border: "1px solid var(--dv-line)" }}>
            <strong style={{ color: "var(--dv-gold)", fontSize: "0.95rem", display: "block", marginBottom: 6 }}>۳. شیشه‌گرایی مهارشده</strong>
            <p style={{ fontSize: "0.84rem", color: "var(--dv-ink-soft)", margin: 0, lineHeight: 1.6 }}>
              افکت‌های بلور <code style={{ color: "var(--dv-navy)" }}>backdrop-filter</code> فقط روی ناوبری شناور و مودال‌ها مجاز است تا فریم‌ریت بالای ۶۰fps روی تمام دستگاه‌ها حفظ شود.
            </p>
          </div>

          <div style={{ background: "#fff", padding: 18, borderRadius: 14, border: "1px solid var(--dv-line)" }}>
            <strong style={{ color: "var(--dv-gold)", fontSize: "0.95rem", display: "block", marginBottom: 6 }}>۴. صداقت در داده‌های نمونه</strong>
            <p style={{ fontSize: "0.84rem", color: "var(--dv-ink-soft)", margin: 0, lineHeight: 1.6 }}>
              هیچ داده فیک یا شبیه‌سازی‌شده‌ای نباید بدون نشان‌های صریح <code style={{ color: "var(--dv-gold)" }}>isSample</code> یا <code style={{ color: "var(--dv-gold)" }}>SANDBOX</code> به کاربر عرضه شود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
