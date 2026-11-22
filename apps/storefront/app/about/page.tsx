import type { Metadata } from "next";
import Link from "next/link";

/**
 * About page: Warm Clinical Luxury narrative of DERMAVIA.
 * Brand voice from the moodboard (Natural care. Lasting confidence.)
 * with clean laboratory standards, ethical formulations, and honest disclosures.
 */
export const metadata: Metadata = {
  title: "درباره DERMAVIA | داستان پیدایش، فلسفه فرمولاسیون و استانداردهای بالینی",
  description:
    "داستان برند DERMAVIA، اصول بنیادین فرمولاسیون بر پایه سد دفاعی پوست، تعهد شفافیت کامل INCI و استانداردهای تولید بالینی.",
};

const PILLARS = [
  {
    icon: "🛡️",
    title: "اولویت مطلق با سد دفاعی (Barrier-First)",
    description:
      "هر پوست سالم نیازمند یک میکروبیوم متعادل و سد لیپیدی مستحکم است. فرمول‌های ما بدون سورفکتانت‌های تهاجمی یا لایه‌بردارهای مخرب ساخته می‌شوند تا تعادل ذاتی پوست حفظ شود.",
  },
  {
    icon: "🔬",
    title: "غلظت‌های بالینی اثبات‌شده (Bio-Active Efficacy)",
    description:
      "ما از مواد مؤثره صرفاً برای جنبه تبلیغاتی استفاده نمی‌کنیم؛ ویتامین C، نیاسینامید، سرامیدها و پپتیدها در دقیق‌ترین غلظت‌های توصیه‌شده در ژورنال‌های درماتولوژی حضور دارند.",
  },
  {
    icon: "🌿",
    title: "شفافیت مطلق در ترکیبات (Zero-Hidden INCI)",
    description:
      "هیچ ترکیب پنهانی زیر عنوان کلی «عطر» یا «نگهدارنده» مخفی نمی‌شود. فهرست کامل مواد اولیه هر شیشه با افتخار در وب‌سایت و بسته‌بندی منتشر می‌گردد.",
  },
  {
    icon: "✨",
    title: "سازگاری کامل با پوست‌های حساس",
    description:
      "فاقد الکل‌های خشک‌کننده، اسانس‌های سنتزی، پارابن و روغن‌های سنگین مسدودکننده منافذ (Non-Comedogenic). آرامش پوست اولین معیار تست‌های ماست.",
  },
];

const STANDARDS = [
  {
    title: "استاندارد اتاق تمیز (Cleanroom ISO 22716)",
    desc: "فرآیند تولید و بسته‌بندی تحت شرایط گرید دارویی با پایش دائمی ذرات هوا و آلودگی‌های میکروبی.",
  },
  {
    title: "تولید با فرآیند سرد (Cold-Process Formulation)",
    desc: "محافظت از ساختار مولکولی عصاره‌های گیاهی حساس به حرارت و روغن‌های بیولوژیک در دمای کنترل‌شده.",
  },
  {
    title: "بسته‌بندی ایزوله ضد اشعه فرابنفش",
    desc: "ظروف شیشه‌ای کهربایی و تیره جهت جلوگیری از اکسیداسیون ترکیبات آنتی‌اکسیدانی تا آخرین قطره مصرف.",
  },
  {
    title: "۱۰۰٪ گیاهی و بدون تست حیوانی (Cruelty-Free)",
    desc: "ما هیچ فرمولاسیون یا ماده اولیه‌ای را روی موجودات زنده آزمایش نکرده و نخواهیم کرد.",
  },
];

export default function AboutPage() {
  return (
    <div className="dv-b2b-container">
      {/* Hero Header */}
      <div className="dv-b2b-hero" style={{ textAlign: "center", paddingBlock: 48 }}>
        <span className="dv-badge" style={{ background: "rgba(212, 175, 55, 0.18)", color: "var(--dv-gold)", marginBottom: 12, display: "inline-block" }}>
          داستان و رسالت ما
        </span>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--dv-navy)", margin: "0 0 16px" }}>
          علم درماتولوژی، لطافت مروارید
        </h1>
        <p className="dv-muted" style={{ maxWidth: 720, margin: "0 auto", fontSize: "1.05rem", lineHeight: 1.8 }}>
          DERMAVIA با یک باور ساده متولد شد: مراقبت از پوست نباید یک فرآیند تهاجمی یا پیچیده باشد.
          ما محصولاتمان را دقیقاً همان‌گونه می‌سازیم که برای پوست خودمان آرزو داشتیم — خالص، آرامش‌بخش، علمی و بدون ادعای توخالی.
        </p>
      </div>

      {/* Brand Story Prose Card */}
      <div className="dv-b2b-card" style={{ padding: "36px 40px" }}>
        <h2 style={{ fontSize: "1.4rem", color: "var(--dv-navy)", marginBottom: 18 }}>
          پیدایش یک ایده: احترام به ساختار زیستی پوست
        </h2>
        <div style={{ color: "var(--dv-ink-soft)", lineHeight: 1.9, fontSize: "0.98rem" }}>
          <p style={{ marginBottom: 16 }}>
            در صنعتی که اغلب با وعده‌های یک‌شبه، غلظت‌های تهاجمی اسیدها و بسته‌بندی‌های فریبنده پر شده است، جای خالی برندی که به
            <strong> بازسازی آرام و بنیادین سد دفاعی پوست </strong> بها دهد عمیقاً حس می‌شد. پوست انسان یک ارگان زنده و هوشمند است؛
            پاسخ به تحریک‌های مداوم و عطرهای تند، التهاب مزمن و پیری زودرس خواهد بود.
          </p>
          <p style={{ margin: 0 }}>
            تیم فرمولاتورهای درماویا با تکیه بر مقالات معتبر درماتولوژی، فرمول‌هایی با بافت اثیری (Ethereal) خلق کردند که مانند لایه‌ای
            محافظ و ابریشمین روی پوست می‌نشینند. هر قطره از سرم‌ها و کرم‌های ما، تجربه‌ای از رایحه طبیعی عصاره‌های گیاهی، حس لوکس و
            اثربخشی بالینی ملموس را به ارمغان می‌آورد.
          </p>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <section style={{ marginBlock: 36 }} aria-label="چهار اصل فرمولاسیون">
        <h2 style={{ textAlign: "center", fontSize: "1.5rem", color: "var(--dv-navy)", marginBottom: 24 }}>
          چهار رکن علمی در هر قطره DERMAVIA
        </h2>
        <div className="dv-b2b-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="dv-b2b-stat-card" style={{ padding: 24 }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: 10 }}>{pillar.icon}</span>
              <h3 style={{ fontSize: "1.05rem", color: "var(--dv-navy)", margin: "0 0 10px" }}>{pillar.title}</h3>
              <p style={{ fontSize: "0.88rem", color: "var(--dv-ink-soft)", lineHeight: 1.7, margin: 0 }}>
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Laboratory & Clinical Standards */}
      <div className="dv-b2b-card" style={{ background: "#fcf9f2", borderColor: "rgba(212, 175, 55, 0.3)" }}>
        <h2 style={{ fontSize: "1.35rem", color: "var(--dv-navy)", marginBottom: 20 }}>
          استانداردهای آزمایشگاهی و تعهد کیفیت
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {STANDARDS.map((std) => (
            <div key={std.title} style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 12, border: "1px solid var(--dv-line)" }}>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--dv-gold)", marginBottom: 8 }}>
                {std.title}
              </strong>
              <p style={{ fontSize: "0.85rem", color: "var(--dv-ink-soft)", margin: 0, lineHeight: 1.7 }}>
                {std.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Transparency & Disclaimer Box */}
      <div className="dv-order-banner" role="note" style={{ marginTop: 28 }}>
        <strong>تعهد شفافیت:</strong> این پلتفرم در حال حاضر در فاز پیش‌تولید و راه‌اندازی سراسری قرار دارد؛ اطلاعات و داده‌های نمایش داده شده
        محصولات مربوط به سری آزمایشگاهی نمونه (SAMPLE) بوده و قبل از تحویل رسمی با پروانه نهایی تطبیق داده می‌شوند.
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 36, flexWrap: "wrap" }}>
        <Link href="/products" className="dv-btn dv-btn-gold" style={{ paddingInline: 32 }}>
          مشاهده کاتالوگ محصولات
        </Link>
        <Link href="/contact" className="dv-btn" style={{ background: "#fff", border: "1px solid var(--dv-line)", paddingInline: 28 }}>
          مشاوره و ارتباط با ما
        </Link>
      </div>
    </div>
  );
}
