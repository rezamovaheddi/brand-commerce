import Link from "next/link";
import type { Category, ProductListResponse } from "@bc/contracts";
import LeafMark from "../components/LeafMark";
import ProductCard from "../components/ProductCard";
import { getCategories, getProducts } from "../lib/api";
import { formatFaNumber } from "../lib/format";

const BRAND_VALUES = [
  { title: "خالص", body: "ترکیبات شفاف و بدون افزودنی‌های غیرضروری." },
  { title: "ملایم", body: "فرمول‌های با pH متعادل، مناسب حتی پوست حساس." },
  { title: "مؤثر", body: "مواد فعال با پشتوانه‌ی شواهد علمی." },
  { title: "طبیعی", body: "الهام‌گرفته از عصاره‌های گیاهی و طبیعت." },
] as const;

/** Home: hero, category chips, featured grid and brand values. */
export default async function HomePage() {
  let products: ProductListResponse | null = null;
  let categories: Category[] | null = null;
  try {
    [products, categories] = await Promise.all([
      getProducts({ limit: 6 }),
      getCategories(),
    ]);
  } catch (error) {
    console.error("[storefront/home] failed to load storefront data:", error);
  }

  return (
    <>
      <section className="dv-hero">
        <div className="container dv-hero-inner">
          <LeafMark size={44} />
          <h1>مراقبت طبیعی. اعتماد پایدار.</h1>
          <p>پوست شما لایق مراقبت علمی و ملایم است</p>
          <Link href="/products" className="dv-btn">مشاهده محصولات</Link>
        </div>
      </section>

      {categories !== null && categories.length > 0 ? (
        <nav aria-label="دسته‌بندی‌های محصولات" className="container dv-cats">
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
      ) : null}

      <section className="container dv-section" aria-labelledby="featured-title">
        <h2 id="featured-title">منتخب محصولات</h2>
        {products === null ? (
          <div className="dv-empty">
            سرویس محصولات در دسترس نیست. اتصال API را بررسی کنید (apps/api روی پورت ۳۰۰۱).
          </div>
        ) : products.items.length === 0 ? (
          <div className="dv-empty">هنوز محصولی برای نمایش وجود ندارد.</div>
        ) : (
          <div className="dv-grid">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="container dv-section" aria-labelledby="values-title">
        <h2 id="values-title">چرا DERMAVIA؟</h2>
        <div className="dv-values-grid">
          {BRAND_VALUES.map((value) => (
            <article key={value.title} className="dv-value-card">
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
