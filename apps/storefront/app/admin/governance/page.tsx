"use client";

import { useState } from "react";
import Link from "next/link";

type LifecycleState = "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "PUBLISHED" | "EXPIRED" | "RECALLED";

interface ClinicalClaim {
  id: string;
  claimTitle: string;
  formulation: string;
  evidenceRef: string;
  expiryDate: string;
  batchNumber: string;
  coldChainRequired: boolean;
  state: LifecycleState;
  owner: string;
}

const INITIAL_CLAIMS: ClinicalClaim[] = [
  {
    id: "CLM-001",
    claimTitle: "کاهش ۴۳ درصدی لک‌های تیره و تنظیم سبوم",
    formulation: "سرم نیاسینامید ۱۰٪ + زینک PCA ۱٪",
    evidenceRef: "CTR-IR-2025-9982 (کارآزمایی بالینی دو سو کور)",
    expiryDate: "2027-08-30",
    batchNumber: "LOT-DV-2026-A1",
    coldChainRequired: false,
    state: "PUBLISHED",
    owner: "دکتر مریم شریفی (سرپرست علمی R&D)",
  },
  {
    id: "CLM-002",
    claimTitle: "تحریک کلاژن‌سازی فیبروبلاست‌ها و بازسازی سد دفاعی",
    formulation: "کرم پپتید کمپلکس + ۵ پپتید بایواکتیو",
    evidenceRef: "DERM-EVAL-8841 (تست ایمنی ترانس‌پیدرمال)",
    expiryDate: "2026-12-15",
    batchNumber: "LOT-DV-2025-B4",
    coldChainRequired: true,
    state: "EXPIRED",
    owner: "دکتر کیوان راد (مدیر تضمین کیفیت QA)",
  },
  {
    id: "CLM-003",
    claimTitle: "آبرسانی عمقی ۷۲ ساعته با ۳ وزن مولکولی اسید هیالورونیک",
    formulation: "ژل آبرسان هیدروپمپ هیالورونیک ۳٪",
    evidenceRef: "DOC-MOH-1404-0992 (مجوز سازمان غذا و دارو)",
    expiryDate: "2028-02-28",
    batchNumber: "LOT-DV-2026-C2",
    coldChainRequired: false,
    state: "UNDER_REVIEW",
    owner: "مهندس احمدی (واحد رگولاتوری)",
  },
];

export default function CmsGovernancePage() {
  const [claims, setClaims] = useState<ClinicalClaim[]>(INITIAL_CLAIMS);
  const [selectedClaim, setSelectedClaim] = useState<ClinicalClaim>(INITIAL_CLAIMS[0]);
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");

  const updateClaimState = (id: string, newState: LifecycleState) => {
    setClaims((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, state: newState };
          setSelectedClaim(updated);
          return updated;
        }
        return c;
      })
    );
    setFeedbackMsg(`وضعیت ادعای بالینی به ${newState} تغییر یافت.`);
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  const stateColors: Record<LifecycleState, string> = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
    UNDER_REVIEW: "bg-amber-50 text-amber-800 border-amber-300",
    APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-300",
    PUBLISHED: "bg-blue-50 text-blue-800 border-blue-300",
    EXPIRED: "bg-purple-50 text-purple-800 border-purple-300",
    RECALLED: "bg-rose-50 text-rose-800 border-rose-300",
  };

  return (
    <div className="min-h-screen bg-[var(--color-cream-canvas,#fbf9f5)] text-[var(--color-primary-ink,#0c132b)] py-10 px-4" dir="rtl">
      <header className="max-w-7xl mx-auto mb-8 border-b border-[var(--color-parchment-border,#e5dec9)] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-block w-3 h-3 rounded-full bg-[var(--color-brand-gold,#d4af37)]"></span>
              <h1 className="text-2xl font-bold tracking-normal font-sans">
                حاکمیت ادعاهای بالینی، انقضا و فراخوان دارویی (CMS Governance)
              </h1>
            </div>
            <p className="text-sm text-[var(--color-muted-ink,#64748b)] mt-1">
              چرخه حیات ۶ مرحله‌ای محتوا، بازبینی شواهد بالینی، انقضای بچ‌ها و مکانیزم فراخوان دارویی (TASK-170)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-parchment-border,#e5dec9)] hover:bg-white text-[var(--color-soft-ink,#334155)] transition-colors"
            >
              ← بازگشت به کنسول ادمین
            </Link>
          </div>
        </div>

        {feedbackMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
            <span>✓ {feedbackMsg}</span>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Claims List */}
        <section className="bg-white border border-[var(--color-parchment-border,#e5dec9)] rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold pb-2 border-b">فهرست ادعاها و بچ‌های فرمولاسیون</h2>
          <div className="space-y-3">
            {claims.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClaim(c)}
                aria-label={`انتخاب ادعای بالینی ${c.claimTitle}`}
                className={`w-full text-start p-3.5 rounded-xl border transition-all ${
                  selectedClaim.id === c.id
                    ? "border-[var(--color-brand-gold,#d4af37)] bg-[var(--color-cream-canvas,#fbf9f5)] shadow-sm"
                    : "border-slate-100 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-slate-500">{c.id}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${stateColors[c.state]}`}>
                    {c.state}
                  </span>
                </div>
                <h3 className="font-semibold text-xs leading-5 line-clamp-2">{c.claimTitle}</h3>
                <p className="text-[11px] text-slate-500 mt-1">{c.formulation}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>بچ: {c.batchNumber}</span>
                  {c.coldChainRequired && (
                    <span className="text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">❄ زنجیره سرد</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Right Col (2 cols): Detail, Lifecycle Stepper & Actions */}
        <section className="lg:col-span-2 bg-white border border-[var(--color-parchment-border,#e5dec9)] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
            <div>
              <span className="text-xs font-mono text-slate-400">{selectedClaim.id} — لات {selectedClaim.batchNumber}</span>
              <h2 className="text-lg font-bold mt-0.5">{selectedClaim.claimTitle}</h2>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${stateColors[selectedClaim.state]}`}>
              وضعیت فعلی: {selectedClaim.state}
            </span>
          </div>

          {/* 6-State Lifecycle Stepper */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500">مراحل چرخه حیات محتوا (Content Lifecycle Pipeline)</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
              {(["DRAFT", "UNDER_REVIEW", "APPROVED", "PUBLISHED", "EXPIRED", "RECALLED"] as const).map((st) => (
                <div
                  key={st}
                  className={`p-2 rounded-xl border ${
                    selectedClaim.state === st
                      ? "border-[var(--color-brand-gold,#d4af37)] bg-amber-50 font-bold text-amber-900"
                      : "border-slate-100 bg-slate-50 text-slate-400"
                  }`}
                >
                  {st}
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2 sm:space-y-0">
            <div>
              <span className="font-semibold text-slate-500 block">شواهد بالینی / مجوز رگولاتوری:</span>
              <span className="text-slate-800 font-mono mt-0.5 block">{selectedClaim.evidenceRef}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">مالک و بازبین علمی:</span>
              <span className="text-slate-800 mt-0.5 block">{selectedClaim.owner}</span>
            </div>
            <div className="sm:pt-2">
              <span className="font-semibold text-slate-500 block">تاریخ انقضای فرمولاسیون:</span>
              <span className="text-slate-800 font-mono mt-0.5 block">{selectedClaim.expiryDate}</span>
            </div>
            <div className="sm:pt-2">
              <span className="font-semibold text-slate-500 block">شرایط نگهداری و انبار:</span>
              <span className="text-slate-800 mt-0.5 block">
                {selectedClaim.coldChainRequired ? "زنجیره سرد دارویی (۲ تا ۸ درجه سلسیوس)" : "دمای محیط کنترل‌شده (< ۲۵°C)"}
              </span>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="space-y-3 pt-4 border-t">
            <span className="text-xs font-semibold text-slate-500 block">اقدامات حاکمیتی و تغییر وضعیت:</span>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => updateClaimState(selectedClaim.id, "UNDER_REVIEW")}
                aria-label="ارسال برای بازبینی علمی"
                className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-medium border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
              >
                ارسال به بازبینی علمی (Review)
              </button>
              <button
                onClick={() => updateClaimState(selectedClaim.id, "APPROVED")}
                aria-label="تایید بالینی و امضای رگولاتوری"
                className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-medium border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              >
                تایید بالینی (Approve)
              </button>
              <button
                onClick={() => updateClaimState(selectedClaim.id, "PUBLISHED")}
                aria-label="انتشار زنده در استورفرانت"
                className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-medium bg-[var(--color-cosmic-950,#0c132b)] text-white hover:bg-[var(--color-cosmic-900,#152147)]"
              >
                انتشار در کاتالوگ (Publish)
              </button>
              <button
                onClick={() => updateClaimState(selectedClaim.id, "EXPIRED")}
                aria-label="علامت‌گذاری انقضای بچ فرمولاسیون"
                className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-medium border border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100"
              >
                ثبت انقضا (Expire)
              </button>
              <button
                onClick={() => updateClaimState(selectedClaim.id, "RECALLED")}
                aria-label="فراخوان فوری دارویی و توقف فروش"
                className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
              >
                فراخوان دارویی فوری (Recall)
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
