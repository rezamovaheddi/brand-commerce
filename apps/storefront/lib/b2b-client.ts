import {
  B2BApplicationSchema,
  CreateB2BApplicationSchema,
  type B2BApplication,
  type CreateB2BApplication,
} from "@bc/contracts";
import { CartApiError } from "./cart-client";

/**
 * B2B onboarding transport (public apply + keyed admin review). Same unified
 * error design as cart/order/payment clients.
 */

export { CartApiError };

const BASE = "/backend";

async function requestJson<T>(
  url: string,
  init: RequestInit,
  parse: (body: unknown) => T | null,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new CartApiError("network", "سرویس در دسترس نیست.");
  }
  const raw: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new CartApiError("http", extractApiMessage(raw), response.status);
  }
  const parsed = parse(raw);
  if (parsed === null) {
    throw new CartApiError("parse", "پاسخ نامعتبر بود.", response.status);
  }
  return parsed;
}

/** Extracts the API's Persian message from the ApiError wire shape. */
function extractApiMessage(raw: unknown): string {
  const obj = raw as { message?: string | string[] } | null;
  if (obj?.message) {
    return Array.isArray(obj.message) ? obj.message.join(" — ") : obj.message;
  }
  return "خطای پردازش درخواست رخ داد.";
}

/** Public: submit a distributor application (B3-lite). */
export async function submitB2BApplication(
  input: CreateB2BApplication,
): Promise<B2BApplication> {
  // Client-side validation with the shared contract (Persian digits normalize).
  const check = CreateB2BApplicationSchema.safeParse(input);
  if (!check.success) {
    const first = check.error.issues[0];
    throw new CartApiError("parse", first ? first.message : "مقادیر نامعتبر است.");
  }
  return requestJson<B2BApplication>(
    `${BASE}/b2b/applications`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    (body) => B2BApplicationSchema.safeParse(body).success ? (body as B2BApplication) : null,
  );
}

/** Public: track application status by id. */
export async function getB2BApplication(id: string): Promise<B2BApplication> {
  return requestJson<B2BApplication>(
    `${BASE}/b2b/applications/${encodeURIComponent(id)}`,
    { method: "GET" },
    (body) => B2BApplicationSchema.safeParse(body).success ? (body as B2BApplication) : null,
  );
}
