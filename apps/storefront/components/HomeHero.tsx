"use client";

import { formatPriceMinor } from "../lib/format";
import { useCart } from "./cart/CartProvider";

export default function HomeHero() {
  const { add } = useCart();

  const handleQuickAdd = async () => {
    try {
      // cl_sample_v_3 is Ethereal Vitamin C Serum 30ml
      await add("cl_sample_v_3", 1);
    } catch {
      window.location.href = "/products";
    }
  };

  return (
    <section className="ethereal-hero-section">
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge-pill">
            <span className="badge-sparkle">✧</span>
            <span>نوآوری پیشگام در سلامت و زیبایی پوست</span>
          </div>

          <h1 className="hero-headline">
            اکسیر جوانساز سلولی؛
            <br />
            <span className="gold-text-gradient">تلاقی علم و طبیعت ناب</span>
          </h1>

          <p className="hero-paragraph">
            فرمولاسیون غنی از پپتیدهای زیست‌فعال، اسید هیالورونیک چندوزنی و عصاره‌های نادر گیاهی.
            طراحی‌شده برای احیای درخشش ارگانیک و استحکام سد دفاعی پوست شما.
          </p>

          <div className="hero-price-tag-row">
            <span className="hero-price-label">قیمت عرضه مستقیم:</span>
            <span className="hero-price-val dv-num">{formatPriceMinor(3_950_000)}</span>
            <span className="hero-sample-badge">فرمولاسیون تاییدشده</span>
          </div>

          <div className="hero-actions-group">
            <button
              type="button"
              className="dv-btn hero-primary-btn"
              onClick={handleQuickAdd}
            >
              افزودن اکسیر به سبد خرید ✨
            </button>
            <a href="#catalog" className="dv-outline-btn hero-catalog-btn">
              ورق زدن کاتالوگ کتابی
            </a>
          </div>

          <div className="hero-trust-row">
            <div className="trust-item">
              <span className="trust-check">✓</span>
              <span>فاقد پارابن و گلوتن</span>
            </div>
            <div className="trust-item">
              <span className="trust-check">✓</span>
              <span>بدون تست حیوانی</span>
            </div>
            <div className="trust-item">
              <span className="trust-check">✓</span>
              <span>pH متعادل و ضدحساسیت</span>
            </div>
          </div>
        </div>

        {/* 3D Bottle Showcase & Golden Aura */}
        <div className="hero-visual-col">
          <div className="product-aura-glow" aria-hidden="true" />
          <div className="cream-ripples-bed" aria-hidden="true" />

          <div className="floating-bottle-wrap">
            <svg viewBox="0 0 240 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-bottle-svg" aria-label="اکسیر جوانساز سلولی درماویا">
              <defs>
                <linearGradient id="hero-glass" x1="12%" y1="15%" x2="88%" y2="85%">
                  <stop offset="0%" stopColor="#fff8dc" />
                  <stop offset="22%" stopColor="#f6d27d" />
                  <stop offset="55%" stopColor="#df9e34" />
                  <stop offset="84%" stopColor="#b56f18" />
                  <stop offset="100%" stopColor="#f3cf7c" />
                </linearGradient>
                <linearGradient id="hero-goldCap" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c571c" />
                  <stop offset="22%" stopColor="#fae6ad" />
                  <stop offset="46%" stopColor="#c6933c" />
                  <stop offset="70%" stopColor="#fff6d6" />
                  <stop offset="100%" stopColor="#875f21" />
                </linearGradient>
                <linearGradient id="hero-bulb" x1="25%" y1="10%" x2="80%" y2="90%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#f3ede2" />
                  <stop offset="100%" stopColor="#d4c6b2" />
                </linearGradient>
                <linearGradient id="hero-shine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.88" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="hero-coreGlow" cx="50%" cy="54%" r="48%">
                  <stop offset="0%" stopColor="#fff8d6" stopOpacity="0.92" />
                  <stop offset="65%" stopColor="#f5be54" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#b97214" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="120" cy="312" rx="68" ry="15" fill="rgba(55, 34, 12, 0.28)" />
              <path d="M104,78 C102,48 106,20 120,20 C134,20 138,48 136,78 Z" fill="url(#hero-bulb)" />
              <ellipse cx="114" cy="44" rx="4.5" ry="14" fill="#ffffff" opacity="0.88" />
              <rect x="86" y="76" width="68" height="40" rx="6" fill="url(#hero-goldCap)" />
              <rect x="82" y="110" width="76" height="8" rx="3" fill="url(#hero-goldCap)" />
              <line x1="88" y1="84" x2="152" y2="84" stroke="#fff8dc" strokeOpacity="0.55" strokeWidth="1.2" />
              <path d="M84,118 C64,124 54,142 54,166 L54,284 C54,302 68,312 88,312 L152,312 C172,312 186,302 186,284 L186,166 C186,142 176,124 156,118 Z" fill="url(#hero-glass)" stroke="#fff7dd" strokeOpacity="0.65" strokeWidth="1.6" />
              <path d="M58,282 C58,298 72,308 90,308 L150,308 C168,308 182,298 182,282 L182,290 C182,306 168,314 150,314 L90,314 C72,314 58,306 58,290 Z" fill="#fff8e4" opacity="0.72" />
              <ellipse cx="120" cy="218" rx="56" ry="74" fill="url(#hero-coreGlow)" />
              <rect x="115" y="122" width="10" height="148" rx="4" fill="rgba(255,253,245,0.28)" stroke="rgba(255,252,235,0.72)" strokeWidth="1.2" />
              <path d="M116,270 L124,270 L121.5,286 C121,288 119,288 118.5,286 Z" fill="#fff7da" opacity="0.88" />
              <rect x="64" y="142" width="14" height="144" rx="7" fill="url(#hero-shine)" />
              <rect x="166" y="146" width="8" height="138" rx="4" fill="#fff8e1" opacity="0.58" />
              <path d="M74,134 C86,124 102,122 114,122" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.82" />
              <g fill="#fffbe6">
                <circle cx="94" cy="238" r="2.6" opacity="0.92" />
                <circle cx="144" cy="224" r="2.2" opacity="0.88" />
                <circle cx="106" cy="264" r="2" opacity="0.84" />
                <circle cx="136" cy="256" r="2.8" opacity="0.95" />
                <circle cx="152" cy="196" r="1.9" opacity="0.8" />
                <circle cx="88" cy="192" r="1.7" opacity="0.78" />
                <circle cx="126" cy="204" r="1.8" opacity="0.9" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
