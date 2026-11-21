import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AdminInventoryItem,
  AdminLedgerResponse,
  AdminOrderListResponse,
  AdjustStock,
  B2BApplication,
} from '@bc/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { B2bService } from '../b2b/b2b.service';

const ORDER_INCLUDE = { lines: true } as const;

/**
 * Operator console queries (bootstrap backoffice). Read-heavy; the single
 * write is a guarded, ledgered stock ADJUSTMENT.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly b2bService: B2bService,
  ) {}

  async listOrders(
    page: number,
    limit: number,
    status?: string,
  ): Promise<AdminOrderListResponse> {
    const where: Prisma.OrderWhereInput = status ? { status: status as Prisma.EnumOrderStatusFilter['equals'] } : {};
    const rows = await this.prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await this.prisma.order.count({ where });
    return {
      items: rows.map((row) => ({
        id: row.id,
        status: row.status,
        itemCount: row.itemCount,
        subtotalMinor: row.subtotalMinor,
        currency: row.currency,
        customerName: row.fullName,
        customerPhone: row.phone,
        lineCount: row.lines.length,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listInventory(): Promise<AdminInventoryItem[]> {
    const rows = await this.prisma.inventoryItem.findMany({
      include: {
        variant: { include: { product: { select: { nameFa: true } } } },
      },
      orderBy: { variantId: 'asc' },
    });
    return rows.map((row) => ({
      variantId: row.variantId,
      sku: row.variant?.sku ?? '',
      productNameFa: row.variant?.product?.nameFa ?? '',
      onHand: row.onHand,
      reserved: row.reserved,
      availableToSell: Math.max(0, row.onHand - row.reserved),
    }));
  }

  /** Guarded, ledgered stock adjustment (operator correction). */
  async adjustStock(variantId: string, input: AdjustStock): Promise<AdminInventoryItem> {
    const inventory = await this.prisma.inventoryItem.findUnique({
      where: { variantId },
    });
    if (!inventory) {
      throw new NotFoundException('این واریانت موجودی ثبت‌شده ندارد');
    }
    if (inventory.onHand + input.deltaOnHand < 0) {
      throw new BadRequestException('موجودی نهایی نمی‌تواند منفی شود');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { variantId },
        data: { onHand: { increment: input.deltaOnHand } },
      });
      await tx.inventoryLedger.create({
        data: {
          variantId,
          deltaOnHand: input.deltaOnHand,
          deltaReserved: 0,
          reason: 'ADJUSTMENT',
          refType: 'admin',
          refId: input.note,
        },
      });
    });
    const updated = await this.prisma.inventoryItem.findUniqueOrThrow({
      where: { variantId },
      include: { variant: { include: { product: { select: { nameFa: true } } } } },
    });
    return {
      variantId,
      sku: updated.variant?.sku ?? '',
      productNameFa: updated.variant?.product?.nameFa ?? '',
      onHand: updated.onHand,
      reserved: updated.reserved,
      availableToSell: Math.max(0, updated.onHand - updated.reserved),
    };
  }

  async listLedger(variantId?: string): Promise<AdminLedgerResponse> {
    const rows = await this.prisma.inventoryLedger.findMany({
      where: variantId ? { variantId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        variantId: row.variantId,
        deltaOnHand: row.deltaOnHand,
        deltaReserved: row.deltaReserved,
        reason: row.reason,
        refType: row.refType,
        refId: row.refId,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  // ---- B2B application review ---------------------------------------------

  async listB2BApplications(status?: string): Promise<{ items: B2BApplication[] }> {
    return this.b2bService.list(status);
  }

  async approveB2B(id: string, note: string): Promise<B2BApplication> {
    return this.b2bService.approve(id, note);
  }

  async rejectB2B(id: string, note: string): Promise<B2BApplication> {
    return this.b2bService.reject(id, note);
  }

  async requestInfoB2B(id: string, note: string): Promise<B2BApplication> {
    return this.b2bService.requestInfo(id, note);
  }
}
