import Link from "next/link";
import type { Category, ProductListResponse } from "@bc/contracts";
import HomeHero from "../components/HomeHero";
import BookCatalog from "../components/BookCatalog";
import ProductCard from "../components/ProductCard";
import { getCategories, getProducts } from "../lib/api";
import { formatFaNumber } from "../lib/format";

const BRAND_VALUES = [
  {
    icon: "✧",
    title: "خلوص زیستی و بدون مواد زیان‌بار",
    body: "فرمولاسیون‌های پایدار بدون پارابن، سولفات‌های خشن، فتالات و اسانس‌های تحریک‌کننده.",
  },
  {
    icon: "◌",
    title: "سازگاری علمی با سد دفاعی پوست",
    body: "تنظیم دقیق pH بر پایه فیزیولوژی طبیعی پوست، محافظت از میکروبیوم و پیشگیری از التهاب.",
  },
  {
    icon: "✦",
    title: "مواد مؤثره با پشتوانه بالینی",
    body: "به‌کارگیری پپتیدها، هیالورونیک اسید چندوزنی و ویتامین‌های تثبیت‌شده با جذب بهینه.",
  },
  {
    icon: "◇",
    title: "تعهد اخلاقی و شفافیت کامل",
    body: "فرمول‌های ۱۰۰٪ وگان و بدون تست بر روی حیوانات، با اعلام شفاف تمامی ترکیبات (INCI).",
  },
] as const;

const RITUAL_STEPS = [
  {
    step: "۰۱",
    title: "پاکسازی ملایم و آماده‌سازی",
    desc: "شست‌وشوی کامل آلودگی‌های محیطی بدون سلب چربی طبیعی پوست با شوینده کرمی ملایم.",
    slug: "ethereal-gentle-cleanser",
  },
  {
    step: "۰۲",
    title: "تغذیه سلولی و جوانسازی عمیق",
    desc: "نفوذ ریزپپتیدها و ویتامین C پایدار به عمق لایه‌های اپیدرم برای تحریک تولید کلاژن.",
    slug: "ethereal-vitamin-c-serum",
  },
  {
    step: "۰۳",
    title: "آبرسانی و قفل رطوبت ۲۴ ساعته",
    desc: "محافظت و ترمیم سد دفاعی پوست با اسید هیالورونیک و کرم غنی حاوی سرامیدهای خالص.",
    slug: "ethereal-hyaluronic-serum",
  },
] as const;

const TESTIMONIALS = [
  {
    author: "مریم سلیمانی",
    role: "پوست مختلط و مستعد آکنه",
    stars: 5,
    quote:
      "سرم ویتامین C درماویا اولین محصولی بود که بدون کوچکترین سوزش یا قرمزی، لک‌های قدیمی را کمرنگ و پوستم را شفاف کرد. بافتش بسیار سبکه و حس چسبندگی نداره.",
  },
  {
    author: "دکتر پروانه شریفی",
    role: "پزشک عمومی و پژوهشگر درماتولوژی",
    stars: 5,
    quote:
      "فرمولاسیون سد دفاعی این برند بر پایه شواهد بیوشیمیایی استوار است. ترکیبات خالص سرامید و نیاسینامید با pH تنظیم‌شده، برای بازسازی پوست‌های دهیدراته ایده‌آل است.",
  },
  {
    author: "سارا رادمنش",
    role: "عضو باشگاه VIP مروارید",
    stars: 5,
    quote:
      "بافت کرم بازسازی‌کننده دقیقاً مثل ابریشم روی پوست می‌شینه. ارسال و بسته‌بندی لوکس همراه با کدهای رهگیری اصالت، تجربه خرید فوق‌العاده‌ای رقم زد.",
  },
];

const CLINICAL_METRICS = [
  { pct: "۹۴٪", label: "افزایش رطوبت و ترمیم سد دفاعی پوست در ۲۸ روز" },
  { pct: "۸۹٪", label: "کاهش مشهود التهاب، قرمزی و تحریک‌پذیری در پوست حساس" },
  { pct: "۹۷٪", label: "رضایت کامل از سبکی بافت و جذب سریع بدون حس چربی" },
];

export default async function HomePage() {
  let products: ProductListResponse | null = null;
  let categories: Category[] | null = null;
  try {
    [products, categories] = await Promise.all([
      getProducts({ limit: 8 }),
      getCategories(),
    ]);
  } catch (error) {
    console.error("[storefront/home] failed to load storefront data:", error);
  }

  return (
    <>
      {/* 1. Cinematic Hero Section */}
      <HomeHero />

      {/* 2. Interactive 3D Book Catalog */}
      <BookCatalog />

      {/* 3. Category Filter Chips */}
      {categories !== null && categories.length > 0 && (
        <section className="container cats-strip-section" aria-label="دسته‌بندی‌های محصولات">
          <div className="section-head-minimal">
            <span className="section-sub-tag">دسته‌بندی‌های تخصصی</span>
            <h2 className="section-title-sm">کلکسیون محصولات بر پایه نیاز پوست</h2>
          </div>
          <nav className="dv-cats">
            <Link href="/products" className="dv-cat-chip is-active">
              همه محصولات
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${encodeURIComponent(category.slug)}`}
                className="dv-cat-chip"
              >
                {category.nameFa}
                <span className="dv-cat-count">{formatFaNumber(category.productCount)}</span>
              </Link>
            ))}
          </nav>
        </section>
      )}

      {/* 4. Curated Featured Products Grid */}
      <section className="container dv-section" aria-labelledby="featured-title">
        <div className="section-header-centered">
          <span className="section-sub-tag">شاهکارهای آزمایشگاهی</span>
          <h2 id="featured-title" className="section-main-heading">منتخب کلکسیون درماویا</h2>
          <p className="section-lead-text">
            محصولاتی با فرمولاسیون اختصاصی برای تجربه نهایت لطافت، طراوت و شادابی پایدار.
          </p>
        </div>

        {products === null ? (
          <div className="dv-empty">
            سرویس محصولات در دسترس نیست. اتصال API را بررسی کنید (apps/api روی پورت ۳۰۰۱).
          </div>
        ) : products.items.length === 0 ? (
          <div className="dv-empty">هنوز محصولی در کاتالوگ ثبت نشده است.</div>
        ) : (
          <div className="dv-grid">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="all-products-cta-row">
          <Link href="/products" className="dv-btn view-all-cta">
            مشاهده کل ۸ محصول در فروشگاه رسمی ←
          </Link>
        </div>
      </section>

      {/* 5. Clinical Efficacy Counter Row */}
      <section className="container dv-section" style={{ paddingBlock: 24 }}>
        <div className="dv-b2b-card" style={{ background: "linear-gradient(135deg, rgba(253, 251, 247, 0.95) 0%, rgba(246, 241, 232, 0.9) 100%)", borderColor: "rgba(212, 175, 55, 0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span className="section-sub-tag">آزمون‌های بالینی ۴ هفته‌ای</span>
            <h2 style={{ fontSize: "1.4rem", color: "var(--dv-navy)", margin: "4px 0 0" }}>نتایج اثربخشی اثبات‌شده در آزمایشگاه</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, textAlign: "center" }}>
            {CLINICAL_METRICS.map((m) => (
              <div key={m.label} style={{ padding: "12px 16px" }}>
                <span className="dv-num" style={{ fontSize: "2.6rem", fontWeight: 800, color: "var(--dv-gold)", display: "block", marginBottom: 6 }}>
                  {m.pct}
                </span>
                <p style={{ fontSize: "0.88rem", color: "var(--dv-ink-soft)", margin: 0, lineHeight: 1.6 }}>
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Skincare Daily 3-Step Ritual */}
      <section className="container ritual-section" aria-labelledby="ritual-title">
        <div className="section-header-centered">
          <span className="section-sub-tag">آیین مراقبت روزانه</span>
          <h2 id="ritual-title" className="section-main-heading">روتین ۳ مرحله‌ای اکسیر درماویا</h2>
          <p className="section-lead-text">
            هم‌افزایی علمی ترکیبات برای دستیابی به حداکثر اثرگذاری و محافظت همه‌جانبه پوست.
          </p>
        </div>

        <div className="ritual-grid">
          {RITUAL_STEPS.map((r) => (
            <div key={r.step} className="ritual-card">
              <span className="ritual-step-num dv-num">{r.step}</span>
              <h3 className="ritual-step-title">{r.title}</h3>
              <p className="ritual-step-desc">{r.desc}</p>
              <Link href={`/products/${r.slug}`} className="ritual-step-link">
                مشاهده محصول متناظر →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Why Dermavia / Five Pillars of Trust */}
      <section className="container dv-section" aria-labelledby="values-title">
        <div className="section-header-centered">
          <span className="section-sub-tag">چرا درماویا؟</span>
          <h2 id="values-title" className="section-main-heading">تعهد تزلزل‌ناپذیر به کیفیت و صداقت</h2>
        </div>
        <div className="dv-values-grid">
          {BRAND_VALUES.map((value) => (
            <article key={value.title} className="dv-value-card">
              <div className="value-card-icon" aria-hidden="true">{value.icon}</div>
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 8. Verified Reviews & Testimonials */}
      <section className="container dv-section" aria-label="دیدگاه‌های مشتریان">
        <div className="section-header-centered">
          <span className="section-sub-tag">تجربه مصرف‌کنندگان</span>
          <h2 className="section-main-heading">صدای همراهان خانواده درماویا</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.author} className="dv-b2b-stat-card" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
              <div style={{ color: "var(--dv-gold)", fontSize: "1.1rem", marginBottom: 10 }}>
                {"★".repeat(t.stars)}
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--dv-ink-soft)", lineHeight: 1.8, marginBottom: 16, flexGrow: 1 }}>
                «{t.quote}»
              </p>
              <div style={{ borderTop: "1px solid var(--dv-line)", paddingTop: 12 }}>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--dv-navy)" }}>{t.author}</strong>
                <span className="dv-muted" style={{ fontSize: "0.8rem" }}>{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Loyalty & VIP Club Banner */}
      <section className="container loyalty-banner-section">
        <div className="loyalty-banner-card">
          <div className="loyalty-banner-content">
            <span className="banner-tag">باشگاه مشتریان اختصاصی</span>
            <h3>عضویت در حلقه مشتریان اثیری درماویا</h3>
            <p>
              با هر خرید امتیاز کسب کنید، کدهای تخفیف اختصاصی دریافت نمایید و به فرمول‌های تازه دسترسی زودهنگام داشته باشید.
            </p>
            <Link href="/loyalty" className="dv-btn banner-cta">
              ورود و مشاهده مزایای سطوح عضویت ✨
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
