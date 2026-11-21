import {
  B2BApplicationSchema,
  CreateB2BApplicationSchema,
  CreateRfqSchema,
  RfqSchema,
  QuoteSchema,
  type B2BApplication,
  type CreateB2BApplication,
  type CreateRfq,
  type Rfq,
  type Quote,
  type IssueQuote,
} from "@bc/contracts";
import { z } from "zod";
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

/* ---- RFQ / Quote (P4 scaffold) -------------------------------------------- */

export async function submitRfq(input: CreateRfq): Promise<Rfq> {
  const check = CreateRfqSchema.safeParse(input);
  if (!check.success) {
    const first = check.error.issues[0];
    throw new CartApiError("parse", first ? first.message : "مقادیر نامعتبر است.");
  }
  return requestJson<Rfq>(
    `${BASE}/b2b/rfqs`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    (body) => RfqSchema.safeParse(body).success ? (body as Rfq) : null,
  );
}

export async function getRfq(id: string): Promise<Rfq> {
  return requestJson<Rfq>(
    `${BASE}/b2b/rfqs/${encodeURIComponent(id)}`,
    { method: "GET" },
    (body) => RfqSchema.safeParse(body).success ? (body as Rfq) : null,
  );
}

export async function acceptQuote(quoteId: string, address: Record<string, string>): Promise<{ order: { id: string; status: string }; quote: Quote }> {
  return requestJson<{ order: { id: string; status: string }; quote: Quote }>(
    `${BASE}/b2b/quotes/${encodeURIComponent(quoteId)}/accept`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(address) },
    (body) => {
      const obj = body as { order?: { id: string; status: string }; quote?: unknown } | null;
      if (!obj?.order || typeof obj.order.status !== "string") {
        return null;
      }
      const quote = QuoteSchema.safeParse(obj.quote);
      return quote.success ? { order: obj.order, quote: quote.data } : null;
    },
  );
}

/* ---- admin: RFQ list + quote issuance ---- */

const AdminRfqItem = z.object({
  id: z.string(),
  variantId: z.string().nullable(),
  productName: z.string(),
  quantity: z.number(),
  note: z.string().nullable(),
});

const AdminRfq = z.object({
  id: z.string(),
  status: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  note: z.string().nullable(),
  items: z.array(AdminRfqItem),
  quote: z
    .object({
      id: z.string(),
      status: z.string(),
      validUntil: z.string(),
      revisions: z.array(
        z.object({
          id: z.string(),
          revisionNo: z.number(),
          subtotalMinor: z.number(),
          isSample: z.boolean(),
          note: z.string().nullable(),
        }),
      ),
    })
    .nullable(),
});

export type AdminRfqRow = z.infer<typeof AdminRfq>;

export async function adminListRfqs(key: string, status?: string): Promise<AdminRfqRow[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return requestJson<AdminRfqRow[]>(
    `${BASE}/admin/b2b/rfqs${query}`,
    { method: "GET", headers: { "x-admin-key": key } },
    (body) => {
      const parsed = z.object({ items: z.array(AdminRfq) }).safeParse(body);
      return parsed.success ? parsed.data.items : null;
    },
  );
}

export async function adminIssueQuote(
  key: string,
  rfqId: string,
  input: IssueQuote,
): Promise<Quote> {
  return requestJson<Quote>(
    `${BASE}/admin/b2b/rfqs/${rfqId}/quote`,
    { method: "POST", headers: adminJsonHeaders(key), body: JSON.stringify(input) },
    (body) => QuoteSchema.safeParse(body).success ? (body as Quote) : null,
  );
}

export async function adminAddQuoteRevision(
  key: string,
  quoteId: string,
  input: IssueQuote,
): Promise<Quote> {
  return requestJson<Quote>(
    `${BASE}/admin/b2b/quotes/${quoteId}/revisions`,
    { method: "POST", headers: adminJsonHeaders(key), body: JSON.stringify(input) },
    (body) => QuoteSchema.safeParse(body).success ? (body as Quote) : null,
  );
}

function adminJsonHeaders(key: string): HeadersInit {
  return { "Content-Type": "application/json", "x-admin-key": key };
}
