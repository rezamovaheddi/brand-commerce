import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Product } from "@bc/contracts";
import PriceTag from "../../../components/PriceTag";
import SampleBadge from "../../../components/SampleBadge";
import AddToCartButton from "../../../components/cart/AddToCartButton";
import { NotFoundSignal, getProduct } from "../../../lib/api";
import { getDefaultVariant } from "../../../lib/product";
import { formatPrice } from "../../../lib/format";

type ProductPageProps = {
  /** Next 15 App Router: params is a Promise. */
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
    // 404 or API failure — fall through to generic metadata.
  }
  return { title: "محصول | DERMAVIA" };
}

/** PDP: media placeholder, price, variant list, description, honest INCI box. */
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
    // API unreachable or payload invalid — honest error state, not a fake 404.
    return (
      <div className="container dv-page">
        <div className="dv-empty">
          سرویس محصولات در دسترس نیست. اتصال API را بررسی کنید (apps/api روی پورت ۳۰۰۱).
        </div>
      </div>
    );
  }

  const variant = getDefaultVariant(product);

  return (
    <div className="container dv-page">
      <nav aria-label="مسیر صفحه" className="dv-breadcrumb">
        <Link href="/">خانه</Link>
        <span className="dv-sep" aria-hidden="true">/</span>
        <Link href="/products">محصولات</Link>
        <span className="dv-sep" aria-hidden="true">/</span>
        <span aria-current="page">{product.nameFa}</span>
      </nav>

      <div className="dv-pdp">
        <div className="dv-pdp-media" aria-hidden="true">
          <span className="dv-pdp-initial">{product.nameEn.charAt(0).toUpperCase()}</span>
        </div>

        <div className="dv-pdp-info">
          <h1>{product.nameFa}</h1>
          <p className="dv-pdp-en" dir="ltr">{product.nameEn}</p>
          {product.isSample ? (
            <div className="dv-pdp-badges">
              <SampleBadge />
            </div>
          ) : null}

          {variant ? (
            <PriceTag
              priceMinor={variant.priceMinor}
              currency={variant.currency}
              className="dv-pdp-price"
            />
          ) : (
            <p className="dv-muted">قیمت این محصول هنوز ثبت نشده است.</p>
          )}

          {/* Add-to-cart is a client island wired to CartProvider; this server
              page only supplies the DEFAULT variant's id. Multi-variant
              selection UI is a follow-up (P3 slice). */}
          {variant ? (
            <>
              <AddToCartButton variantId={variant.id} titleFa={variant.titleFa} />
              <p className="dv-cart-note">
                پرداخت آنلاین در فاز بعدی پلتفرم فعال می‌شود — هیچ سفارشی ثبت نمی‌شود.
              </p>
            </>
          ) : null}

          {product.variants.length > 0 ? (
            <dl className="dv-variants" aria-label="نسخه‌های محصول">
              {product.variants.map((variantItem) => (
                <div key={variantItem.id} className="dv-variant-row">
                  <dt>
                    {variantItem.titleFa}
                    {variantItem.isDefault ? (
                      <span className="dv-default-tag">پیش‌فرض</span>
                    ) : null}
                  </dt>
                  <dd>{formatPrice(variantItem.priceMinor, variantItem.currency)}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {product.descriptionFa ? (
            <p className="dv-pdp-desc">{product.descriptionFa}</p>
          ) : null}

          {/* Honest placeholder: INCI data requires confirmed product content (V6 rule). */}
          <div className="dv-inci">
            <h2>ترکیبات (INCI)</h2>
            <p>در انتظار دادهٔ محصول تأییدشده — فعلاً ارائه نشده</p>
          </div>
        </div>
      </div>
    </div>
  );
}
