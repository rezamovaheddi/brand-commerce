"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatFaNumber } from "../../lib/format";
import { useCart } from "../../components/cart/CartProvider";

interface Article {
  id: string;
  topic: string;
  category: string;
  title: string;
  summary: string;
  minutes: number;
  glyph: string;
  products: Array<{ name: string; slug: string; variantId: string }>;
  body: Array<[string, string]>;
}

const ARTICLES: Article[] = [
  {
    id: "skin-barrier-basics",
    topic: "science",
    category: "علم پوست",
    title: "سد دفاعی پوست؛ از واژه تا شناخت روزمره",
    summary: "نگاهی عمومی به نقش سد پوستی، رطوبت و عواملی که می‌توانند تجربه و سلامت پوست را دگرگون سازند.",
    minutes: 5,
    glyph: "✧",
    products: [{ name: "کرم مغذی بازسازنده خاویار", slug: "ethereal-cream-cleanser", variantId: "cmwqednwq000bezd46qmazkpm" }],
    body: [
      ["شروع از یک مفهوم زیستی ساده", "سطح پوست فقط یک لایه ظاهری نیست. لایه شاخی پوست در کنار لیپیدهای طبیعی و پیوندهای بین‌سلولی، اصلی‌ترین سد محافظ بدن در برابر آلودگی‌ها و از دست رفتن رطوبت است."],
      ["چه تغییراتی را ثبت کنیم؟", "احساس کشیدگی، خارش، قرمزی یا پوسته‌پوسته شدن پس از شست‌وشو، نشانه‌هایی از تضعیف سد دفاعی هستند. در چنین شرایطی باید از شوینده‌های ملایم با سورفکتانت‌های اسیدی استفاده شود."],
      ["راهکار درمانی بر پایه علم", "به جای شوک وارد کردن به پوست با محصولات متعدد، روتین را به شوینده ملایم، مرطوب‌کننده غنی از سرامید و ضدآفتاب خلاصه کنید تا لایه محافظ بازسازی شود."]
    ],
  },
  {
    id: "build-simple-routine",
    topic: "routine",
    category: "راهنمای روتین",
    title: "چطور یک روتین ساده و مؤثر بسازیم؟",
    summary: "چارچوبی گام‌به‌گام برای روتین روزانه بدون سردرگمی میان ده‌ها سرم و کرم تبلیغاتی.",
    minutes: 4,
    glyph: "◌",
    products: [
      { name: "اکسیر جوانساز سلولی", slug: "ethereal-vitamin-c-serum", variantId: "cmwqednwt000fezd4x6qsnenv" },
      { name: "ژل شست‌وشوی ملایم", slug: "ethereal-gentle-cleanser", variantId: "cmwqednwj0007ezd4vyii3l8c" },
    ],
    body: [
      ["کمتر اما باکیفیت‌تر", "پوست به ده محصول مختلف نیاز ندارد؛ نظم و استمرار مهم‌ترین عامل اثربخشی است. پایه هر روتین پایدار سه چیز است: پاکسازی، تغذیه فعال و محافظت."],
      ["ترتیب درست اعمال لایه‌ها", "همیشه محصولات را از رقیق‌ترین بافت به سمت غلیظ‌ترین استفاده کنید: ابتدا شوینده، سپس سرم‌های بر پایه آب، بعد از آن کرم‌ها و در پایان روز، ضدآفتاب."],
      ["صبر برای دیدن نتایج بالینی", "چرخه بازسازی سلولی پوست حداقل ۲۸ روز به طول می‌انجامد. ارزیابی اثربخشی هر فرمول نیازمند حداقل ۴ تا ۶ هفته استفاده منظم است."]
    ],
  },
  {
    id: "read-inci",
    topic: "ingredients",
    category: "ترکیبات",
    title: "خواندن فهرست INCI بدون گم‌شدن در نام‌های پیچیده",
    summary: "INCI چیست، چرا نام بین‌المللی مواد اهمیت دارد و چطور ترکیبات فریبنده را شناسایی کنیم؟",
    minutes: 6,
    glyph: "⌘",
    products: [{ name: "سرم هیالورونیک اسید اتیریال", slug: "ethereal-hyaluronic-serum", variantId: "cmwqednww000jezd4nyoc59vo" }],
    body: [
      ["استاندارد بین‌المللی نام‌گذاری (INCI)", "فهرست INCI استاندارد جهانی برای شفافیت کامل فرمولاسیون است. مواد اولیه به ترتیب غلظت از بیشترین به کمترین درج می‌شوند."],
      ["دام درصدها و نام‌های تجاری", "حضور نام یک عصاره گیاهی در انتهای لیست به معنای غلظت مؤثر آن نیست. مواد فعال اصلی باید در میان ۵ ترکیب نخست فرمول قرار داشته باشند."],
      ["تعهد درماویا به شفافیت رادیکال", "در کلیه فرمولاسیون‌های درماویا، درصد وزنی مواد فعال و منشأ گیاهی یا بیوتکنولوژیک آن‌ها به‌طور شفاف در شناسنامه محصول درج شده است."]
    ],
  },
  {
    id: "patch-test-awareness",
    topic: "science",
    category: "علم پوست",
    title: "تست موضعی (Patch Test)؛ آزمون طلایی پیش از مصرف",
    summary: "چرا حتی ارگانیک‌ترین و ملایم‌ترین ترکیبات نیازمند آزمایش حساسیت روی پوست شما هستند؟",
    minutes: 4,
    glyph: "◇",
    products: [],
    body: [
      ["حساسیت فردی و بیوشیمی پوست", "حتی مواد صددرصد طبیعی مانند عصاره بابونه یا روغن‌های گیاهی خالص می‌توانند در برخی افراد واکنش آلرژیک ایجاد کنند."],
      ["روش استاندارد پچ تست", "مقدار کمی از محصول را پشت لاله گوش یا قسمت داخلی بازو بزنید و ۲۴ تا ۴۸ ساعت صبر کنید. در صورت نبود قرمزی یا خارش، با خیال آسوده استفاده نمایید."]
    ],
  },
  {
    id: "ingredient-transparency",
    topic: "ingredients",
    category: "ترکیبات",
    title: "شفافیت فرمولاسیون؛ ملاک ارزیابی یک برند پیشرو",
    summary: "چرا واژه‌های کلی نظیر «حاوی عصاره‌های طبیعی» بدون انتشار آنالیز آزمایشگاهی کافی نیستند؟",
    minutes: 5,
    glyph: "✦",
    products: [{ name: "اکسیر جوانساز سلولی", slug: "ethereal-vitamin-c-serum", variantId: "cmwqednwt000fezd4x6qsnenv" }],
    body: [
      ["فهرست مواد اولیه فراتر از برچسب ظاهری", "خریدار آگاه نیاز دارد تا سازگاری، غلظت موثر و روش استخراج مواد فعال را بررسی کند."],
      ["پایداری ترکیبات آنتی‌اکسیدانی", "ویتامین C و رتینوئیدها در صورت عدم فرموله‌شدن در محیط بدون اکسیژن و ظروف تیره به سرعت اکسید شده و اثربخشی خود را از دست می‌دهند."]
    ],
  },
  {
    id: "morning-evening",
    topic: "routine",
    category: "راهنمای روتین",
    title: "تفاوت بنیادین نیازهای پوست در صبح و شب",
    summary: "چرا پوست در طول روز سپر دفاعی است و در شب وارد فاز ترمیم و بازسازی سلولی می‌شود؟",
    minutes: 3,
    glyph: "☼",
    products: [
      { name: "شیر پاک‌کننده خامه‌ای", slug: "ethereal-cream-cleanser", variantId: "cmwqednwq000bezd46qmazkpm" },
      { name: "ژل شست‌وشوی ملایم", slug: "ethereal-gentle-cleanser", variantId: "cmwqednwj0007ezd4vyii3l8c" },
    ],
    body: [
      ["صبح: محافظت در برابر استرس‌های محیطی", "در روز اولویت پوست مقابله با رادیکال‌های آزاد ناشی از نور خورشید و آلودگی هوا است. آنتی‌اکسیدان‌ها و ضدآفتاب‌ها قهرمانان صبح هستند."],
      ["شب: ساخت کلاژن و ترمیم DNA سلولی", "حین خواب جریان خون مویرگی پوست افزایش می‌یابد. این زمان ایده‌آل برای نفوذ پپتیدها، ترکیبات بازسازنده و مرطوب‌کننده‌های غنی است."]
    ],
  },
];

export default function MagazinePage() {
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const { add } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);

  // Reading progress scroll tracker
  useEffect(() => {
    function handleScroll() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setReadingProgress(Math.min(100, Math.max(0, (window.scrollY / total) * 100)));
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredArticles = selectedTopic === "all"
    ? ARTICLES
    : ARTICLES.filter((a) => a.topic === selectedTopic);

  const handleAddProduct = async (variantId: string) => {
    setAddingId(variantId);
    try {
      await add(variantId, 1);
    } catch {
      // Handled
    } finally {
      setAddingId(null);
    }
  };

  return (
    <>
      {/* Reading Progress Indicator Top Bar */}
      <div className="reading-progress-track" aria-hidden="true">
        <div className="reading-progress-bar" style={{ width: `${readingProgress}%` }} />
      </div>

      <div className="container dv-page-wrap">
        {/* Magazine Header */}
        <div className="magazine-header">
          <span className="magazine-badge">نشریه تخصصی درماویا</span>
          <h1 className="magazine-title">دانشنامه مراقبت علمی از پوست</h1>
          <p className="magazine-subtitle">
            مقالاتی معتبر و کاربردی پیرامون زیست‌شناسی پوست، بررسی ترکیبات (INCI) و راهنمای ساخت روتین‌های روزانه.
          </p>
        </div>

        {/* Topic Filters Strip */}
        <div className="magazine-filters">
          <button
            type="button"
            className={`topic-chip ${selectedTopic === "all" ? "is-active" : ""}`}
            onClick={() => setSelectedTopic("all")}
          >
            همه مقالات ({formatFaNumber(ARTICLES.length)})
          </button>
          <button
            type="button"
            className={`topic-chip ${selectedTopic === "science" ? "is-active" : ""}`}
            onClick={() => setSelectedTopic("science")}
          >
            علم پوست
          </button>
          <button
            type="button"
            className={`topic-chip ${selectedTopic === "routine" ? "is-active" : ""}`}
            onClick={() => setSelectedTopic("routine")}
          >
            راهنمای روتین
          </button>
          <button
            type="button"
            className={`topic-chip ${selectedTopic === "ingredients" ? "is-active" : ""}`}
            onClick={() => setSelectedTopic("ingredients")}
          >
            شناخت ترکیبات (INCI)
          </button>
        </div>

        {/* Articles Grid */}
        <div className="articles-grid">
          {filteredArticles.map((art) => (
            <article key={art.id} className="article-card">
              <div className="article-card-head">
                <span className="article-glyph">{art.glyph}</span>
                <span className="article-category-tag">{art.category}</span>
                <span className="article-time dv-num">{formatFaNumber(art.minutes)} دقیقه مطالعه</span>
              </div>

              <h3 className="article-card-title">{art.title}</h3>
              <p className="article-card-summary">{art.summary}</p>

              <div className="article-card-actions">
                <button
                  type="button"
                  className="article-read-btn"
                  onClick={() => setActiveArticle(art)}
                >
                  مطالعه کامل مقاله ←
                </button>
                {art.products.length > 0 && (
                  <span className="article-product-badge">
                    🛍️ {formatFaNumber(art.products.length)} محصول مرتبط
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Article Detail Reader Modal Dialog */}
      {activeArticle && (
        <div
          className="article-dialog-backdrop"
          onClick={() => setActiveArticle(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="artDialogTitle"
        >
          <div className="article-dialog-panel" onClick={(e) => e.stopPropagation()}>
            <div className="article-dialog-head">
              <div>
                <span className="article-dialog-cat">{activeArticle.category}</span>
                <h2 id="artDialogTitle" className="article-dialog-title">{activeArticle.title}</h2>
                <span className="article-dialog-meta dv-num">زمان تقریبی مطالعه: {formatFaNumber(activeArticle.minutes)} دقیقه</span>
              </div>
              <button
                type="button"
                className="article-dialog-close"
                onClick={() => setActiveArticle(null)}
                aria-label="بستن مقاله"
              >
                ✕
              </button>
            </div>

            <div className="article-dialog-content">
              {activeArticle.body.map(([heading, para], i) => (
                <div key={i} className="article-section-block">
                  <h4>{heading}</h4>
                  <p>{para}</p>
                </div>
              ))}

              {/* Shoppable Linked Products Box */}
              {activeArticle.products.length > 0 && (
                <div className="article-shoppable-box">
                  <div className="shoppable-head">
                    <span className="shoppable-sparkle">✧</span>
                    <h4>محصولات مرتبط با این مقاله</h4>
                  </div>
                  <div className="shoppable-grid">
                    {activeArticle.products.map((p) => (
                      <div key={p.slug} className="shoppable-item-card">
                        <div>
                          <strong>{p.name}</strong>
                          <p>پیشنهاد تحریریه برای این راهنما</p>
                        </div>
                        <div className="shoppable-actions">
                          <Link href={`/products/${p.slug}`} className="dv-outline-btn">
                            جزئیات
                          </Link>
                          <button
                            type="button"
                            className="dv-btn"
                            onClick={() => handleAddProduct(p.variantId)}
                            disabled={addingId === p.variantId}
                          >
                            {addingId === p.variantId ? "افزوده شد..." : "+ افزودن به سبد"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
