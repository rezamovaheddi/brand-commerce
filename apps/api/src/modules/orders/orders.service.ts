import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Order, OrderStatus } from '@bc/contracts';
import { assertOrderTransition } from '@bc/domain';
import { PrismaService } from '../../prisma/prisma.service';
import { toOrderContract } from './order.mapper';

const ORDER_INCLUDE = { lines: true } as const;

/**
 * Read/cancel model for guest order drafts. Order lines are immutable
 * snapshots — this service never recomputes prices. Status changes go through
 * the pure state machine in @bc/domain.
 */
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async get(id: string): Promise<Order> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!row) {
      throw new NotFoundException('سفارش یافت نشد');
    }
    return toOrderContract(row);
  }

  /** Cancels a DRAFT order; any other transition is rejected by the domain rule. */
  async cancel(id: string): Promise<Order> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!row) {
      throw new NotFoundException('سفارش یافت نشد');
    }
    try {
      assertOrderTransition(row.status, 'CANCELLED');
    } catch {
      throw new BadRequestException('این وضعیت سفارش قابل لغو نیست');
    }
    await this.prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });
    const updated = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!updated) {
      throw new NotFoundException('سفارش یافت نشد');
    }
    return toOrderContract(updated);
  }

  /**
   * Domain-guarded status transition used by sibling modules (payments). The
   * pure machine in @bc/domain is the single authority on legal moves.
   */
  async transition(id: string, to: OrderStatus): Promise<Order> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!row) {
      throw new NotFoundException('سفارش یافت نشد');
    }
    try {
      assertOrderTransition(row.status, to);
    } catch {
      throw new BadRequestException('این تغییر وضعیت سفارش مجاز نیست');
    }
    await this.prisma.order.update({ where: { id }, data: { status: to } });
    const updated = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!updated) {
      throw new NotFoundException('سفارش یافت نشد');
    }
    return toOrderContract(updated);
  }
}
