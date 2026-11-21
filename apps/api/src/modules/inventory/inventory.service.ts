import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface InventoryLine {
  variantId: string;
  quantity: number;
}

type Tx = Prisma.TransactionClient;

/**
 * Inventory-lite (P5 gate). All mutations are guarded, atomic column updates
 * (raw SQL so the availability predicate `onHand - reserved >= qty` is checked
 * in the same statement) and every mutation appends an InventoryLedger row.
 *
 * reserveInTx runs INSIDE the checkout transaction; release/convert/restock
 * open their own short transactions (called from order cancel, payment
 * success and sandbox refund).
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Atomically reserves stock inside the caller's transaction. */
  async reserveInTx(tx: Tx, orderId: string, lines: InventoryLine[]): Promise<void> {
    for (const line of lines) {
      const updated = await tx.$executeRaw`
        UPDATE "InventoryItem"
        SET "reserved" = "reserved" + ${line.quantity}
        WHERE "variantId" = ${line.variantId}
          AND "onHand" - "reserved" >= ${line.quantity}`;
      if (updated === 0) {
        throw new ConflictException('موجودی کافی نیست');
      }
      await tx.inventoryLedger.create({
        data: {
          variantId: line.variantId,
          deltaOnHand: 0,
          deltaReserved: line.quantity,
          reason: 'RESERVE',
          refType: 'order',
          refId: orderId,
        },
      });
    }
  }

  /** Cancelling an unpaid order releases its reservation back to available. */
  async releaseForOrder(orderId: string): Promise<void> {
    const lines = await this.prisma.orderLine.findMany({ where: { orderId } });
    await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const updated = await tx.$executeRaw`
          UPDATE "InventoryItem"
          SET "reserved" = "reserved" - ${line.quantity}
          WHERE "variantId" = ${line.variantId}
            AND "reserved" >= ${line.quantity}`;
        if (updated === 0) {
          // Already released (idempotent replay) — nothing to do.
          continue;
        }
        await tx.inventoryLedger.create({
          data: {
            variantId: line.variantId,
            deltaOnHand: 0,
            deltaReserved: -line.quantity,
            reason: 'RELEASE',
            refType: 'order',
            refId: orderId,
          },
        });
      }
    });
  }

  /** Payment success converts the reservation into a real stock deduction. */
  async convertToSale(orderId: string): Promise<void> {
    const lines = await this.prisma.orderLine.findMany({ where: { orderId } });
    await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const updated = await tx.$executeRaw`
          UPDATE "InventoryItem"
          SET "onHand" = "onHand" - ${line.quantity}, "reserved" = "reserved" - ${line.quantity}
          WHERE "variantId" = ${line.variantId}
            AND "reserved" >= ${line.quantity}`;
        if (updated === 0) {
          throw new ConflictException('وضعیت موجودی این سفارش ناسازگار است');
        }
        await tx.inventoryLedger.create({
          data: {
            variantId: line.variantId,
            deltaOnHand: -line.quantity,
            deltaReserved: -line.quantity,
            reason: 'SALE',
            refType: 'order',
            refId: orderId,
          },
        });
      }
    });
  }

  /** Sandbox refund restocks the goods (real RMA flow arrives with P5). */
  async restockForOrder(orderId: string): Promise<void> {
    const lines = await this.prisma.orderLine.findMany({ where: { orderId } });
    await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        await tx.$executeRaw`
          UPDATE "InventoryItem"
          SET "onHand" = "onHand" + ${line.quantity}
          WHERE "variantId" = ${line.variantId}`;
        await tx.inventoryLedger.create({
          data: {
            variantId: line.variantId,
            deltaOnHand: line.quantity,
            deltaReserved: 0,
            reason: 'RESTOCK',
            refType: 'order',
            refId: orderId,
          },
        });
      }
    });
  }
}
