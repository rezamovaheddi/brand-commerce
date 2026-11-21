import { Injectable, NotFoundException } from '@nestjs/common';
import { AddCartItem, Cart, UpdateCartItem } from '@bc/contracts';
import { mergeQuantity } from '@bc/domain';
import { PrismaService } from '../../prisma/prisma.service';
import { toCartContract } from './cart.mapper';

/**
 * Write model for guest carts. Server-authoritative: variant availability and
 * prices are always resolved from the database; totals are computed in the
 * mapper via computeCartTotals. Every returned Cart goes through toCartContract.
 */
@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates a new empty ACTIVE cart. */
  async create(): Promise<Cart> {
    const row = await this.prisma.cart.create({
      data: {},
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { status: true, nameFa: true, nameEn: true } } },
            },
          },
        },
      },
    });
    return toCartContract(row);
  }

  /** Fetches a cart with server-computed totals. */
  async get(id: string): Promise<Cart> {
    const row = await this.prisma.cart.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { status: true, nameFa: true, nameEn: true } } },
            },
          },
        },
      },
    });
    if (!row) {
      throw new NotFoundException('سبد خرید یافت نشد');
    }
    return toCartContract(row);
  }

  /**
   * Adds a variant to the cart. The variant is resolved SERVER-SIDE: unknown,
   * non-ACTIVE variants (and variants of non-ACTIVE products) are rejected.
   * Adding an existing line merges quantities via the domain merge rule.
   */
  async addItem(cartId: string, input: AddCartItem): Promise<Cart> {
    await this.assertCartExists(cartId);

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: input.variantId },
      include: { product: true },
    });
    if (!variant || variant.status !== 'ACTIVE' || variant.product.status !== 'ACTIVE') {
      throw new NotFoundException('این محصول برای فروش در دسترس نیست');
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId: input.variantId } },
    });
    // NOTE: the read-modify-write merge below is NON-ATOMIC — two concurrent
    // adds for the same (cartId, variantId) can interleave between findUnique
    // and upsert and lose an increment. Hardening (SELECT ... FOR UPDATE inside
    // an interactive transaction) is a P3 task.
    const quantity = existing ? mergeQuantity(existing.quantity, input.quantity) : input.quantity;
    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId, variantId: input.variantId } },
      create: { cartId, variantId: input.variantId, quantity },
      update: { quantity },
    });

    return this.get(cartId);
  }

  /** Replaces the quantity of an existing cart line. */
  async updateItem(cartId: string, variantId: string, input: UpdateCartItem): Promise<Cart> {
    await this.assertCartExists(cartId);

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId } },
    });
    if (!existing) {
      throw new NotFoundException('این مورد در سبد خرید یافت نشد');
    }

    await this.prisma.cartItem.update({
      where: { cartId_variantId: { cartId, variantId } },
      data: { quantity: input.quantity },
    });

    return this.get(cartId);
  }

  /** Removes a cart line and returns the updated cart. */
  async removeItem(cartId: string, variantId: string): Promise<Cart> {
    await this.assertCartExists(cartId);

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId } },
    });
    if (!existing) {
      throw new NotFoundException('این مورد در سبد خرید یافت نشد');
    }

    await this.prisma.cartItem.delete({
      where: { cartId_variantId: { cartId, variantId } },
    });

    return this.get(cartId);
  }

  /** Cheap existence probe so unknown carts 404 before any mutation. */
  private async assertCartExists(cartId: string): Promise<void> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      select: { id: true },
    });
    if (!cart) {
      throw new NotFoundException('سبد خرید یافت نشد');
    }
  }
}
