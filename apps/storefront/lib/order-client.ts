import {
  ApiErrorSchema,
  OrderSchema,
  type CheckoutRequest,
  type Order,
} from "@bc/contracts";
import { CartApiError } from "./cart-client";

// Re-export so cart and order pages can import the shared typed error from
// the module they already use (unified failure design: network | parse | http).
export { CartApiError };

/**
 * Client-side order transport (browser only — never import from server code).
 *
 * Mirrors lib/cart-client.ts: every fetch goes through the same-origin Next.js
 * rewrite `/backend/*` -> API_URL/api/v1/* (see next.config.mjs), payloads are
 * validated against the shared contracts, and failures surface as the SAME
 * typed CartApiError (kind: network | parse | http) so pages can treat cart
 * and order failures uniformly. HTTP 404 on a single-order lookup throws the
 * dedicated OrderNotFoundSignal instead.
 */
const API_BASE = "/backend";

/**
 * Thrown ONLY when the API answers HTTP 404 for a single-order lookup
 * (getOrder). The order page renders an honest "سفارش یافت نشد" card —
 * never a fake 404 page.
 */
export class OrderNotFoundSignal extends Error {
  constructor() {
    super("order not found");
    this.name = "OrderNotFoundSignal";
  }
}

type RequestPayloadOptions = {
  /** HTTP method / headers / body for fetch. */
  init?: RequestInit;
  /**
   * When true, an HTTP 404 response throws OrderNotFoundSignal instead of a
   * generic CartApiError("http"). Used by getOrder only.
   */
  notFoundIsSignal?: boolean;
};

/**
 * Performs the request, maps transport failures to CartApiError, and returns
 * the parsed JSON body. Non-2xx responses attempt to surface the API's own
 * Persian message (NestJS ApiError shape) before falling back to a generic one.
 */
async function requestOrderPayload(
  path: string,
  options: RequestPayloadOptions = {},
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, options.init);
  } catch {
    throw new CartApiError(
      "network",
      "سرویس سفارش‌ها در دسترس نیست — ارتباط با API برقرار نشد.",
    );
  }

  const text = await response.text();

  if (!response.ok) {
    if (response.status === 404 && options.notFoundIsSignal === true) {
      throw new OrderNotFoundSignal();
    }
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
      serverMessage ?? `خطای HTTP ${response.status} از سرویس سفارش.`,
      response.status,
    );
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new CartApiError("parse", "پاسخ سرویس سفارش قابل خواندن نبود.");
  }
}

/** Validates a payload against the shared Order contract; throws on mismatch. */
function validateOrder(payload: unknown): Order {
  const parsed = OrderSchema.safeParse(payload);
  if (!parsed.success) {
    throw new CartApiError(
      "parse",
      "پاسخ سرویس سفارش با قرارداد داده هم‌خوان نیست.",
    );
  }
  return parsed.data;
}

/** POST /backend/checkout — converts a cart into a DRAFT order (no payment). */
export async function checkout(body: CheckoutRequest): Promise<Order> {
  return validateOrder(
    await requestOrderPayload("/checkout", {
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    }),
  );
}

/**
 * GET /backend/orders/:id — fetches one order.
 * HTTP 404 -> throws OrderNotFoundSignal; every other failure -> CartApiError.
 */
export async function getOrder(id: string): Promise<Order> {
  return validateOrder(
    await requestOrderPayload(`/orders/${encodeURIComponent(id)}`, {
      notFoundIsSignal: true,
    }),
  );
}

/** POST /backend/orders/:id/cancel — cancels a DRAFT order; returns it. */
export async function cancelOrder(id: string): Promise<Order> {
  return validateOrder(
    await requestOrderPayload(`/orders/${encodeURIComponent(id)}/cancel`, {
      init: { method: "POST" },
    }),
  );
}
