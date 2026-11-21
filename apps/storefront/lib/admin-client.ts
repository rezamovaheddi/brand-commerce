import { z } from "zod";
import { ApiErrorSchema } from "@bc/contracts";

/**
 * Bootstrap admin console transport (browser only). The key lives in
 * sessionStorage per tab-session and is sent as `x-admin-key`. This is
 * bootstrap tooling — real RBAC lands in P4.
 */

export class AdminApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

const BASE = "/backend";
const KEY_STORAGE = "bc_admin_key";

export function getAdminKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage.getItem(KEY_STORAGE);
}

export function setAdminKey(key: string): void {
  window.sessionStorage.setItem(KEY_STORAGE, key);
}

export function clearAdminKey(): void {
  window.sessionStorage.removeItem(KEY_STORAGE);
}

async function request<T>(path: string, init: RequestInit, parse: (body: unknown) => T | null): Promise<T> {
  const key = getAdminKey() ?? "";
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", "x-admin-key": key, ...(init.headers ?? {}) },
    });
  } catch {
    throw new AdminApiError("سرویس ادمین در دسترس نیست.", 0);
  }
  const raw: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError = ApiErrorSchema.safeParse(raw);
    const message = apiError.success
      ? Array.isArray(apiError.data.message)
        ? apiError.data.message.join(" — ")
        : apiError.data.message
      : `خطای ادمین (HTTP ${response.status})`;
    throw new AdminApiError(message, response.status);
  }
  const parsed = parse(raw);
  if (parsed === null) {
    throw new AdminApiError("پاسخ ادمین نامعتبر بود.", response.status);
  }
  return parsed;
}

/* ---- schemas (admin responses) ---- */

const AdminOrderListItem = z.object({
  id: z.string(),
  status: z.string(),
  itemCount: z.number(),
  subtotalMinor: z.number(),
  currency: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  lineCount: z.number(),
  createdAt: z.string(),
});

const AdminOrderListResponse = z.object({
  items: z.array(AdminOrderListItem),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

const AdminInventoryItem = z.object({
  variantId: z.string(),
  sku: z.string(),
  productNameFa: z.string(),
  onHand: z.number(),
  reserved: z.number(),
  availableToSell: z.number(),
});

const LedgerEntry = z.object({
  id: z.string(),
  variantId: z.string(),
  deltaOnHand: z.number(),
  deltaReserved: z.number(),
  reason: z.string(),
  refType: z.string(),
  refId: z.string(),
  createdAt: z.string(),
});

export type AdminOrderList = z.infer<typeof AdminOrderListResponse>;
export type AdminInventory = z.infer<typeof AdminInventoryItem>;
export type LedgerRow = z.infer<typeof LedgerEntry>;

export async function adminListOrders(page: number, status?: string): Promise<AdminOrderList> {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) {
    params.set("status", status);
  }
  return request<AdminOrderList>(
    `/admin/orders?${params.toString()}`,
    { method: "GET" },
    (body) => {
      const parsed = AdminOrderListResponse.safeParse(body);
      return parsed.success ? parsed.data : null;
    },
  );
}

export async function adminListInventory(): Promise<AdminInventory[]> {
  return request<AdminInventory[]>(
    "/admin/inventory",
    { method: "GET" },
    (body) => {
      const parsed = z.object({ items: z.array(AdminInventoryItem) }).safeParse(body);
      return parsed.success ? parsed.data.items : null;
    },
  );
}

export async function adminAdjustStock(
  variantId: string,
  deltaOnHand: number,
  note: string,
): Promise<AdminInventory> {
  return request<AdminInventory>(
    `/admin/inventory/${variantId}/adjust`,
    { method: "POST", body: JSON.stringify({ deltaOnHand, note }) },
    (body) => AdminInventoryItem.safeParse(body).success ? (body as AdminInventory) : null,
  );
}

export async function adminListLedger(variantId?: string): Promise<LedgerRow[]> {
  const query = variantId ? `?variantId=${encodeURIComponent(variantId)}` : "";
  return request<LedgerRow[]>(
    `/admin/ledger${query}`,
    { method: "GET" },
    (body) => {
      const parsed = z.object({ items: z.array(LedgerEntry) }).safeParse(body);
      return parsed.success ? parsed.data.items : null;
    },
  );
}
