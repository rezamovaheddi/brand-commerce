import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Product } from "@bc/contracts";
import PriceTag from "../../../components/PriceTag";
import SampleBadge from "../../../components/SampleBadge";
import ProductMediaIllustration from "../../../components/ProductMediaIllustration";
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
            <ProductMediaIllustration product={product} size="pdp" className="pdp-bottle-svg" />
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
