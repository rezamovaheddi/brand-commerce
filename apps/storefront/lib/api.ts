import {
  CategorySchema,
  ProductListResponseSchema,
  ProductSchema,
  type Category,
  type Product,
  type ProductListResponse,
} from "@bc/contracts";

/** Base URL of the NestJS API (API_URL overrides the local default). */
const API_BASE = process.env.API_URL || "http://localhost:3001";

/**
 * Thrown ONLY when the API answers HTTP 404 for a single-product lookup.
 * Server components catch it and render the 404 page via notFound().
 * Every other failure (network, non-404 HTTP, schema mismatch) resolves
 * to null so pages can show an honest "service unavailable" state.
 */
export class NotFoundSignal extends Error {
  constructor() {
    super("product not found");
    this.name = "NotFoundSignal";
  }
}

function withQuery(
  path: string,
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/** One log line per failed request — never spam the server log. */
function logApiError(scope: string, message: string, extra?: unknown): void {
  if (extra === undefined) {
    console.error(`[storefront/api] ${scope}: ${message}`);
  } else {
    console.error(`[storefront/api] ${scope}: ${message}`, extra);
  }
}

/** GET /api/v1/products — paginated product list. null on any failure. */
export async function getProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
}): Promise<ProductListResponse | null> {
  const url = `${API_BASE}${withQuery("/api/v1/products", {
    page: params?.page,
    limit: params?.limit,
    category: params?.category,
    q: params?.q,
  })}`;
  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) {
      logApiError("getProducts", `HTTP ${response.status} from ${url}`);
      return null;
    }
    const parsed = ProductListResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      logApiError("getProducts", "payload failed schema validation", parsed.error.message);
      return null;
    }
    return parsed.data;
  } catch (error) {
    logApiError("getProducts", `request failed for ${url}`, error);
    return null;
  }
}

/**
 * GET /api/v1/products/:slug — single product.
 * - HTTP 404        -> throws NotFoundSignal (page renders the 404 page)
 * - other failures  -> resolves null (page renders an honest error state)
 */
export async function getProduct(slug: string): Promise<Product | null> {
  const url = `${API_BASE}/api/v1/products/${encodeURIComponent(slug)}`;
  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (response.status === 404) {
      throw new NotFoundSignal();
    }
    if (!response.ok) {
      logApiError("getProduct", `HTTP ${response.status} from ${url}`);
      return null;
    }
    const parsed = ProductSchema.safeParse(await response.json());
    if (!parsed.success) {
      logApiError("getProduct", "payload failed schema validation", parsed.error.message);
      return null;
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof NotFoundSignal) {
      throw error;
    }
    logApiError("getProduct", `request failed for ${url}`, error);
    return null;
  }
}

/** GET /api/v1/categories — category list with product counts. null on failure. */
export async function getCategories(): Promise<Category[] | null> {
  const url = `${API_BASE}/api/v1/categories`;
  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) {
      logApiError("getCategories", `HTTP ${response.status} from ${url}`);
      return null;
    }
    const parsed = CategorySchema.array().safeParse(await response.json());
    if (!parsed.success) {
      logApiError("getCategories", "payload failed schema validation", parsed.error.message);
      return null;
    }
    return parsed.data;
  } catch (error) {
    logApiError("getCategories", `request failed for ${url}`, error);
    return null;
  }
}
