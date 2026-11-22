import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Product } from "@bc/contracts";
import PriceTag from "../../../components/PriceTag";
import SampleBadge from "../../../components/SampleBadge";
import VariantAddToCart, {
  type VariantOption,
} from "../../../components/cart/VariantAddToCart";
import { NotFoundSignal, getProduct } from "../../../lib/api";
import { getDefaultVariant } from "../../../lib/product";
import { formatFaNumber } from "../../../lib/format";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    if (product) {
      return {
        title: `${product.nameFa} | DERMAVIA`,
        description: product.descriptionFa ?? undefined,
      };
    }
  } catch {
    // 404 or API failure — fall through
  }
  return { title: "محصول | DERMAVIA" };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product: Product | null = null;
  try {
    product = await getProduct(slug);
  } catch (error) {
    if (error instanceof NotFoundSignal) {
      notFound();
    }
    throw error;
  }

  if (product === null) {
    return (
      <div className="container dv-page">
        <div className="dv-empty">
          سرویس محصولات در دسترس نیست. اتصال API را بررسی کنید (apps/api روی پورت ۳۰۰۱).
        </div>
      </div>
    );
  }

  const variant = getDefaultVariant(product);

  const activeVariants: VariantOption[] = product.variants
    .filter((variantItem) => variantItem.status === "ACTIVE")
    .map((variantItem) => ({
      id: variantItem.id,
      titleFa: variantItem.titleFa,
      priceMinor: variantItem.priceMinor,
      currency: variantItem.currency,
      isDefault: variantItem.isDefault,
      availableToSell: variantItem.availableToSell,
    }));

  const totalStock = activeVariants.reduce((sum, v) => sum + v.availableToSell, 0);

  return (
    <div className="container dv-page-wrap">
      {/* Breadcrumb Navigation */}
      <nav aria-label="مسیر صفحه" className="dv-breadcrumb">
        <Link href="/">خانه</Link>
        <span className="dv-sep" aria-hidden="true">/</span>
        <Link href="/products">محصولات</Link>
        <span className="dv-sep" aria-hidden="true">/</span>
        {product.category && (
          <>
            <Link href={`/products?category=${encodeURIComponent(product.category.slug)}`}>
              {product.category.nameFa}
            </Link>
            <span className="dv-sep" aria-hidden="true">/</span>
          </>
        )}
        <span aria-current="page">{product.nameFa}</span>
      </nav>

      {/* Main PDP Layout Grid */}
      <div className="pdp-layout-grid">
        {/* Left/Media Column: Luxury Bottle Showcase with Glow */}
        <div className="pdp-media-card">
          <div className="pdp-aura-bed" aria-hidden="true" />
          <div className="pdp-illustration">
            <svg viewBox="0 0 240 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="pdp-bottle-svg" aria-label={product.nameFa}>
              <defs>
                <linearGradient id="pdp-glass" x1="10%" y1="10%" x2="90%" y2="90%">
                  <stop offset="0%" stopColor="#fff8e7" />
                  <stop offset="24%" stopColor="#f5d68d" />
                  <stop offset="58%" stopColor="#dfa342" />
                  <stop offset="86%" stopColor="#b6731e" />
                  <stop offset="100%" stopColor="#f4d485" />
                </linearGradient>
                <linearGradient id="pdp-cap" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c571c" />
                  <stop offset="30%" stopColor="#fae6ad" />
                  <stop offset="60%" stopColor="#c6933c" />
                  <stop offset="100%" stopColor="#875f21" />
                </linearGradient>
                <radialGradient id="pdp-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#f4cf82" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#b97214" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="120" cy="296" rx="64" ry="14" fill="rgba(45, 30, 15, 0.22)" />
              {/* Dropper / Pump */}
              <rect x="94" y="32" width="52" height="42" rx="6" fill="url(#pdp-cap)" />
              <rect x="88" y="70" width="64" height="10" rx="3" fill="url(#pdp-cap)" />
              {/* Bottle body */}
              <rect x="62" y="80" width="116" height="206" rx="20" fill="url(#pdp-glass)" stroke="#fffaf0" strokeWidth="1.8" />
              <ellipse cx="120" cy="180" rx="46" ry="68" fill="url(#pdp-glow)" />
              <rect x="74" y="96" width="12" height="174" rx="6" fill="#ffffff" opacity="0.65" />
              <text x="120" y="165" textAnchor="middle" fill="#5a3d13" fontFamily="Vazirmatn, sans-serif" fontSize="13" fontWeight="800">DERMAVIA</text>
              <text x="120" y="184" textAnchor="middle" fill="#6d4f24" fontFamily="system-ui, sans-serif" fontSize="8" letterSpacing="1.5">ETHEREAL V6</text>
            </svg>
          </div>

          <div className="pdp-quality-badges">
            <span>🌿 مواد اولیه ارگانیک</span>
            <span>🧪 فرمولاسیون آزمایشگاهی</span>
            <span>✨ ضمانت بازگشت ۷ روزه</span>
          </div>
        </div>

        {/* Right/Info Column: Title, Price, Variants, Add-to-Cart */}
        <div className="pdp-info-card">
          <div className="pdp-head-meta">
            {product.category && (
              <span className="pdp-category-chip">{product.category.nameFa}</span>
            )}
            {totalStock > 0 ? (
              <span className="pdp-stock-badge in-stock">
                ✓ موجود در انبار: {formatFaNumber(totalStock)} عدد
              </span>
            ) : (
              <span className="pdp-stock-badge out-of-stock">اتمام موجودی</span>
            )}
            {product.isSample && <SampleBadge />}
          </div>

          <h1 className="pdp-product-title">{product.nameFa}</h1>
          <p className="pdp-english-name" dir="ltr">{product.nameEn}</p>

          <div className="pdp-price-row">
            {variant ? (
              <PriceTag
                priceMinor={variant.priceMinor}
                currency={variant.currency}
                className="pdp-main-price"
              />
            ) : (
              <span className="dv-muted">قیمت در حال حاضر ثبت نشده</span>
            )}
          </div>

          {product.descriptionFa && (
            <p className="pdp-lead-description">{product.descriptionFa}</p>
          )}

          {/* Variant Selector + Add to Cart Island */}
          <div className="pdp-purchase-box">
            {activeVariants.length > 0 ? (
              <>
                <VariantAddToCart variants={activeVariants} />
                <div className="pdp-guarantee-note">
                  <span>🚀 ارسال اکسپرس در تهران و پست پیشتاز سراسری</span>
                  <span>🔒 درگاه پرداخت شتابی امن و ثبت رسمی فاکتور</span>
                </div>
              </>
            ) : (
              <div className="dv-empty">این محصول در حال حاضر برای سفارش آنلاین آماده نیست.</div>
            )}
          </div>
        </div>
      </div>

      {/* Accordion / Tabs: Ingredients (INCI), Ritual Guide, Clinical Evidence */}
      <section className="pdp-details-tabs-section">
        <div className="pdp-tabs-grid">
          {/* Tab 1: Ingredients */}
          <div className="pdp-tab-card">
            <div className="tab-card-head">
              <span className="tab-icon">🌿</span>
              <h3>ترکیبات فعال و فهرست INCI</h3>
            </div>
            <p className="tab-card-text">
              فرمولاسیون بر پایه هم‌افزایی کمپلکس پپتیدی، عصاره‌های بیولوژیک و هیالورونیک اسید با جرم‌های مولکولی چندگانه.
              فاقد پارابن، الکل خشک‌کننده، فتالات، رنگ‌های مصنوعی و روغن‌های معدنی مسدودکننده منافذ.
            </p>
            <div className="tab-inci-list">
              <span className="inci-pill">Aqua (Purified Water)</span>
              <span className="inci-pill">Sodium Hyaluronate (Multi-molecular)</span>
              <span className="inci-pill">Niacinamide (Vitamin B3)</span>
              <span className="inci-pill">Palmitoyl Tripeptide-5</span>
              <span className="inci-pill">Tocopherol (Vitamin E)</span>
              <span className="inci-pill">Organic Jojoba Seed Oil</span>
            </div>
          </div>

          {/* Tab 2: Ritual Guide */}
          <div className="pdp-tab-card">
            <div className="tab-card-head">
              <span className="tab-icon">✨</span>
              <h3>راهنمای مصرف و روتین پیشنهادی</h3>
            </div>
            <p className="tab-card-text">
              صبح و شب پس از شست‌وشوی کامل پوست با پاک‌کننده ملایم، ۳ تا ۴ قطره از محصول را روی صورت و گردن مرطوب بچکانید.
              با حرکات ملایم رو به بالا ماساژ دهید تا به‌طور کامل جذب شود. در طول روز همیشه از ضدآفتاب استفاده نمایید.
            </p>
            <ul className="tab-bullet-list">
              <li>سازگار با انواع پوست (خشک، نرمال، مختلط و حساس)</li>
              <li>قابلیت استفاده به عنوان پایه آرایش بدون پیل شدن</li>
              <li>اثربخشی بالینی محسوس پس از ۲۱ روز استفاده منظم</li>
            </ul>
          </div>

          {/* Tab 3: Boutique Guarantee */}
          <div className="pdp-tab-card">
            <div className="tab-card-head">
              <span className="tab-icon">🛡️</span>
              <h3>تعهد اصالت و آرامش خرید</h3>
            </div>
            <p className="tab-card-text">
              کلیه محصولات درماویا در ظروف شیشه‌ای ایزوله مقاوم در برابر UV بسته‌بندی شده‌اند تا پایداری ترکیبات آنتی‌اکسیدانی حفظ شود.
            </p>
            <ul className="tab-bullet-list">
              <li>۷ روز ضمانت انصراف و بازگشت در صورت پلمپ بودن</li>
              <li>امکان دریافت مشاوره تلفنی رایگان پیش و پس از خرید</li>
              <li>ثبت امتیاز خرید در باشگاه مشتریان اثیری درماویا</li>
            </ul>
            <div style={{ marginTop: 14 }}>
              <Link href="/support" className="dv-link" style={{ fontSize: "0.85rem", color: "var(--dv-gold)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span>💬</span>
                <span>نیاز به مشاوره پوستی برای این محصول دارید؟ گفتگو با کارشناس درماویا ←</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
