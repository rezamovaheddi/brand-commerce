import type { Metadata } from "next";
import Link from "next/link";

/**
 * About page — the first real content page. Brand voice from the DERMAVIA
 * moodboard (Natural care. Lasting confidence.) with honest in-development
 * notes instead of invented claims.
 */
export const metadata: Metadata = {
  title: "درباره DERMAVIA | مراقبت طبیعی، اعتماد پایدار",
  description:
    "داستان برند DERMAVIA، ارزش‌های ما و تعهدمان به شفافیت — مراقبت طبیعی و علمی برای پوست.",
};

const VALUES: Array<{ title: string; description: string }> = [
  {
    title: "خالص",
    description: "فرمول‌های مینیمال؛ فقط آنچه پوست لازم دارد، بدون افزودنی‌های بی‌دلیل.",
  },
  {
    title: "ملایم",
    description: "محترم‌داشتن سد دفاعی پوست؛ pH متعادل و فاقد سولفات در پاک‌کننده‌ها.",
  },
  {
    title: "مؤثر",
    description: "ماده‌های فعال با شواهد، در غلظت‌های منطقی و قابل‌اعلام.",
  },
  {
    title: "طبیعی",
    description: "الهام از طبیعت، با استانداردهای علمی تولید مدرن.",
  },
];

const TRUST: Array<{ title: string; description: string; note: string }> = [
  {
    title: "شفافیت ترکیبات",
    description: "لیست کامل INCI هر محصول در صفحه محصول منتشر می‌شود.",
    note: "در انتظار داسیه تأییدشده محصولات",
  },
  {
    title: "ضمانت اصالت",
    description: "هر محصول با کد رهگیری اختصاصی عرضه می‌شود.",
    note: "در راه‌اندازی",
  },
  {
    title: "پشتیبانی واقعی",
    description: "پاسخ انسانی، بدون ربات‌های پاسخ‌ده بی‌سروته.",
    note: "در راه‌اندازی",
  },
];

export default function AboutPage() {
  return (
    <div className="container dv-page dv-about">
      <h1>درباره DERMAVIA</h1>
      <p className="dv-about-lede">
        DERMAVIA با یک باور ساده ساخته شد: مراقبت از پوست باید{" "}
        <strong>طبیعی، ملایم و قابل‌اعتماد</strong> باشد. ما محصولاتمان را مثل
        چیزی که برای پوست خودمان می‌خریم طراحی می‌کنیم — شفاف، علمی و بدون
        ادعای اضافه.
      </p>

      <section className="dv-about-values" aria-label="ارزش‌های برند">
        <h2>ارزش‌های ما</h2>
        <div className="dv-about-grid">
          {VALUES.map((value) => (
            <article key={value.title} className="dv-card dv-about-value">
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dv-about-trust" aria-label="تعهدات برند">
        <h2>تعهد ما به شما</h2>
        <div className="dv-about-grid">
          {TRUST.map((item) => (
            <article key={item.title} className="dv-card dv-about-value">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="dv-badge dv-about-note">{item.note}</span>
            </article>
          ))}
        </div>
      </section>

      <div className="dv-order-banner" role="note">
        این سایت در فاز راه‌اندازی است؛ داده‌های نمایش‌داده‌شده محصولات نمونه
        هستند (SAMPLE) و ادعای محصولات پیش از تأیید کارشناس منتشر نمی‌شود.
      </div>

      <p className="dv-about-cta">
        <Link href="/products" className="dv-btn">
          مشاهده محصولات
        </Link>
      </p>
    </div>
  );
}
