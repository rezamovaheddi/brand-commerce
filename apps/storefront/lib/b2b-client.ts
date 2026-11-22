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
  itemKind: z.string().optional(),
  specNote: z.string().nullable().optional(),
});

const AdminRfq = z.object({
  id: z.string(),
  status: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  note: z.string().nullable(),
  targetMarket: z.string().nullable().optional(),
  packaging: z.string().nullable().optional(),
  requestedDeliveryDate: z.string().nullable().optional(),
  confidentiality: z.boolean().optional(),
  items: z.array(AdminRfqItem),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        filename: z.string(),
        sizeBytes: z.number(),
      }),
    )
    .optional(),
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

/* ---- org portal (N16: x-org-key access) ------------------------------------ */

const ORG_KEY_STORAGE = "dv-org-key";

export function getOrgKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage.getItem(ORG_KEY_STORAGE);
}

export function setOrgKey(key: string): void {
  window.sessionStorage.setItem(ORG_KEY_STORAGE, key.trim());
}

export function clearOrgKey(): void {
  window.sessionStorage.removeItem(ORG_KEY_STORAGE);
}

const OrgMe = z.object({
  organizationId: z.string(),
  organizationName: z.string(),
  isSample: z.boolean(),
  memberName: z.string(),
  role: z.string(),
});
export type OrgMe = z.infer<typeof OrgMe>;

function orgHeaders(key: string, json: boolean = false): HeadersInit {
  return json
    ? { "Content-Type": "application/json", "x-org-key": key }
    : { "x-org-key": key };
}

/** Who the org key belongs to. 401/403 → key entry / honest error. */
export async function orgMe(key: string): Promise<OrgMe> {
  return requestJson<OrgMe>(
    `${BASE}/b2b/org/me`,
    { method: "GET", headers: orgHeaders(key) },
    (body) => (OrgMe.safeParse(body).success ? (body as OrgMe) : null),
  );
}

/** Org-scoped RFQ submit (role OWNER/BUYER; ACCOUNTANT → 403 from the API). */
export async function orgSubmitRfq(key: string, input: CreateRfq): Promise<Rfq> {
  const check = CreateRfqSchema.safeParse(input);
  if (!check.success) {
    const first = check.error.issues[0];
    throw new CartApiError("parse", first ? first.message : "مقادیر نامعتبر است.");
  }
  return requestJson<Rfq>(
    `${BASE}/b2b/org/rfqs`,
    { method: "POST", headers: orgHeaders(key, true), body: JSON.stringify(input) },
    (body) => (RfqSchema.safeParse(body).success ? (body as Rfq) : null),
  );
}

export async function orgListRfqs(key: string): Promise<Rfq[]> {
  return requestJson<Rfq[]>(
    `${BASE}/b2b/org/rfqs`,
    { method: "GET", headers: orgHeaders(key) },
    (body) => {
      const parsed = z.object({ items: z.array(RfqSchema) }).safeParse(body);
      return parsed.success ? parsed.data.items : null;
    },
  );
}

export async function orgAcceptQuote(
  key: string,
  quoteId: string,
  address: Record<string, string>,
): Promise<{ order: { id: string; status: string }; quote: Quote }> {
  return requestJson<{ order: { id: string; status: string }; quote: Quote }>(
    `${BASE}/b2b/org/quotes/${encodeURIComponent(quoteId)}/accept`,
    { method: "POST", headers: orgHeaders(key, true), body: JSON.stringify(address) },
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

/* ---- RFQ attachments (B3-lite) ---------------------------------------------- */

const RfqAttachmentMeta = z.object({
  id: z.string(),
  rfqId: z.string(),
  filename: z.string(),
  mime: z.string(),
  sizeBytes: z.number(),
  sha256: z.string(),
  createdAt: z.string(),
});
export type RfqAttachmentMeta = z.infer<typeof RfqAttachmentMeta>;

export interface AttachmentFile {
  filename: string;
  mime: string;
  contentBase64: string;
}

const ALLOWED_MIMES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_ATTACHMENT_BYTES = 512 * 1024;

/** Client-side pre-check (mirrors the domain policy) before base64 encoding. */
export function validateAttachmentFile(file: File): string | null {
  if (!ALLOWED_MIMES.includes(file.type)) {
    return "فقط PDF، PNG یا JPEG پذیرفته می‌شود.";
  }
  if (file.size < 1 || file.size > MAX_ATTACHMENT_BYTES) {
    return "حجم فایل باید حداکثر ۵۱۲ کیلوبایت باشد.";
  }
  return null;
}

/** Reads a File into an attachment payload (base64 without the data: prefix). */
export function fileToAttachmentPayload(file: File): Promise<AttachmentFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new CartApiError("parse", "خواندن فایل ناموفق بود."));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve({
        filename: file.name,
        mime: file.type,
        contentBase64: comma >= 0 ? result.slice(comma + 1) : result,
      });
    };
    reader.readAsDataURL(file);
  });
}

/** Public upload (access by RFQ id — same trust level as RFQ tracking). */
export async function uploadRfqAttachment(
  rfqId: string,
  attachment: AttachmentFile,
): Promise<RfqAttachmentMeta> {
  return requestJson<RfqAttachmentMeta>(
    `${BASE}/b2b/rfqs/${encodeURIComponent(rfqId)}/attachments`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(attachment) },
    (body) => (RfqAttachmentMeta.safeParse(body).success ? (body as RfqAttachmentMeta) : null),
  );
}

/** Public download URL (plain link — works because RFQ tracking is public by id). */
export function rfqAttachmentDownloadUrl(rfqId: string, attachmentId: string): string {
  return `${BASE}/b2b/rfqs/${encodeURIComponent(rfqId)}/attachments/${encodeURIComponent(attachmentId)}`;
}

/** B3: upload a license/permit document to a distributor application. */
export async function uploadApplicationAttachment(
  applicationId: string,
  attachment: AttachmentFile,
): Promise<RfqAttachmentMeta> {
  return requestJson<RfqAttachmentMeta>(
    `${BASE}/b2b/applications/${encodeURIComponent(applicationId)}/attachments`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(attachment) },
    (body) => (RfqAttachmentMeta.safeParse(body).success ? (body as RfqAttachmentMeta) : null),
  );
}

export function applicationAttachmentDownloadUrl(
  applicationId: string,
  attachmentId: string,
): string {
  return `${BASE}/b2b/applications/${encodeURIComponent(applicationId)}/attachments/${encodeURIComponent(attachmentId)}`;
}

/** Org-scoped upload (x-org-key). */
export async function orgUploadAttachment(
  key: string,
  rfqId: string,
  attachment: AttachmentFile,
): Promise<RfqAttachmentMeta> {
  return requestJson<RfqAttachmentMeta>(
    `${BASE}/b2b/org/rfqs/${encodeURIComponent(rfqId)}/attachments`,
    { method: "POST", headers: orgHeaders(key, true), body: JSON.stringify(attachment) },
    (body) => (RfqAttachmentMeta.safeParse(body).success ? (body as RfqAttachmentMeta) : null),
  );
}

/** Org-scoped download — key header required, so fetch→blob→browser download. */
export async function orgDownloadAttachment(
  key: string,
  rfqId: string,
  attachmentId: string,
  filename: string,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `${BASE}/b2b/org/rfqs/${encodeURIComponent(rfqId)}/attachments/${encodeURIComponent(attachmentId)}`,
      { method: "GET", headers: orgHeaders(key) },
    );
  } catch {
    throw new CartApiError("network", "سرویس در دسترس نیست.");
  }
  if (!response.ok) {
    const raw: unknown = await response.json().catch(() => null);
    throw new CartApiError("http", extractApiMessage(raw), response.status);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

/* ---- admin: organization member/key management (N16) ------------------------ */

const AdminOrg = z.object({
  id: z.string(),
  name: z.string(),
  isSample: z.boolean(),
  status: z.string(),
  memberCount: z.number(),
  createdAt: z.string(),
});
export type AdminOrgRow = z.infer<typeof AdminOrg>;

const AdminMember = z.object({
  id: z.string(),
  organizationId: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  email: z.string(),
  role: z.string(),
  hasKey: z.boolean(),
  keyLast4: z.string().nullable(),
  keyRevokedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type AdminMemberRow = z.infer<typeof AdminMember>;

export async function adminListOrgs(key: string): Promise<AdminOrgRow[]> {
  return requestJson<AdminOrgRow[]>(
    `${BASE}/admin/b2b/orgs`,
    { method: "GET", headers: { "x-admin-key": key } },
    (body) => {
      const parsed = z.object({ items: z.array(AdminOrg) }).safeParse(body);
      return parsed.success ? parsed.data.items : null;
    },
  );
}

export async function adminListOrgMembers(key: string, orgId: string): Promise<AdminMemberRow[]> {
  return requestJson<AdminMemberRow[]>(
    `${BASE}/admin/b2b/orgs/${encodeURIComponent(orgId)}/members`,
    { method: "GET", headers: { "x-admin-key": key } },
    (body) => {
      const parsed = z.object({ items: z.array(AdminMember) }).safeParse(body);
      return parsed.success ? parsed.data.items : null;
    },
  );
}

export async function adminCreateOrgMember(
  key: string,
  orgId: string,
  input: { contactName: string; contactPhone: string; email: string; role: string },
): Promise<AdminMemberRow & { accessKey: string }> {
  return requestJson<AdminMemberRow & { accessKey: string }>(
    `${BASE}/admin/b2b/orgs/${encodeURIComponent(orgId)}/members`,
    { method: "POST", headers: adminJsonHeaders(key), body: JSON.stringify(input) },
    (body) => {
      const parsed = AdminMember.extend({ accessKey: z.string() }).safeParse(body);
      return parsed.success ? parsed.data : null;
    },
  );
}

export async function adminIssueMemberKey(
  key: string,
  memberId: string,
): Promise<AdminMemberRow & { accessKey: string }> {
  return requestJson<AdminMemberRow & { accessKey: string }>(
    `${BASE}/admin/b2b/members/${encodeURIComponent(memberId)}/key`,
    { method: "POST", headers: { "x-admin-key": key } },
    (body) => {
      const parsed = AdminMember.extend({ accessKey: z.string() }).safeParse(body);
      return parsed.success ? parsed.data : null;
    },
  );
}

export async function adminRevokeMemberKey(key: string, memberId: string): Promise<AdminMemberRow> {
  return requestJson<AdminMemberRow>(
    `${BASE}/admin/b2b/members/${encodeURIComponent(memberId)}/revoke`,
    { method: "POST", headers: { "x-admin-key": key } },
    (body) => (AdminMember.safeParse(body).success ? (body as AdminMemberRow) : null),
  );
}
