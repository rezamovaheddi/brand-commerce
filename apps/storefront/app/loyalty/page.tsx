"use client";

import { useState } from "react";
import Link from "next/link";
import { formatFaNumber, formatPriceMinor } from "../../lib/format";

const TIERS = [
  {
    id: "pearl",
    name: "سطح مروارید (Pearl)",
    range: "۰ تا ۹۹۹ امتیاز",
    minPoints: 0,
    discount: "۵٪",
    coupon: "PEARL5",
    color: "#dfc2aa",
    perks: [
      "۵٪ تخفیف روی کلیه خریدهای شخصی",
      "ارسال اکسپرس رایگان برای سفارش‌های بالای ۲ میلیون تومان",
      "دعوت‌نامه خبرنامه تحریریه تخصصی پوست",
      "هدایای تولد و تبریک مناسبتی",
    ],
  },
  {
    id: "gold",
    name: "سطح طلایی (Gold)",
    range: "۱٬۰۰۰ تا ۱٬۹۹۹ امتیاز",
    minPoints: 1000,
    discount: "۱۰٪",
    coupon: "DERMAVIA10",
    color: "#e2be74",
    perks: [
      "۱۰٪ تخفیف دائمی روی تمام محصولات",
      "ارسال اکسپرس رایگان برای تمام سفارش‌ها بدون سقف حداقل",
      "یک عدد مینی‌اکسیر هدیه نمونه در هر خرید",
      "اولویت بالا در ارسال و پشتیبانی اختصاصی",
    ],
  },
  {
    id: "vip",
    name: "سطح اثیری VIP (Ethereal VIP)",
    range: "۲٬۰۰۰+ امتیاز",
    minPoints: 2000,
    discount: "۱۵٪",
    coupon: "GOLDVIP15",
    color: "#f4d996",
    perks: [
      "۱۵٪ تخفیف ویژه VIP روی کل سبد خرید",
      "جلسه مشاوره اختصاصی فصلی با متخصصین درماویا",
      "پکیج سالانه اکسیرهای اختصاصی دست‌ساز",
      "دسترسی زودهنگام به محصولات جدید پیش از عرضه عمومی",
      "امکان تست رایگان نمونه‌های آزمایشگاهی قبل از تولید نهایی",
    ],
  },
];

export default function LoyaltyPage() {
  const [activeTier, setActiveTier] = useState<string>("gold");
  const [purchaseAmountToman, setPurchaseAmountToman] = useState<number>(3_000_000);

  // Each 100,000 Toman = 10 points
  const earnedPoints = Math.floor(purchaseAmountToman / 100_000) * 10;

  const currentTier = TIERS.find((t) => t.id === activeTier) || TIERS[1];

  return (
    <div className="container dv-page-wrap">
      {/* Page Header */}
      <div className="loyalty-hero-header">
        <span className="loyalty-header-badge">برنامه وفاداری و تشویقی</span>
        <h1 className="loyalty-title">باشگاه مشتریان اثیری درماویا</h1>
        <p className="loyalty-subtitle">
          هر سفارش شما، گامی به سوی خدمات سفارشی‌تر، تخفیف‌های ویژه و هدایای اختصاصی مراقبت از پوست است.
        </p>
      </div>

      {/* Tier Switcher Cards */}
      <div className="tier-cards-grid">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`tier-card ${activeTier === tier.id ? "is-active" : ""}`}
            onClick={() => setActiveTier(tier.id)}
          >
            <div className="tier-card-head">
              <span className="tier-sparkle">✧</span>
              <span className="tier-range-pill">{tier.range}</span>
            </div>
            <h3 className="tier-name">{tier.name}</h3>
            <div className="tier-discount-box">
              <span className="discount-val">{tier.discount}</span>
              <span className="discount-lbl">تخفیف روی سفارش‌ها</span>
            </div>
            <p className="tier-coupon-code">
              کد فعال‌سازی: <strong dir="ltr">{tier.coupon}</strong>
            </p>
          </div>
        ))}
      </div>

      {/* Active Tier Perks Spotlight */}
      <section className="active-tier-details">
        <div className="tier-detail-card">
          <div className="tier-detail-head">
            <h3>امتیازات و مزایای اختصاصی {currentTier.name}</h3>
            <span className="tier-detail-code">کد تخفیف شما: <strong dir="ltr">{currentTier.coupon}</strong></span>
          </div>

          <ul className="tier-perks-list">
            {currentTier.perks.map((perk, idx) => (
              <li key={idx} className="tier-perk-item">
                <span className="perk-bullet">✓</span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <div className="tier-cta-box">
            <p>می‌توانید همین حالا کد <strong dir="ltr">{currentTier.coupon}</strong> را در دراور سبد خرید اعمال کنید.</p>
            <Link href="/products" className="dv-btn">
              مشاهده محصولات و ثبت سفارش با تخفیف →
            </Link>
          </div>
        </div>
      </section>

      {/* Points Calculator Simulator */}
      <section className="points-calculator-section">
        <div className="calc-card">
          <div className="calc-header">
            <h3>ماشین‌حساب امتیاز و پاداش درماویا</h3>
            <p>تخمین بزنید با خرید خود چه میزان امتیاز کسب خواهید کرد:</p>
          </div>

          <div className="calc-body">
            <label className="calc-label" htmlFor="purchaseRange">
              مبلغ تخمینی خرید شما: <strong className="dv-num">{formatPriceMinor(purchaseAmountToman * 10)}</strong>
            </label>
            <input
              id="purchaseRange"
              type="range"
              min="500000"
              max="10000000"
              step="500000"
              value={purchaseAmountToman}
              onChange={(e) => setPurchaseAmountToman(Number(e.target.value))}
              className="calc-range-slider"
            />

            <div className="calc-result-box">
              <div className="calc-res-item">
                <span className="res-lbl">امتیاز کسب‌شده:</span>
                <span className="res-val dv-num">+{formatFaNumber(earnedPoints)} امتیاز</span>
              </div>
              <div className="calc-res-item">
                <span className="res-lbl">سطح متناظر:</span>
                <span className="res-val highlight">
                  {earnedPoints >= 2000 ? "اثیری VIP" : earnedPoints >= 1000 ? "طلایی" : "مروارید"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Earn Points */}
      <section className="earn-points-section">
        <h2 className="earn-title">چگونه امتیاز کسب کنیم؟</h2>
        <div className="earn-grid">
          <div className="earn-card">
            <span className="earn-icon">🛍️</span>
            <h4>خرید از فروشگاه</h4>
            <p>به ازای هر ۱۰۰ هزار تومان خرید، ۱۰ امتیاز مستقیم به حسابتان اضافه می‌شود.</p>
          </div>
          <div className="earn-card">
            <span className="earn-icon">✍️</span>
            <h4>ثبت نظر و تجربه مصرف</h4>
            <p>با درج نقد و بررسی دقیق و مستند روی محصولات، ۵۰ امتیاز هدیه بگیرید.</p>
          </div>
          <div className="earn-card">
            <span className="earn-icon">👥</span>
            <h4>معرفی به دوستان</h4>
            <p>با اشتراک کد معرفی، ۱۰۰ امتیاز برای شما و ۱۰٪ تخفیف برای دوستتان منظور می‌شود.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
