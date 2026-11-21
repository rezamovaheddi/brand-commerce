import {
  ApiErrorSchema,
  PaymentSchema,
  type Payment,
} from "@bc/contracts";
import { CartApiError } from "./cart-client";

// Re-export so order/payment UI imports the shared typed error from one place.
export { CartApiError };

/**
 * Client-side sandbox payment transport (browser only). Mirrors cart/order
 * clients: same-origin `/backend/*` rewrite, contract validation, unified
 * typed errors. isSandbox is literal true — the UI must label payments SANDBOX.
 */
const API_BASE = "/backend";

async function requestJson<T>(
  url: string,
  init: RequestInit,
  parse: (body: unknown) => T | null,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new CartApiError("network", "سرویس پرداخت در دسترس نیست.");
  }
  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = ApiErrorSchema.safeParse(raw);
    const message = apiError.success
      ? Array.isArray(apiError.data.message)
        ? apiError.data.message.join(" — ")
        : apiError.data.message
      : "خطای پردازش پرداخت رخ داد.";
    throw new CartApiError("http", message, response.status);
  }
  const parsed = parse(raw);
  if (parsed === null) {
    throw new CartApiError("parse", "پاسخ درگاه آزمایشی نامعتبر بود.", response.status);
  }
  return parsed;
}

export interface PayOrderResult {
  /** Defensive order shape: the status enum may move faster than the schema. */
  order: { id: string; status: string; subtotalMinor: number; currency: string };
  payment: Payment;
}

/** Starts a sandbox payment for a DRAFT order (DRAFT → AWAITING_PAYMENT). */
export async function payOrder(orderId: string, idempotencyKey?: string): Promise<PayOrderResult> {
  return requestJson<PayOrderResult>(
    `${API_BASE}/payments/orders/${orderId}/pay`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
      },
      body: JSON.stringify({}),
    },
    (body) => {
      const obj = body as { order?: { id: string; status: string; subtotalMinor: number; currency: string }; payment?: unknown };
      if (!obj?.order || typeof obj.order.status !== "string") {
        return null;
      }
      const payment = PaymentSchema.safeParse(obj.payment);
      return payment.success ? { order: obj.order, payment: payment.data } : null;
    },
  );
}

/** Sandbox gateway simulator confirm — only exists while PAYMENT_SANDBOX_MODE. */
export async function sandboxConfirm(paymentId: string, result: "succeeded" | "failed"): Promise<Payment> {
  return requestJson<Payment>(
    `${API_BASE}/payments/${paymentId}/sandbox-confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    },
    (body) => {
      const payment = PaymentSchema.safeParse(body);
      return payment.success ? payment.data : null;
    },
  );
}

/** Sandbox refund (SUCCEEDED → REFUNDED) + order PAID → REFUNDED. */
export async function refundPayment(paymentId: string): Promise<PayOrderResult> {
  return requestJson<PayOrderResult>(
    `${API_BASE}/payments/${paymentId}/refund`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) },
    (body) => {
      const obj = body as { order?: { id: string; status: string; subtotalMinor: number; currency: string }; payment?: unknown };
      if (!obj?.order || typeof obj.order.status !== "string") {
        return null;
      }
      const payment = PaymentSchema.safeParse(obj.payment);
      return payment.success ? { order: obj.order, payment: payment.data } : null;
    },
  );
}
