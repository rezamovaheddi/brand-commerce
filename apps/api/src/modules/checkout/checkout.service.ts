import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CheckoutRequest, Order } from '@bc/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { toCartContract } from '../carts/cart.mapper';
import { toOrderContract } from '../orders/order.mapper';

const ORDER_INCLUDE = { lines: true } as const;

/**
 * Guest checkout (P2). The cart is the single source of truth for WHAT is
 * bought; prices/totals are re-resolved SERVER-SIDE (via the cart contract,
 * which derives totals through @bc/domain) and snapshotted into immutable
 * OrderLines inside one transaction, together with converting the cart.
 * A checkout NEVER records a payment — payment states arrive with P3.
 */
@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(input: CheckoutRequest): Promise<Order> {
    const cartRow = await this.prisma.cart.findUnique({
      where: { id: input.cartId },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
      },
    });
    if (!cartRow) {
      throw new NotFoundException('سبد خرید یافت نشد');
    }
    if (cartRow.status !== 'ACTIVE') {
      throw new BadRequestException('این سبد خرید قابل تسویه نیست');
    }

    // Single source of truth: availability filter, mixed-currency guard and
    // server-side totals all come from the cart mapper + @bc/domain rules.
    const cart = toCartContract(cartRow);
    if (cart.items.length === 0) {
      throw new BadRequestException('سبد خرید خالی است');
    }

    let createdId: string;
    try {
      createdId = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            status: 'DRAFT',
            cartId: input.cartId,
            currency: cart.currency,
            itemCount: cart.itemCount,
            subtotalMinor: cart.subtotalMinor,
            fullName: input.address.fullName,
            phone: input.address.phone,
            province: input.address.province,
            city: input.address.city,
            postalCode: input.address.postalCode,
            addressLine: input.address.addressLine,
          },
        });
        await tx.orderLine.createMany({
          data: cart.items.map((item) => ({
            orderId: order.id,
            variantId: item.variantId,
            sku: item.sku,
            productNameFa: item.productNameFa,
            productNameEn: item.productNameEn,
            titleFa: item.titleFa,
            titleEn: item.titleEn,
            quantity: item.quantity,
            unitPriceMinor: item.unitPriceMinor,
            currency: item.currency,
            lineTotalMinor: item.lineTotalMinor,
          })),
        });
        await tx.cart.update({ where: { id: input.cartId }, data: { status: 'CONVERTED' } });
        return order.id;
      });
    } catch (error) {
      // cartId is @unique on Order — a second checkout of the same cart is a
      // client bug, answered with a clean Persian message instead of a 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('این سبد قبلاً به سفارش تبدیل شده است');
      }
      throw error;
    }

    const full = await this.prisma.order.findUnique({
      where: { id: createdId },
      include: ORDER_INCLUDE,
    });
    if (!full) {
      throw new Error('checkout: order vanished after transaction');
    }
    return toOrderContract(full);
  }
}
