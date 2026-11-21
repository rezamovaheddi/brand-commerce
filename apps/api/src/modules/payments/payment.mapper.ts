import { Payment } from '@bc/contracts';

/** Structural row (Prisma-free) for pure mapping — Payment rows are assignable. */
export interface PaymentRow {
  id: string;
  orderId: string;
  amountMinor: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  provider: string;
  isSandbox: boolean;
  createdAt: Date;
}

/**
 * Maps a Prisma payment row to the shared Payment contract. In this slice
 * isSandbox is LITERAL true — a sandbox=false row here means someone wrote
 * real-gateway data through the sandbox module, which must fail loudly.
 */
export function toPaymentContract(row: PaymentRow): Payment {
  if (!row.isSandbox) {
    throw new Error('payment mapper: non-sandbox payment reached the sandbox module');
  }
  return {
    id: row.id,
    orderId: row.orderId,
    amountMinor: row.amountMinor,
    currency: row.currency,
    status: row.status,
    provider: row.provider,
    isSandbox: true,
    createdAt: row.createdAt.toISOString(),
  };
}
