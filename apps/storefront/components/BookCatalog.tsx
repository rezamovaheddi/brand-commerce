"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./cart/CartProvider";
import { formatPriceMinor } from "../lib/format";

export default function BookCatalog() {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const { add } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);

  const SPREADS = [
    {
      chapter: "فصل اول • کلکسیون اکسیرهای سلولی",
      rightPage: {
        num: "۰۱",
        title: "اکسیر جوانساز سلولی",
        subtitle: "سرم تغذیه‌کننده عمیق با بافت ابریشمی",
        desc: "فرمولاسیون پیشرفته بازسازی سلولی با پپتیدهای خالص و عصاره‌های گیاهی کمیاب برای تقویت سد پوستی و درخشش طبیعی.",
        specs: ["حجم: ۵۰ میلی‌لیتر", "ترکیبات فعال: کمپلکس پپتید + رتینول گیاهی", "مناسب: انواع پوست به‌ویژه مستعد خطوط"],
        priceMinor: 3_950_000,
        variantId: "cl_sample_v_3",
        slug: "ethereal-vitamin-c-serum",
      },
      leftPage: {
        num: "۰۲",
        title: "کرم مغذی بازسازنده خاویار",
        subtitle: "کرم محافظتی غنی و تغذیه‌کننده شب",
        desc: "ترکیب غنی از اسیدهای چرب امگا، عصاره خاویار ارگانیک و هیالورونیک اسید برای استحکام بخشیدن به بافت پوست و رفع خشکی مزمن.",
        specs: ["حجم: ۵۰ گرم", "ترکیبات فعال: عصاره خاویار + سرامید NP", "مناسب: پوست‌های خشک و کم‌آب"],
        priceMinor: 2_250_000,
        variantId: "cl_sample_v_2",
        slug: "ethereal-cream-cleanser",
      },
    },
    {
      chapter: "فصل دوم • روتین بالینی و راهنمای استفاده",
      rightPage: {
        num: "۰۳",
        title: "راهنمای روتین صبحگاهی",
        subtitle: "محافظت در برابر رادیکال‌های آزاد و تابش آفتاب",
        desc: "مرحله ۱: شست‌وشو با شوینده ملایم با pH متعادل.\nمرحله ۲: چکاندن ۳ تا ۴ قطره اکسیر آنتی‌اکسیدان روی پوست تمیز.\nمرحله ۳: استفاده از ضدآفتاب با فیلترهای معدنی بدون برجای گذاشتن رد سفیدی.",
        specs: ["زمان اجرا: ۳ دقیقه هر صبح", "هدف: شفافیت پایدار و سد دفاعی مستحکم", "بدون چربی و مناسب پایه آرایش"],
        priceMinor: 1_890_000,
        variantId: "cl_sample_v_1",
        slug: "ethereal-gentle-cleanser",
      },
      leftPage: {
        num: "۰۴",
        title: "راهنمای روتین شبانه",
        subtitle: "ترمیم عمیق و بازیابی رطوبت حین خواب",
        desc: "مرحله ۱: پاکسازی آلودگی‌های روزانه با شیر پاک‌کننده کرمی.\nمرحله ۲: ماساژ دورانی سرم هیالورونیک روی پوست مرطوب.\nمرحله ۳: قفل رطوبت با لایه‌ای نازک از کرم مغذی بازسازنده.",
        specs: ["زمان اجرا: ۵ دقیقه قبل از خواب", "هدف: نوسازی سلولی شبانه", "احساس سبکی و آرامش پوست"],
        priceMinor: 3_450_000,
        variantId: "cl_sample_v_4",
        slug: "ethereal-hyaluronic-serum",
      },
    },
    {
      chapter: "فصل سوم • باشگاه مشتریان و تعهد بوتیک",
      rightPage: {
        num: "۰۵",
        title: "باشگاه مشتریان اثیری",
        subtitle: "امتیازهای ماندگار و دسترسی ویژه به فرمولاسیون‌های اختصاصی",
        desc: "با هر خرید از بوتیک درماویا، به ازای هر ۱۰۰ هزار تومان، ۱۰ امتیاز دریافت کنید و سطوح عضویت مروارید، طلایی و اثیری VIP را بازگشایی نمایید.",
        specs: ["سطح مروارید: ۵٪ تخفیف و ارسال رایگان بالای ۲ م", "سطح طلایی: ۱۰٪ تخفیف و نمونه هدیه در هر خرید", "سطح VIP: مشاوره ماهانه و پکیج اختصاصی"],
        priceMinor: 0,
        variantId: "",
        slug: "",
      },
      leftPage: {
        num: "۰۶",
        title: "منشور اصالت و شفافیت درماویا",
        subtitle: "تعهد علمی بدون ادعاهای اثبات‌نشده",
        desc: "تمامی محصولات درماویا فاقد پارابن، سولفات‌های خشن، رنگ‌های مصنوعی و تست حیوانی هستند. ما به شفافیت کامل در فهرست ترکیبات (INCI) پایبندیم.",
        specs: ["گواهی ایمنی مواد اولیه", "فرمولاسیون سازگار با میکروبیوم طبیعی", "تضمین سلامت و کیفیت بسته‌بندی"],
        priceMinor: 0,
        variantId: "",
        slug: "",
      },
    },
  ];

  const handleNext = () => {
    if (currentSpread < SPREADS.length - 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread((prev) => prev + 1);
        setIsFlipping(false);
      }, 250);
    }
  };

  const handlePrev = () => {
    if (currentSpread > 0 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread((prev) => prev - 1);
        setIsFlipping(false);
      }, 250);
    }
  };

  const spread = SPREADS[currentSpread];

  const handleAddToCart = async (variantId: string, slug: string) => {
    if (!variantId) {
      window.location.href = "/loyalty";
      return;
    }
    setAddingId(variantId);
    try {
      await add(variantId, 1);
    } catch {
      window.location.href = `/products/${slug}`;
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section className="book-catalog-section" id="catalog" aria-labelledby="catalogTitle">
      <div className="container">
        {/* Section Header */}
        <div className="book-catalog-header">
          <span className="book-catalog-badge">کاتالوگ تعاملی RTL</span>
          <h2 id="catalogTitle">روایت مکتوب درماویا</h2>
          <p>ورق بزنید، ترکیبات علمی را کشف کنید و محصول مورد نظر را انتخاب نمایید</p>
        </div>

        {/* 3D Book Stage */}
        <div className="book-stage">
          <div className="book-toolbar">
            <span className="book-chapter-label">{spread.chapter}</span>
            <div className="book-page-dots">
              {SPREADS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`book-dot ${idx === currentSpread ? "is-active" : ""}`}
                  onClick={() => setCurrentSpread(idx)}
                  aria-label={`رفتن به صفحه ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className={`book-binder ${isFlipping ? "is-flipping" : ""}`}>
            {/* Spine depth shadow */}
            <div className="book-spine" aria-hidden="true" />

            {/* Right Page (First in Persian RTL reading order) */}
            <article className="book-page book-page-right">
              <div className="page-gold-frame" aria-hidden="true" />
              <div className="book-page-content">
                <span className="page-chapter-meta">{spread.chapter}</span>
                <h3 className="book-page-title">{spread.rightPage.title}</h3>
                <span className="book-page-subtitle">{spread.rightPage.subtitle}</span>
                <p className="book-page-desc">{spread.rightPage.desc}</p>

                <ul className="book-page-specs">
                  {spread.rightPage.specs.map((spec, i) => (
                    <li key={i}>{spec}</li>
                  ))}
                </ul>

                {spread.rightPage.priceMinor > 0 && (
                  <div className="book-page-footer">
                    <span className="book-price dv-num">{formatPriceMinor(spread.rightPage.priceMinor)}</span>
                    <button
                      type="button"
                      className="dv-btn book-add-btn"
                      onClick={() => handleAddToCart(spread.rightPage.variantId, spread.rightPage.slug)}
                      disabled={addingId === spread.rightPage.variantId}
                    >
                      {addingId === spread.rightPage.variantId ? "افزوده شد..." : "+ افزودن به سبد"}
                    </button>
                  </div>
                )}

                <div className="book-page-num">
                  <span>درماویا</span>
                  <span className="dv-num">{spread.rightPage.num}</span>
                </div>
              </div>
            </article>

            {/* Left Page (Second in Persian RTL reading order) */}
            <article className="book-page book-page-left">
              <div className="page-gold-frame" aria-hidden="true" />
              <div className="book-page-content">
                <span className="page-chapter-meta">{spread.chapter}</span>
                <h3 className="book-page-title">{spread.leftPage.title}</h3>
                <span className="book-page-subtitle">{spread.leftPage.subtitle}</span>
                <p className="book-page-desc">{spread.leftPage.desc}</p>

                <ul className="book-page-specs">
                  {spread.leftPage.specs.map((spec, i) => (
                    <li key={i}>{spec}</li>
                  ))}
                </ul>

                {spread.leftPage.priceMinor > 0 ? (
                  <div className="book-page-footer">
                    <span className="book-price dv-num">{formatPriceMinor(spread.leftPage.priceMinor)}</span>
                    <button
                      type="button"
                      className="dv-btn book-add-btn"
                      onClick={() => handleAddToCart(spread.leftPage.variantId, spread.leftPage.slug)}
                      disabled={addingId === spread.leftPage.variantId}
                    >
                      {addingId === spread.leftPage.variantId ? "افزوده شد..." : "+ افزودن به سبد"}
                    </button>
                  </div>
                ) : (
                  <div className="book-page-footer">
                    <Link href="/loyalty" className="dv-outline-btn">
                      مشاهده صفحه باشگاه مشتریان
                    </Link>
                  </div>
                )}

                <div className="book-page-num">
                  <span>درماویا</span>
                  <span className="dv-num">{spread.leftPage.num}</span>
                </div>
              </div>
            </article>
          </div>

          {/* Book Controls */}
          <div className="book-nav-controls">
            <button
              type="button"
              className="book-nav-arrow prev"
              onClick={handlePrev}
              disabled={currentSpread === 0}
              aria-label="صفحه قبل"
            >
              → صفحه قبل
            </button>
            <span className="book-spread-indicator dv-num">
              بخش {currentSpread + 1} از {SPREADS.length}
            </span>
            <button
              type="button"
              className="book-nav-arrow next"
              onClick={handleNext}
              disabled={currentSpread === SPREADS.length - 1}
              aria-label="صفحه بعد"
            >
              صفحه بعد ←
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
