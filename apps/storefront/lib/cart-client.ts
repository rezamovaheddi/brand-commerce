import {
  ApiErrorSchema,
  CartSchema,
  type AddCartItem,
  type Cart,
  type UpdateCartItem,
} from "@bc/contracts";

/**
 * Client-side cart transport (browser only — never import from server code).
 *
 * All fetches go through the same-origin Next.js rewrite `/backend/*` ->
 * API_URL/api/v1/* (see next.config.mjs), so there are no CORS concerns.
 * The API is server-authoritative: unit prices and totals always come from
 * the server and every payload is validated against the shared contracts.
 */
const API_BASE = "/backend";

export type CartApiErrorKind = "network" | "parse" | "http";

/**
 * Typed failure surfaced by every cart helper.
 * - "network": fetch itself failed (API down, offline)
 * - "parse":   response body was not JSON or failed the contract schema
 * - "http":    API answered with a non-2xx status (status carries the code)
 */
export class CartApiError extends Error {
  readonly kind: CartApiErrorKind;
  readonly status?: number;

  constructor(kind: CartApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "CartApiError";
    this.kind = kind;
    this.status = status;
  }
}

/**
 * Performs the request, maps transport failures to CartApiError, and returns
 * the parsed JSON body. Non-2xx responses attempt to surface the API's own
 * Persian message (NestJS ApiError shape) before falling back to a generic one.
 */
async function requestCartPayload(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new CartApiError(
      "network",
      "سرویس سبد در دسترس نیست — ارتباط با API برقرار نشد.",
    );
  }

  const text = await response.text();

  if (!response.ok) {
    let serverMessage: string | undefined;
    try {
      const parsed = ApiErrorSchema.safeParse(JSON.parse(text) as unknown);
      if (parsed.success) {
        serverMessage = Array.isArray(parsed.data.message)
          ? parsed.data.message.join(" ")
          : parsed.data.message;
      }
    } catch {
      // Error body was not JSON — keep the generic HTTP message.
    }
    throw new CartApiError(
      "http",
      serverMessage ?? `خطای HTTP ${response.status} از سرویس سبد خرید.`,
      response.status,
    );
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new CartApiError("parse", "پاسخ سرویس سبد خرید قابل خواندن نبود.");
  }
}

/** Validates a payload against the shared Cart contract; throws on mismatch. */
function validateCart(payload: unknown): Cart {
  const parsed = CartSchema.safeParse(payload);
  if (!parsed.success) {
    throw new CartApiError(
      "parse",
      "پاسخ سرویس سبد خرید با قرارداد داده هم‌خوان نیست.",
    );
  }
  return parsed.data;
}

/** POST /backend/carts — creates a fresh guest cart. */
export async function createCart(): Promise<Cart> {
  return validateCart(await requestCartPayload("/carts", { method: "POST" }));
}

/** GET /backend/carts/:id — fetches a cart by id. */
export async function getCart(cartId: string): Promise<Cart> {
  return validateCart(
    await requestCartPayload(`/carts/${encodeURIComponent(cartId)}`),
  );
}

/** POST /backend/carts/:id/items — adds a variant; returns the updated cart. */
export async function addItem(cartId: string, item: AddCartItem): Promise<Cart> {
  return validateCart(
    await requestCartPayload(`/carts/${encodeURIComponent(cartId)}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }),
  );
}

/** PATCH /backend/carts/:id/items/:variantId — sets a new quantity. */
export async function updateItem(
  cartId: string,
  variantId: string,
  item: UpdateCartItem,
): Promise<Cart> {
  return validateCart(
    await requestCartPayload(
      `/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(variantId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      },
    ),
  );
}

/** DELETE /backend/carts/:id/items/:variantId — removes a line. */
export async function removeItem(cartId: string, variantId: string): Promise<Cart> {
  return validateCart(
    await requestCartPayload(
      `/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(variantId)}`,
      { method: "DELETE" },
    ),
  );
}
