/**
 * Pure domain rules for commerce (no I/O, no framework).
 * Financial integrity starts here: integer minor units only, no floats.
 */

/** Hard quantity bounds for a single cart line (aligned with V6 clamp 1..99). */
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;

export type QuantityCheck = "ok" | "too_low" | "too_high";

export function checkQuantity(quantity: number): QuantityCheck {
  if (!Number.isInteger(quantity) || quantity < MIN_QUANTITY) return "too_low";
  if (quantity > MAX_QUANTITY) return "too_high";
  return "ok";
}

/** Merge rule: adding an existing line clamps the result into [MIN, MAX]. */
export function mergeQuantity(existing: number, incoming: number): number {
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, existing + incoming));
}

export interface CartLineInput {
  /** Price in minor units, resolved SERVER-SIDE from ProductVariant. */
  priceMinor: number;
  quantity: number;
}

export interface CartTotals {
  /** Sum of priceMinor * quantity across lines, in minor units. */
  subtotalMinor: number;
  /** Sum of quantities across lines. */
  itemCount: number;
  /** Distinct lines. */
  lineCount: number;
}

/**
 * Compute cart totals from server-resolved lines.
 * Throws on negative prices or out-of-range quantities — a malformed line is a
 * programming error, not a display concern.
 */
export function computeCartTotals(lines: CartLineInput[]): CartTotals {
  let subtotalMinor = 0;
  let itemCount = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.priceMinor) || line.priceMinor < 0) {
      throw new Error(`invalid priceMinor: ${String(line.priceMinor)}`);
    }
    const q = checkQuantity(line.quantity);
    if (q !== "ok") {
      throw new Error(`invalid quantity: ${String(line.quantity)}`);
    }
    subtotalMinor += line.priceMinor * line.quantity;
    itemCount += line.quantity;
  }
  return { subtotalMinor, itemCount, lineCount: lines.length };
}

/**
 * Currency-aware display unit resolution. Rial/Toman conversion is a PENDING
 * business decision (CUR-01) — callers must not silently convert.
 */
export function displayUnit(currency: string): string {
  return currency === "IRR" ? "IRR" : currency;
}

/**
 * Order state machine (P2 scope: DRAFT ⇄ CANCELLED). P3 payment/shipping
 * states extend the map — transitions unknown to this map are always invalid.
 */
export const ORDER_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  DRAFT: ["CANCELLED", "AWAITING_PAYMENT"],
  CANCELLED: [],
  AWAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "REFUNDED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  REFUNDED: [],
} as const;

export type OrderTransition = "ok" | "invalid";

export function canTransitionOrder(from: string, to: string): OrderTransition {
  return ORDER_TRANSITIONS[from]?.includes(to) ? "ok" : "invalid";
}

export function assertOrderTransition(from: string, to: string): void {
  if (canTransitionOrder(from, to) !== "ok") {
    throw new Error(`invalid order transition: ${from} -> ${to}`);
  }
}

// ---- Organization roles (N16) ----------------------------------------------
// Real credentials land with the Identity context (P7); these rules are pure
// so the API layer, admin console and tests share one source of truth.

export type OrgMemberRole = "OWNER" | "BUYER" | "ACCOUNTANT";

/** Purchasing roles may raise/accept org RFQs; a finance-only role may not. */
export function canActAsOrgBuyer(role: OrgMemberRole): boolean {
  return role === "OWNER" || role === "BUYER";
}

/** Any active member may read their own organization's data. */
export function canReadOrgData(role: OrgMemberRole): boolean {
  return role === "OWNER" || role === "BUYER" || role === "ACCOUNTANT";
}

// ---- RFQ attachments (B3) ---------------------------------------------------
// Policy lives here so the API layer and tests share one source of truth.
// MVP-lite storage: bytes in the database, hard-capped — object storage
// (S3/COS) replaces this when the deployment slice lands.

export const RFQ_ATTACHMENT_MAX_BYTES = 512 * 1024;
export const RFQ_ATTACHMENT_MAX_COUNT = 3;
export const RFQ_ATTACHMENT_ALLOWED_MIMES = ["application/pdf", "image/png", "image/jpeg"] as const;
export const RFQ_ATTACHMENT_MAX_FILENAME = 120;

export type RfqAttachmentCheck = "ok" | "too_large" | "bad_mime" | "bad_filename";

/** Byte budget + MIME whitelist for one attachment upload. */
export function checkRfqAttachment(mime: string, sizeBytes: number): RfqAttachmentCheck {
  if (!RFQ_ATTACHMENT_ALLOWED_MIMES.includes(mime as (typeof RFQ_ATTACHMENT_ALLOWED_MIMES)[number])) {
    return "bad_mime";
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > RFQ_ATTACHMENT_MAX_BYTES) {
    return "too_large";
  }
  return "ok";
}

/**
 * Filenames are display labels only (stored as-is, never used as paths):
 * reject path separators and control characters to keep them inert.
 */
export function checkRfqAttachmentFilename(filename: string): RfqAttachmentCheck {
  if (filename.length < 1 || filename.length > RFQ_ATTACHMENT_MAX_FILENAME) {
    return "bad_filename";
  }
  // eslint-disable-next-line no-control-regex
  if (/[/\\:\0]/.test(filename) || /[\x00-\x1f]/.test(filename)) {
    return "bad_filename";
  }
  return "ok";
}

// ---- Support tickets (TASK-099 CRM-lite) -------------------------------------

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";

/**
 * Ticket lifecycle. RESOLVED can be reopened (customer disagrees) until the
 * ticket is CLOSED; CLOSED is terminal — a follow-up question is a new ticket.
 */
export const TICKET_TRANSITIONS: Readonly<Record<string, readonly TicketStatus[]>> = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["WAITING_CUSTOMER", "RESOLVED", "CLOSED"],
  WAITING_CUSTOMER: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: [],
} as const;

export function canTransitionTicket(from: string, to: string): boolean {
  return TICKET_TRANSITIONS[from]?.includes(to as TicketStatus) ?? false;
}

export function assertTicketTransition(from: string, to: string): void {
  if (!canTransitionTicket(from, to)) {
    throw new Error(`invalid ticket transition: ${from} -> ${to}`);
  }
}

/** Customers may reply to any non-CLOSED ticket. */
export function canReplyToTicket(status: string): boolean {
  return status !== "CLOSED";
}

export * from "./feature-flags";
export * from "./loyalty";

