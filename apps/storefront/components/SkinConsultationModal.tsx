"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./cart/CartProvider";

interface SkinConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SKIN_TYPES = [
  { id: "dry", label: "خشک و دهیدراته", desc: "احساس کشیدگی و نیاز به آبرسانی عمقی" },
  { id: "oily", label: "چرب و مختلط", desc: "براقی در ناحیه T-zone یا مستعد منافذ" },
  { id: "sensitive", label: "حساس و مستعد قرمزی", desc: "واکنش سریع به تغییرات آب‌وهوایی یا محصولات" },
  { id: "normal", label: "نرمال و متعادل", desc: "نیاز به حفظ شادابی، شفافیت و پیشگیری از پیری" },
];

const CONCERNS = [
  { id: "antiaging", label: "جوانسازی و کاهش خطوط", desc: "تقویت سنتز کلاژن و استحکام بافت پوست" },
  { id: "hydration", label: "آبرسانی عمیق و طراوت", desc: "رفع کم‌آبی با اسید هیالورونیک چندمولکولی" },
  { id: "brightening", label: "روشن‌کنندگی و لک", desc: "یکنواخت‌سازی تناژ با ویتامین C پایدار" },
  { id: "barrier", label: "ترمیم و بازسازی سد دفاعی", desc: "تغذیه غنی با عصاره خاویار و سرامیدها" },
];

const RECOMMENDATIONS: Record<string, {
  name: string;
  slug: string;
  variantId: string;
  reason: string;
  routineStep: string;
}> = {
  antiaging: {
    name: "سرم ویتامین C اتیریال (حجم ۳۰ml)",
    slug: "ethereal-vitamin-c-serum",
    variantId: "cl_sample_v_3", // Fallback to first available or mapped variant
    reason: "بهترین انتخاب برای تحریک کلاژن‌سازی، کاهش لک‌های اکسیداتیو و بازیابی خاصیت ارتجاعی پوست.",
    routineStep: "مرحله ۲: سرم درمانی پس از شست‌وشو",
  },
  hydration: {
    name: "سرم هیالورونیک اسید اتیریال (حجم ۳۰ml)",
    slug: "ethereal-hyaluronic-serum",
    variantId: "cl_sample_v_4",
    reason: "نفوذ به لایه‌های عمقی اپیدرم برای حفظ هیدراتاسیون ۲۴ ساعته بدون ایجاد چربی مازاد.",
    routineStep: "مرحله ۲: سرم آبرسان روزانه",
  },
  brightening: {
    name: "سرم ویتامین C اتیریال (حجم ۳۰ml)",
    slug: "ethereal-vitamin-c-serum",
    variantId: "cl_sample_v_3",
    reason: "مهار ملانین اضافی و شفافیت خیره‌کننده با آنتی‌اکسیدان‌های بیولوژیک باکیفیت.",
    routineStep: "مرحله ۲: سرم درمانی روزانه",
  },
  barrier: {
    name: "شیر پاک‌کننده خامه‌ای اتیریال (حجم ۲۰۰ml)",
    slug: "ethereal-cream-cleanser",
    variantId: "cl_sample_v_2",
    reason: "پاکسازی فوق‌ملایم چربی‌ها همراه با روغن جوجوبا که چربی‌های حیاتی پوست را تخریب نمی‌کند.",
    routineStep: "مرحله ۱: شست‌وشوی ملایم صبح و شب",
  },
};

export default function SkinConsultationModal({ isOpen, onClose }: SkinConsultationModalProps) {
  const { add } = useCart();
  const [selectedType, setSelectedType] = useState<string>("dry");
  const [selectedConcern, setSelectedConcern] = useState<string>("antiaging");
  const [step, setStep] = useState<number>(1);
  const [adding, setAdding] = useState<boolean>(false);

  if (!isOpen) return null;

  const rec = RECOMMENDATIONS[selectedConcern] || RECOMMENDATIONS.antiaging;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      // Add first variant or redirect to PDP
      await add(rec.variantId, 1);
      onClose();
    } catch {
      // If variantId is dynamic, user can open PDP
      window.location.href = `/products/${rec.slug}`;
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="consult-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="consultTitle">
      <div className="consult-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="consult-modal-head">
          <div className="consult-modal-title">
            <span className="consult-modal-badge">مشاوره تخصصی آنلاین</span>
            <h3 id="consultTitle">تشخیص نیاز و روتین هوشمند پوست</h3>
          </div>
          <button type="button" className="consult-close-btn" onClick={onClose} aria-label="بستن">✕</button>
        </div>

        <div className="consult-modal-body">
          {step === 1 && (
            <div className="consult-step">
              <h4 className="consult-step-title">۱. نوع پوست خود را مشخص کنید:</h4>
              <div className="consult-options-grid">
                {SKIN_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`consult-option-card ${selectedType === t.id ? "is-selected" : ""}`}
                    onClick={() => setSelectedType(t.id)}
                  >
                    <div className="consult-opt-check">{selectedType === t.id ? "●" : "○"}</div>
                    <div>
                      <strong>{t.label}</strong>
                      <p>{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="dv-btn consult-next-btn"
                onClick={() => setStep(2)}
              >
                مرحله بعد: اولویت مراقبتی →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="consult-step">
              <h4 className="consult-step-title">۲. مهم‌ترین دغدغه یا هدف مراقبت از پوست شما چیست؟</h4>
              <div className="consult-options-grid">
                {CONCERNS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`consult-option-card ${selectedConcern === c.id ? "is-selected" : ""}`}
                    onClick={() => setSelectedConcern(c.id)}
                  >
                    <div className="consult-opt-check">{selectedConcern === c.id ? "●" : "○"}</div>
                    <div>
                      <strong>{c.label}</strong>
                      <p>{c.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="consult-actions-row">
                <button type="button" className="dv-outline-btn" onClick={() => setStep(1)}>
                  ← بازگشت
                </button>
                <button type="button" className="dv-btn consult-next-btn" onClick={() => setStep(3)}>
                  مشاهده نتیجه تشخیص هوشمند ✨
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="consult-step consult-result">
              <div className="consult-result-banner">
                <span className="result-star">✧</span>
                <div>
                  <h4>نسخه اختصاصی پوست شما</h4>
                  <p>بر اساس پوست <strong>{SKIN_TYPES.find(t => t.id === selectedType)?.label}</strong> با هدف <strong>{CONCERNS.find(c => c.id === selectedConcern)?.label}</strong></p>
                </div>
              </div>

              <div className="consult-rec-card">
                <div className="consult-rec-badge">{rec.routineStep}</div>
                <h3 className="consult-rec-title">{rec.name}</h3>
                <p className="consult-rec-reason">{rec.reason}</p>

                <div className="consult-rec-actions">
                  <Link
                    href={`/products/${rec.slug}`}
                    className="dv-outline-btn"
                    onClick={onClose}
                  >
                    بررسی جزئیات علمی و ترکیبات
                  </Link>
                  <button
                    type="button"
                    className="dv-btn"
                    onClick={handleAddToCart}
                    disabled={adding}
                  >
                    {adding ? "در حال افزودن..." : "+ افزودن مستقیم به سبد خرید"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="consult-restart-btn"
                onClick={() => setStep(1)}
              >
                تغییر پاسخ‌ها و شروع دوباره
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
