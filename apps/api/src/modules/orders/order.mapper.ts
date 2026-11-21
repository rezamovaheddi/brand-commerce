import { Order } from '@bc/contracts';

/** Order status literals matching the Prisma OrderStatus enum and OrderStatusSchema. */
export type OrderStatusLiteral =
  | 'DRAFT'
  | 'CANCELLED'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'REFUNDED';

/**
 * Structural row types kept independent of the generated Prisma client so the
 * mapper stays a pure, trivially unit-testable function (same approach as the
 * carts module). Prisma rows (order include lines) are structurally assignable
 * to these.
 */
export interface OrderLineRow {
  variantId: string;
  sku: string;
  productNameFa: string;
  productNameEn: string;
  titleFa: string;
  titleEn: string;
  quantity: number;
  /** Server-resolved unit price in minor units, snapshotted at checkout time. */
  unitPriceMinor: number;
  currency: string;
  lineTotalMinor: number;
}

export interface OrderRowWithLines {
  id: string;
  status: OrderStatusLiteral;
  currency: string;
  itemCount: number;
  subtotalMinor: number;
  /** Shipping address snapshot columns, flattened on the Order table. */
  fullName: string;
  phone: string;
  province: string;
  city: string;
  postalCode: string;
  addressLine: string;
  /** Prisma DateTime — mapped to an ISO string on the contract. */
  createdAt: Date;
  lines: readonly OrderLineRow[];
}

/**
 * Maps a Prisma order row (with its immutable line snapshots) to the shared
 * Order contract. Pure: no I/O, no Prisma types, deterministic output. The
 * nested address object is rebuilt from the flattened snapshot columns.
 */
export function toOrderContract(row: OrderRowWithLines): Order {
  return {
    id: row.id,
    status: row.status,
    currency: row.currency,
    itemCount: row.itemCount,
    subtotalMinor: row.subtotalMinor,
    address: {
      fullName: row.fullName,
      phone: row.phone,
      province: row.province,
      city: row.city,
      postalCode: row.postalCode,
      addressLine: row.addressLine,
    },
    lines: row.lines.map((line) => ({ ...line })),
    createdAt: row.createdAt.toISOString(),
  };
}
