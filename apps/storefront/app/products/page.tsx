import Link from "next/link";
import { ProductListQuerySchema, type ProductListQuery } from "@bc/contracts";
import ProductCard from "../../components/ProductCard";
import { getCategories, getProducts } from "../../lib/api";
import { formatFaNumber } from "../../lib/format";

export const metadata = {
  title: "محصولات | DERMAVIA",
  description:
    "فهرست محصولات مراقبت از پوست DERMAVIA با جستجو و فیلتر دسته‌بندی — بدون نیاز به جاوااسکریپت.",
};

type ProductsPageProps = {
  /** Next 15 App Router: searchParams is a Promise. */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** First value of a possibly-repeated query param. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = await searchParams;
  const parsedQuery = ProductListQuerySchema.safeParse({
    page: first(sp.page),
    limit: first(sp.limit),
    category: first(sp.category)?.trim() || undefined,
    q: first(sp.q)?.trim() || undefined,
  });
  // Invalid or missing query params fall back to schema defaults (page 1, limit 12).
  const query: ProductListQuery = parsedQuery.success
    ? parsedQuery.data
    : ProductListQuerySchema.parse({});

  const [products, categories] = await Promise.all([
    getProducts({
      page: query.page,
      limit: query.limit,
      category: query.category,
      q: query.q,
    }),
    getCategories(),
  ]);

  /** Pagination link preserving the active filters (page 1..totalPages). */
  const pageHref = (page: number): string => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.category) params.set("category", query.category);
    if (query.limit !== 12) params.set("limit", String(query.limit));
    params.set("page", String(page));
    return `/products?${params.toString()}`;
  };

  return (
    <div className="container dv-page">
      <h1>محصولات</h1>

      {/* Progressive-enhancement filter: plain GET form, works without JS. */}
      <form method="get" action="/products" className="dv-filter" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query.q ?? ""}
          aria-label="جستجو"
          placeholder="نام محصول…"
          className="dv-input dv-filter-search"
        />
        <select
          name="category"
          aria-label="دسته‌بندی"
          defaultValue={query.category ?? ""}
          className="dv-input"
        >
          <option value="">همه</option>
          {(categories ?? []).map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.nameFa}
            </option>
          ))}
        </select>
        {/* Every new search/filter submission restarts at page 1. */}
        <input type="hidden" name="page" value="1" />
        <button type="submit" className="dv-btn">اعمال</button>
      </form>

      {products === null ? (
        <div className="dv-empty">سرویس در دسترس نیست.</div>
      ) : products.items.length === 0 ? (
        <div className="dv-empty">محصولی یافت نشد.</div>
      ) : (
        <>
          <p className="dv-result-note">
            {formatFaNumber(products.total)} محصول
          </p>
          <div className="dv-grid">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {products.totalPages > 1 ? (
            <nav aria-label="صفحه‌بندی" className="dv-pager">
              {query.page > 1 ? (
                <Link href={pageHref(query.page - 1)} className="dv-pager-link" rel="prev">
                  قبلی
                </Link>
              ) : (
                <span className="dv-pager-disabled" aria-disabled="true">قبلی</span>
              )}
              <span className="dv-pager-status">
                صفحهٔ {formatFaNumber(query.page)} از {formatFaNumber(products.totalPages)}
              </span>
              {query.page < products.totalPages ? (
                <Link href={pageHref(query.page + 1)} className="dv-pager-link" rel="next">
                  بعدی
                </Link>
              ) : (
                <span className="dv-pager-disabled" aria-disabled="true">بعدی</span>
              )}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
