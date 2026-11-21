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
