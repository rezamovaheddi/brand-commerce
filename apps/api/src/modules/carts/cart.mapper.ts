import { BadRequestException } from '@nestjs/common';
import { Cart, CartItem, ProductStatus } from '@bc/contracts';
import { computeCartTotals } from '@bc/domain';

/** Cart status literals matching the Prisma CartStatus enum and CartSchema. */
export type CartStatusLiteral = 'ACTIVE' | 'CONVERTED' | 'ABANDONED';

/**
 * Structural row types kept independent of the generated Prisma client so the
 * mapper stays a pure, trivially unit-testable function (same approach as the
 * products module). Prisma rows (cart include items.variant.product) are
 * structurally assignable to these.
 */
export interface CartVariantRow {
  id: string;
  sku: string;
  titleFa: string;
  titleEn: string;
  /** Minor currency units (e.g. IRR rial). */
  priceMinor: number;
  currency: string;
  status: ProductStatus;
  /** Parent product's status and display names matter for availability + cart lines. */
  product: { status: ProductStatus; nameFa: string; nameEn: string } | null;
}

export interface CartItemRowWithVariant {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  variant: CartVariantRow | null;
}

export interface CartRowWithItems {
  id: string;
  status: CartStatusLiteral;
  items: readonly CartItemRowWithVariant[];
}

/** Default store currency for empty carts (Rial, per ProductVariant.currency default). */
const DEFAULT_CURRENCY = 'IRR';

/**
 * Availability rule: an item counts only when BOTH the variant and its parent
 * product are still ACTIVE. Rows that fail this check are SKIPPED at read time
 * (never deleted) — they stay persisted for audit/recovery.
 */
function isAvailable(
  item: CartItemRowWithVariant,
): item is CartItemRowWithVariant & {
  variant: CartVariantRow & { product: { status: ProductStatus; nameFa: string; nameEn: string } };
} {
  return (
    item.variant !== null &&
    item.variant.status === 'ACTIVE' &&
    item.variant.product !== null &&
    item.variant.product.status === 'ACTIVE'
  );
}

/**
 * Maps a Prisma cart row (with items and variant/product included) to the
 * shared Cart contract. Pure: no I/O, no Prisma types, deterministic output.
 *
 * Server-authoritative: unit prices come from the persisted variant rows and
 * every total is derived here via computeCartTotals — never in the controller
 * or on the client. Single-currency slice: items spanning multiple currencies
 * are rejected with `mixed_currency_not_supported`.
 */
export function toCartContract(row: CartRowWithItems): Cart {
  const available = row.items.filter(isAvailable);

  const currencies = available.map((item) => item.variant.currency);
  if (new Set(currencies).size > 1) {
    throw new BadRequestException('mixed_currency_not_supported');
  }
  const currency: string =
    available.length > 0 ? available[0].variant.currency : DEFAULT_CURRENCY;

  const items: CartItem[] = available.map((item) => ({
    variantId: item.variantId,
    sku: item.variant.sku,
    productNameFa: item.variant.product.nameFa,
    productNameEn: item.variant.product.nameEn,
    titleFa: item.variant.titleFa,
    titleEn: item.variant.titleEn,
    quantity: item.quantity,
    unitPriceMinor: item.variant.priceMinor,
    currency: item.variant.currency,
    lineTotalMinor: item.variant.priceMinor * item.quantity,
  }));

  const totals = computeCartTotals(
    available.map((item) => ({
      priceMinor: item.variant.priceMinor,
      quantity: item.quantity,
    })),
  );

  return {
    id: row.id,
    status: row.status,
    items,
    itemCount: totals.itemCount,
    lineCount: totals.lineCount,
    subtotalMinor: totals.subtotalMinor,
    currency,
  };
}
