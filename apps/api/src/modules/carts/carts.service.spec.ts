import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CartsService } from './carts.service';

describe('CartsService', () => {
  let service: CartsService;
  let cartCreate: jest.Mock;
  let cartFindUnique: jest.Mock;
  let variantFindUnique: jest.Mock;
  let cartItemFindUnique: jest.Mock;
  let cartItemUpsert: jest.Mock;
  let cartItemUpdate: jest.Mock;
  let cartItemDelete: jest.Mock;
  let transaction: jest.Mock;

  const mockCartRow = (items: unknown[] = []) => ({
    id: 'cart-1',
    status: 'ACTIVE',
    items,
  });

  const mockVariantRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'var-1',
    sku: 'DMV-CLN-150',
    titleFa: 'حجم ۱۵۰ میلی‌لیتر',
    titleEn: '150 ml',
    priceMinor: 1890000,
    currency: 'IRR',
    status: 'ACTIVE',
    product: {
      status: 'ACTIVE',
      nameFa: 'ژل شست‌وشو',
      nameEn: 'Cleanser',
    },
    ...overrides,
  });

  beforeEach(async () => {
    cartCreate = jest.fn();
    cartFindUnique = jest.fn();
    variantFindUnique = jest.fn();
    cartItemFindUnique = jest.fn();
    cartItemUpsert = jest.fn();
    cartItemUpdate = jest.fn();
    cartItemDelete = jest.fn();
    transaction = jest.fn(async (cb) =>
      cb({
        cartItem: {
          findUnique: cartItemFindUnique,
          upsert: cartItemUpsert,
          update: cartItemUpdate,
          delete: cartItemDelete,
        },
      }),
    );

    const fakePrisma = {
      cart: { create: cartCreate, findUnique: cartFindUnique },
      productVariant: { findUnique: variantFindUnique },
      cartItem: { findUnique: cartItemFindUnique, delete: cartItemDelete },
      $transaction: transaction,
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [CartsService, { provide: PrismaService, useValue: fakePrisma }],
    }).compile();

    service = moduleRef.get(CartsService);
  });

  describe('create()', () => {
    it('creates an empty active cart and returns the cart contract', async () => {
      cartCreate.mockResolvedValue(mockCartRow([]));
      const cart = await service.create();
      expect(cart.id).toBe('cart-1');
      expect(cart.status).toBe('ACTIVE');
      expect(cart.items).toHaveLength(0);
      expect(cart.subtotalMinor).toBe(0);
      expect(cart.currency).toBe('IRR');
    });
  });

  describe('get()', () => {
    it('returns an existing cart with items and server-calculated totals', async () => {
      const items = [
        {
          id: 'ci-1',
          cartId: 'cart-1',
          variantId: 'var-1',
          quantity: 2,
          variant: mockVariantRow(),
        },
      ];
      cartFindUnique.mockResolvedValue(mockCartRow(items));
      const cart = await service.get('cart-1');
      expect(cart.id).toBe('cart-1');
      expect(cart.itemCount).toBe(2);
      expect(cart.subtotalMinor).toBe(1890000 * 2);
      expect(cart.items[0].productNameFa).toBe('ژل شست‌وشو');
    });

    it('throws NotFoundException when cart does not exist', async () => {
      cartFindUnique.mockResolvedValue(null);
      await expect(service.get('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addItem()', () => {
    it('rejects adding non-active variant with NotFoundException', async () => {
      cartFindUnique.mockResolvedValue({ id: 'cart-1' });
      variantFindUnique.mockResolvedValue(mockVariantRow({ status: 'ARCHIVED' }));
      await expect(service.addItem('cart-1', { variantId: 'var-1', quantity: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('adds item to cart and merges quantity if already exists', async () => {
      cartFindUnique
        .mockResolvedValueOnce({ id: 'cart-1' })
        .mockResolvedValueOnce(
          mockCartRow([
            {
              id: 'ci-1',
              cartId: 'cart-1',
              variantId: 'var-1',
              quantity: 3,
              variant: mockVariantRow(),
            },
          ]),
        );
      variantFindUnique.mockResolvedValue(mockVariantRow());
      cartItemFindUnique.mockResolvedValue({ id: 'ci-1', quantity: 2 });

      const cart = await service.addItem('cart-1', { variantId: 'var-1', quantity: 1 });
      expect(cartItemUpsert).toHaveBeenCalledWith({
        where: { cartId_variantId: { cartId: 'cart-1', variantId: 'var-1' } },
        create: { cartId: 'cart-1', variantId: 'var-1', quantity: 3 },
        update: { quantity: 3 },
      });
      expect(cart.itemCount).toBe(3);
    });
  });

  describe('updateItem()', () => {
    it('updates quantity of existing cart line', async () => {
      cartFindUnique
        .mockResolvedValueOnce({ id: 'cart-1' })
        .mockResolvedValueOnce(
          mockCartRow([
            {
              id: 'ci-1',
              cartId: 'cart-1',
              variantId: 'var-1',
              quantity: 5,
              variant: mockVariantRow(),
            },
          ]),
        );
      cartItemFindUnique.mockResolvedValue({ id: 'ci-1', quantity: 2 });

      const cart = await service.updateItem('cart-1', 'var-1', { quantity: 5 });
      expect(cartItemUpdate).toHaveBeenCalledWith({
        where: { cartId_variantId: { cartId: 'cart-1', variantId: 'var-1' } },
        data: { quantity: 5 },
      });
      expect(cart.itemCount).toBe(5);
    });

    it('throws NotFoundException if item to update is not in cart', async () => {
      cartFindUnique.mockResolvedValue({ id: 'cart-1' });
      cartItemFindUnique.mockResolvedValue(null);
      await expect(service.updateItem('cart-1', 'var-1', { quantity: 5 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeItem()', () => {
    it('removes item from cart and returns updated cart', async () => {
      cartFindUnique
        .mockResolvedValueOnce({ id: 'cart-1' })
        .mockResolvedValueOnce(mockCartRow([]));
      cartItemFindUnique.mockResolvedValue({ id: 'ci-1' });

      const cart = await service.removeItem('cart-1', 'var-1');
      expect(cartItemDelete).toHaveBeenCalledWith({
        where: { cartId_variantId: { cartId: 'cart-1', variantId: 'var-1' } },
      });
      expect(cart.items).toHaveLength(0);
    });

    it('throws NotFoundException if item to remove is not in cart', async () => {
      cartFindUnique.mockResolvedValue({ id: 'cart-1' });
      cartItemFindUnique.mockResolvedValue(null);
      await expect(service.removeItem('cart-1', 'var-1')).rejects.toThrow(NotFoundException);
    });
  });
});
