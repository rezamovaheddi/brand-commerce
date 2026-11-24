"use client";

import { useState } from "react";
import Link from "next/link";
import SampleBadge from "../../../components/SampleBadge";
import PriceTag from "../../../components/PriceTag";

type ComponentTab = "buttons" | "badges" | "pricing" | "timeline" | "cards";

export default function ComponentWorkshopPage() {
  const [activeTab, setActiveTab] = useState<ComponentTab>("buttons");
  const [dir, setDir] = useState<"rtl" | "ltr">("rtl");
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [showTouchTargets, setShowTouchTargets] = useState<boolean>(false);
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [btnDisabled, setBtnDisabled] = useState<boolean>(false);

  const viewportWidths = {
    mobile: "max-w-[390px]",
    tablet: "max-w-[768px]",
    desktop: "max-w-[1200px]",
  };

  return (
    <div className="min-h-screen bg-[var(--color-cream-canvas,#fbf9f5)] text-[var(--color-primary-ink,#0c132b)] py-10 px-4 transition-all" dir={dir}>
      {/* Header Bar */}
      <header className="max-w-7xl mx-auto mb-8 border-b border-[var(--color-parchment-border,#e5dec9)] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-block w-3 h-3 rounded-full bg-[var(--color-brand-gold,#d4af37)]"></span>
              <h1 className="text-2xl font-bold tracking-normal font-sans">
                کارگاه کامپوننت‌های درماویا (Storybook / Component Workshop)
              </h1>
            </div>
            <p className="text-sm text-[var(--color-muted-ink,#64748b)] mt-1">
              محیط ایزوله برای بازبینی تعاملی حالت‌ها، واریانت‌ها، دسترسی‌پذیری و سازگاری RTL/LTR (TASK-187)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/design-system"
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-parchment-border,#e5dec9)] hover:bg-white text-[var(--color-soft-ink,#334155)] transition-colors"
            >
              ← بازگشت به توکن‌ها
            </Link>
            <Link
              href="/"
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-cosmic-950,#0c132b)] text-white hover:bg-[var(--color-cosmic-900,#152147)] transition-colors"
            >
              صفحه اصلی فروشگاه
            </Link>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white border border-[var(--color-parchment-border,#e5dec9)] shadow-sm">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "buttons", label: "دکمه‌ها (Buttons)" },
                { id: "badges", label: "بج‌ها و وضعیت‌ها (Badges)" },
                { id: "pricing", label: "برچسب قیمت ریالی (PriceTag)" },
                { id: "timeline", label: "تایم‌لاین سفارش (Timeline)" },
                { id: "cards", label: "کارت محصولات (Product Cards)" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-[var(--color-cosmic-950,#0c132b)] text-[var(--color-brand-gold,#d4af37)] shadow-sm"
                    : "text-[var(--color-soft-ink,#334155)] hover:bg-[var(--color-parchment-surface,#f5f0e6)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Environmental Controls */}
          <div className="flex items-center gap-3 text-xs">
            {/* RTL / LTR Toggle */}
            <button
              onClick={() => setDir(dir === "rtl" ? "ltr" : "rtl")}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--color-parchment-border,#e5dec9)] bg-white hover:bg-[var(--color-parchment-surface,#f5f0e6)] font-mono"
              aria-label="تغییر جهت نمایش RTL یا LTR"
            >
              جهت: {dir.toUpperCase()}
            </button>

            {/* Viewport Resizer */}
            <div className="flex items-center border border-[var(--color-parchment-border,#e5dec9)] rounded-lg overflow-hidden">
              {(["mobile", "tablet", "desktop"] as const).map((vp) => (
                <button
                  key={vp}
                  onClick={() => setViewport(vp)}
                  className={`px-2 py-1 text-[11px] capitalize ${
                    viewport === vp
                      ? "bg-[var(--color-brand-gold,#d4af37)] text-[var(--color-cosmic-950,#0c132b)] font-bold"
                      : "bg-white text-[var(--color-soft-ink,#334155)] hover:bg-slate-50"
                  }`}
                >
                  {vp}
                </button>
              ))}
            </div>

            {/* Touch Target Overlay Inspector */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                aria-label="نمایش خطوط محدوده لمسی 44 پیکسل"
                checked={showTouchTargets}
                onChange={(e) => setShowTouchTargets(e.target.checked)}
                className="rounded text-[var(--color-brand-gold,#d4af37)] focus:ring-0"
              />
              <span className="text-[11px] text-[var(--color-soft-ink,#334155)]">اهداف لمسی 44px</span>
            </label>
          </div>
        </div>
      </header>

      {/* Main Canvas with Simulated Viewport Container */}
      <main className="max-w-7xl mx-auto flex justify-center">
        <div
          className={`w-full ${viewportWidths[viewport]} bg-white border border-[var(--color-parchment-border,#e5dec9)] rounded-2xl p-6 shadow-md transition-all duration-300`}
        >
          {/* TAB 1: BUTTONS */}
          {activeTab === "buttons" && (
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-lg font-bold">داستان‌های دکمه (Button Stories)</h2>
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      aria-label="غیرفعال‌سازی دکمه نمونه"
                      checked={btnDisabled}
                      onChange={(e) => setBtnDisabled(e.target.checked)}
                      className="rounded"
                    />
                    <span>غیرفعال (Disabled)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      aria-label="حالت بارگذاری دکمه نمونه"
                      checked={btnLoading}
                      onChange={(e) => setBtnLoading(e.target.checked)}
                      className="rounded"
                    />
                    <span>در حال بارگذاری (Loading)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Primary Gold Action */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                  <span className="text-xs font-semibold text-slate-500">واریانت: Primary Gold (CTA اصلی)</span>
                  <div className="relative inline-block">
                    <button
                      disabled={btnDisabled || btnLoading}
                      className={`min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                        btnDisabled
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-[var(--color-brand-gold,#d4af37)] text-[var(--color-cosmic-950,#0c132b)] hover:bg-[#b8952b] active:scale-[0.98]"
                      }`}
                      aria-label="افزودن محصول به سبد خرید درماویا"
                    >
                      {btnLoading ? "در حال پردازش..." : "افزودن به سبد خرید"}
                    </button>
                    {showTouchTargets && (
                      <span className="absolute inset-0 border-2 border-emerald-500 pointer-events-none rounded-xl"></span>
                    )}
                  </div>
                </div>

                {/* Cosmic Hero Button */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                  <span className="text-xs font-semibold text-slate-500">واریانت: Cosmic Deep (تیره هیرو)</span>
                  <div className="relative inline-block">
                    <button
                      disabled={btnDisabled || btnLoading}
                      className={`min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                        btnDisabled
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-[var(--color-cosmic-950,#0c132b)] text-white hover:bg-[var(--color-cosmic-900,#152147)] active:scale-[0.98]"
                      }`}
                      aria-label="مشاهده کاتالوگ تخصصی محصولات درماویا"
                    >
                      {btnLoading ? "در حال اتصال..." : "مشاهده کاتالوگ تخصصی"}
                    </button>
                    {showTouchTargets && (
                      <span className="absolute inset-0 border-2 border-emerald-500 pointer-events-none rounded-xl"></span>
                    )}
                  </div>
                </div>

                {/* Outline Ivory */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                  <span className="text-xs font-semibold text-slate-500">واریانت: Outline Parchment (ثانویه)</span>
                  <div className="relative inline-block">
                    <button
                      disabled={btnDisabled || btnLoading}
                      className={`min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl font-medium text-sm border transition-all ${
                        btnDisabled
                          ? "border-slate-200 text-slate-300 cursor-not-allowed"
                          : "border-[var(--color-parchment-border,#e5dec9)] text-[var(--color-primary-ink,#0c132b)] hover:bg-white"
                      }`}
                      aria-label="درخواست سمپل رایگان پزشکی"
                    >
                      درخواست سمپل پزشکی
                    </button>
                    {showTouchTargets && (
                      <span className="absolute inset-0 border-2 border-emerald-500 pointer-events-none rounded-xl"></span>
                    )}
                  </div>
                </div>

                {/* Destructive Danger */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                  <span className="text-xs font-semibold text-slate-500">واریانت: Destructive (حذف آیتم)</span>
                  <div className="relative inline-block">
                    <button
                      disabled={btnDisabled || btnLoading}
                      className={`min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                        btnDisabled
                          ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                      }`}
                      aria-label="حذف سفارش از سبد خرید"
                    >
                      حذف از سبد خرید
                    </button>
                    {showTouchTargets && (
                      <span className="absolute inset-0 border-2 border-emerald-500 pointer-events-none rounded-xl"></span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: BADGES */}
          {activeTab === "badges" && (
            <section className="space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-lg font-bold">داستان‌های بج و وضعیت (Badge & Status Stories)</h2>
                <p className="text-xs text-slate-500">بج‌های معتبر فرمولاسیون، سمپل و چرخه سفارش</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-center">
                  <span className="text-xs font-semibold text-slate-500 block">بج سمپل بالینی</span>
                  <SampleBadge />
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-center">
                  <span className="text-xs font-semibold text-slate-500 block">بج فول‌سایز اورجینال</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
                    محصول کامل ۵۰ میلی‌لیتر
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-center">
                  <span className="text-xs font-semibold text-slate-500 block">بج تایید داروسازی</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    تاییدیه درماتولوژی
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-center">
                  <span className="text-xs font-semibold text-slate-500 block">بج سفارش در انتظار پرداخت</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    در انتظار پرداخت
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-center">
                  <span className="text-xs font-semibold text-slate-500 block">بج ارسال زنجیره سرد</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-800 border border-cyan-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                    زنجیره سرد 2-8°C
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-center">
                  <span className="text-xs font-semibold text-slate-500 block">بج انقضای لات فعال</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    انقضا: 2028-04
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: PRICING */}
          {activeTab === "pricing" && (
            <section className="space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-lg font-bold">داستان‌های قیمت ریالی (Integer Minor Currency Stories)</h2>
                <p className="text-xs text-slate-500">
                  نمایش مقادیر ریالی با رعایت عدم استفاده از ممیز و پشتیبانی از تخفیف‌های استاندارد
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 block">قیمت ساده (18,500,000 ریال)</span>
                  <PriceTag priceMinor={18500000} currency="IRR" />
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 block">قیمت تخفیف‌دار تخصصی B2B</span>
                  <div className="flex items-center gap-3">
                    <PriceTag priceMinor={14500000} currency="IRR" />
                    <span className="text-xs text-slate-400 line-through">19,000,000 ریال</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">24% تخفیف</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: TIMELINE */}
          {activeTab === "timeline" && (
            <section className="space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-lg font-bold">تایم‌لاین چرخه حیات سفارش (Order State Machine Timeline)</h2>
                <p className="text-xs text-slate-500">وضعیت‌های DRAFT → PENDING_PAYMENT → PAID → PROCESSING → SHIPPED</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <ol className="relative border-s border-slate-200 space-y-6 ms-3">
                  <li className="ms-6">
                    <span className="absolute -start-3 flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full ring-4 ring-white text-xs">
                      ✓
                    </span>
                    <h3 className="font-semibold text-sm">ثبت سفارش و صدور پیش‌فاکتور (DRAFT)</h3>
                    <p className="text-xs text-slate-500">سفارش #ORD-2026-001 با موفقیت در سیستم ثبت گردید.</p>
                  </li>
                  <li className="ms-6">
                    <span className="absolute -start-3 flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full ring-4 ring-white text-xs">
                      ✓
                    </span>
                    <h3 className="font-semibold text-sm">پرداخت تاییدشده (PAID)</h3>
                    <p className="text-xs text-slate-500">تراکنش بانکی از درگاه زرین‌پال تایید شد و شناسه ارجاع ثبت گردید.</p>
                  </li>
                  <li className="ms-6">
                    <span className="absolute -start-3 flex items-center justify-center w-6 h-6 bg-amber-500 text-white rounded-full ring-4 ring-white text-xs">
                      ●
                    </span>
                    <h3 className="font-semibold text-sm">آماده‌سازی در انبار تمیز (PROCESSING)</h3>
                    <p className="text-xs text-slate-500">لات نامبر بررسی و بسته‌بندی در شرایط کنترل دما آغاز شد.</p>
                  </li>
                  <li className="ms-6 opacity-50">
                    <span className="absolute -start-3 flex items-center justify-center w-6 h-6 bg-slate-200 text-slate-600 rounded-full ring-4 ring-white text-xs">
                      4
                    </span>
                    <h3 className="font-semibold text-sm">تحویل به پست ویژه دارویی (SHIPPED)</h3>
                    <p className="text-xs text-slate-500">تحویل به ناوگان حمل تخصصی با کد پیگیری پستی.</p>
                  </li>
                </ol>
              </div>
            </section>
          )}

          {/* TAB 5: CARDS */}
          {activeTab === "cards" && (
            <section className="space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-lg font-bold">کارت محصول درماویا (Product Card Story)</h2>
                <p className="text-xs text-slate-500">نمایش کارت استاندارد فروشگاهی با توکن‌های DTCG و بج‌های پویا</p>
              </div>

              <div className="max-w-sm mx-auto rounded-2xl border border-[var(--color-parchment-border,#e5dec9)] bg-white p-5 shadow-sm space-y-4">
                <div className="h-44 bg-[var(--color-cream-canvas,#fbf9f5)] rounded-xl flex items-center justify-center border border-slate-100">
                  <span className="text-3xl text-[var(--color-brand-gold,#d4af37)]">✦</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-mono">سرم نیاسینامید 10%</span>
                    <SampleBadge />
                  </div>
                  <h3 className="font-bold text-base">سرم بازسازی‌کننده و تقویت‌کننده سد دفاعی پوست</h3>
                  <p className="text-xs text-slate-500">فرمولاسیون علمی با زینک PCA و کمپلکس هیالورونیک اسید</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <PriceTag priceMinor={18500000} currency="IRR" />
                  <button
                    className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-[var(--color-cosmic-950,#0c132b)] text-white text-xs font-semibold hover:bg-[var(--color-cosmic-900,#152147)]"
                    aria-label="خرید سرم نیاسینامید"
                  >
                    خرید سریع
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
