import Link from "next/link";
import { ProductListQuerySchema, type ProductListQuery } from "@bc/contracts";
import ProductCard from "../../components/ProductCard";
import { getCategories, getProducts } from "../../lib/api";
import { formatFaNumber } from "../../lib/format";

export const metadata = {
  title: "کاتالوگ محصولات و فرمولاسیون‌های بالینی | DERMAVIA",
  description:
    "مجموعه محصولات تخصصی مراقبت از پوست DERMAVIA؛ پاک‌کننده‌های ملایم، سرم‌های درمانی و کرم‌های ترمیم‌کننده با شفافیت کامل در ترکیبات.",
};

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

  const pageHref = (page: number): string => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.category) params.set("category", query.category);
    if (query.limit !== 12) params.set("limit", String(query.limit));
    params.set("page", String(page));
    return `/products?${params.toString()}`;
  };

  const activeCategory = query.category;

  return (
    <div className="container dv-page" style={{ paddingBlock: "36px 80px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--dv-navy)", margin: "0 0 10px" }}>
          فرمولاسیون‌های مراقبت بالینی DERMAVIA
        </h1>
        <p className="dv-muted" style={{ maxWidth: 650, margin: "0 auto", fontSize: "0.95rem" }}>
          طراحی‌شده با شواهد علمی، مواد مؤثره اثبات‌شده و بدون تست حیوانی؛ برای تقویت پایدار سد دفاعی پوست شما.
        </p>
      </div>

      {/* Category Pills Strip */}
      <div className="dv-cats" style={{ justifyContent: "center", marginBottom: 28 }}>
        <Link
          href="/products"
          className={`dv-cat-chip ${!activeCategory ? "is-active" : ""}`}
          style={{ textDecoration: "none", background: !activeCategory ? "var(--dv-navy)" : undefined, color: !activeCategory ? "#fffaf0" : undefined }}
        >
          همه محصولات
        </Link>
        {(categories ?? []).map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className={`dv-cat-chip ${isActive ? "is-active" : ""}`}
              style={{ textDecoration: "none", background: isActive ? "var(--dv-navy)" : undefined, color: isActive ? "#fffaf0" : undefined }}
            >
              {cat.nameFa}
            </Link>
          );
        })}
      </div>

      {/* Search & Filters */}
      <form method="get" action="/products" className="dv-filter" role="search" style={{ marginBottom: 32, justifyContent: "center" }}>
        <input
          type="search"
          name="q"
          defaultValue={query.q ?? ""}
          aria-label="جستجو"
          placeholder="جستجو در محصولات و ترکیبات…"
          className="dv-input dv-filter-search"
          style={{ maxWidth: 400 }}
        />
        <input type="hidden" name="category" value={activeCategory ?? ""} />
        <input type="hidden" name="page" value="1" />
        <button type="submit" className="dv-btn dv-btn-gold">
          جستجو
        </button>
      </form>

      {/* Products Grid */}
      {products === null ? (
        <div className="dv-empty">سرویس کاتالوگ در دسترس نیست.</div>
      ) : products.items.length === 0 ? (
        <div className="dv-empty" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ fontSize: "1.1rem", marginBottom: 12 }}>محصولی با این مشخصات یافت نشد.</p>
          <Link href="/products" className="dv-btn dv-btn-gold">
            مشاهده همه محصولات
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <span style={{ fontSize: "0.88rem", color: "var(--dv-muted)" }}>
              نمایش {formatFaNumber(products.items.length)} از {formatFaNumber(products.total)} فرمولاسیون
            </span>
          </div>

          <div className="dv-grid">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {products.totalPages > 1 ? (
            <nav aria-label="صفحه‌بندی" className="dv-pager" style={{ marginTop: 40 }}>
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
