import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { OrderSchema, type Order } from '@bc/contracts';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Checkout API e2e (in-memory Prisma double — HTTP layer + business rules,
 * no real DB; the real-DB flow is covered by the runtime smoke evidence).
 */

interface FakeVariant {
  id: string;
  sku: string;
  titleFa: string;
  titleEn: string;
  priceMinor: number;
  currency: string;
  isDefault: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  productId: string;
}

const VARIANTS: Record<string, FakeVariant> = {
  'var-1': {
    id: 'var-1',
    sku: 'DMV-SRM-30C',
    titleFa: 'حجم ۳۰ میلی‌لیتر',
    titleEn: '30 ml',
    priceMinor: 2_250_000,
    currency: 'IRR',
    isDefault: true,
    status: 'ACTIVE',
    productId: 'prd-1',
  },
  'var-arch': {
    id: 'var-arch',
    sku: 'DMV-ARC-001',
    titleFa: 'محصول آرشیو شده',
    titleEn: 'Legacy Archived Cleanser',
    priceMinor: 999_000,
    currency: 'IRR',
    isDefault: false,
    status: 'ARCHIVED',
    productId: 'prd-1',
  },
};

const PRODUCTS: Record<string, { status: 'ACTIVE'; nameFa: string; nameEn: string }> = {
  'prd-1': { status: 'ACTIVE', nameFa: 'سرم ویتامین C اتیریال', nameEn: 'Ethereal Vitamin C Serum' },
};

interface FakeCartItem {
  cartId: string;
  variantId: string;
  quantity: number;
}

interface FakeOrder {
  id: string;
  status: 'DRAFT' | 'CANCELLED';
  cartId: string;
  currency: string;
  itemCount: number;
  subtotalMinor: number;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  postalCode: string;
  addressLine: string;
  createdAt: Date;
  lines: Array<Record<string, unknown>>;
}

const state = {
  carts: new Map<string, { id: string; status: 'ACTIVE' | 'CONVERTED'; items: FakeCartItem[] }>(),
  orders: [] as FakeOrder[],
  orderSeq: 0,
};

function resetState(): void {
  state.carts.clear();
  state.orders = [];
  state.orderSeq = 0;
}

function makeCart(id: string, items: FakeCartItem[]): void {
  state.carts.set(id, { id, status: 'ACTIVE', items });
}

const hydrateCart = (cart: { id: string; status: string; items: FakeCartItem[] }) => ({
  id: cart.id,
  status: cart.status,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  items: cart.items.map((item) => ({
    ...item,
    variant: { ...VARIANTS[item.variantId], product: { ...PRODUCTS[VARIANTS[item.variantId].productId] } },
  })),
});

const fakePrismaCore = {
  $connect: async (): Promise<void> => undefined,
  $disconnect: async (): Promise<void> => undefined,
  cart: {
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      const cart = state.carts.get(args?.where?.id ?? '');
      return cart ? hydrateCart(cart) : null;
    }),
    update: jest.fn(async (args: { where: { id: string }; data: { status: string } }) => {
      const cart = state.carts.get(args.where.id);
      if (!cart) {
        throw new Error('cart.update: not found');
      }
      cart.status = args.data.status as 'ACTIVE' | 'CONVERTED';
      return hydrateCart(cart);
    }),
  },
  order: {
    create: jest.fn(async ({ data }: { data: Record<string, any> }) => {
      // cartId is @unique on Order in the real schema — the double enforces it
      // by raising the exact Prisma error class the service catches.
      if (state.orders.some((o) => o.cartId === data.cartId)) {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'in-memory-double',
        });
      }
      state.orderSeq += 1;
      const order: FakeOrder = {
        id: `ord-${state.orderSeq}`,
        status: 'DRAFT',
        cartId: data.cartId,
        currency: data.currency,
        itemCount: data.itemCount,
        subtotalMinor: data.subtotalMinor,
        fullName: data.fullName,
        phone: data.phone,
        province: data.province,
        city: data.city,
        postalCode: data.postalCode,
        addressLine: data.addressLine,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        lines: [],
      };
      state.orders.push(order);
      return order;
    }),
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      return state.orders.find((o) => o.id === args?.where?.id) ?? null;
    }),
  },
  orderLine: {
    createMany: jest.fn(async ({ data }: { data: Array<Record<string, unknown>> }) => {
      const orderId = data[0]?.orderId as string;
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) {
        throw new Error('orderLine.createMany: order not found');
      }
      order.lines = data.map((line) => ({ ...line }));
      return { count: data.length };
    }),
  },
};

const fakePrisma = {
  ...fakePrismaCore,
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
    fn(fakePrismaCore as unknown),
} as unknown as PrismaService;

const VALID_ADDRESS = {
  fullName: 'آرزو کریمی',
  phone: '09123456789',
  province: 'تهران',
  city: 'تهران',
  postalCode: '1234567890',
  addressLine: 'خیابان ولیعصر، پلاک ۱۲، واحد ۳',
};

describe('Checkout API (e2e, in-memory Prisma)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(fakePrisma)
      .compile();
    app = moduleRef.createNestApplication();
    applyAppConfig(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetState();
    jest.clearAllMocks();
  });

  const checkoutBody = (cartId: string, overrides: Record<string, unknown> = {}) => ({
    cartId,
    address: { ...VALID_ADDRESS, ...overrides },
  });

  it('creates a DRAFT order with server-resolved snapshot lines and converts the cart', async () => {
    makeCart('cart-1', [{ cartId: 'cart-1', variantId: 'var-1', quantity: 2 }]);
    const res = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send(checkoutBody('cart-1'))
      .expect(201);
    const order: Order = OrderSchema.parse(res.body);
    expect(order.status).toBe('DRAFT');
    expect(order.itemCount).toBe(2);
    expect(order.subtotalMinor).toBe(4_500_000); // 2 × 2,250,000 — server prices only
    expect(order.lines).toHaveLength(1);
    expect(order.lines[0]).toMatchObject({
      variantId: 'var-1',
      sku: 'DMV-SRM-30C',
      productNameFa: 'سرم ویتامین C اتیریال',
      lineTotalMinor: 4_500_000,
    });
    // cart became CONVERTED — a follow-up add is rejected
    const cartRes = await request(app.getHttpServer()).get('/api/v1/carts/cart-1').expect(200);
    expect(cartRes.body.status).toBe('CONVERTED');
  });

  it('rejects a second checkout of the same cart (unique cartId → clean 400)', async () => {
    makeCart('cart-1', [{ cartId: 'cart-1', variantId: 'var-1', quantity: 1 }]);
    await request(app.getHttpServer()).post('/api/v1/checkout').send(checkoutBody('cart-1')).expect(201);
    // Race-window simulation: the cart is somehow still ACTIVE while an order
    // with the same cartId already exists — the DB unique constraint is the
    // last line of defense, surfaced as a clean Persian 400.
    state.carts.get('cart-1')!.status = 'ACTIVE';
    const res = await request(app.getHttpServer()).post('/api/v1/checkout').send(checkoutBody('cart-1'));
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.message)).toContain('قبلاً به سفارش تبدیل شده');
  });

  it('rejects checkout of a CONVERTED cart (400 قابل تسویه نیست)', async () => {
    makeCart('cart-1', [{ cartId: 'cart-1', variantId: 'var-1', quantity: 1 }]);
    await request(app.getHttpServer()).post('/api/v1/checkout').send(checkoutBody('cart-1')).expect(201);
    // simulate a state where only the cart status is CONVERTED
    state.carts.get('cart-1')!.status = 'CONVERTED';
    state.orders = [];
    const res = await request(app.getHttpServer()).post('/api/v1/checkout').send(checkoutBody('cart-1'));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('این سبد خرید قابل تسویه نیست');
  });

  it('404 for unknown cart, 400 for empty cart', async () => {
    const missing = await request(app.getHttpServer()).post('/api/v1/checkout').send(checkoutBody('nope'));
    expect(missing.status).toBe(404);
    expect(missing.body.message).toBe('سبد خرید یافت نشد');

    makeCart('cart-empty', []);
    const empty = await request(app.getHttpServer()).post('/api/v1/checkout').send(checkoutBody('cart-empty'));
    expect(empty.status).toBe(400);
    expect(empty.body.message).toBe('سبد خرید خالی است');
  });

  it('400 when the cart only contains an unavailable (ARCHIVED) variant', async () => {
    makeCart('cart-arch', [{ cartId: 'cart-arch', variantId: 'var-arch', quantity: 1 }]);
    const res = await request(app.getHttpServer()).post('/api/v1/checkout').send(checkoutBody('cart-arch'));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('سبد خرید خالی است');
  });

  it('normalizes Persian-digit phone/postal and rejects malformed ones', async () => {
    makeCart('cart-1', [{ cartId: 'cart-1', variantId: 'var-1', quantity: 1 }]);
    const fa = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send(
        checkoutBody('cart-1', { phone: '۰۹۱۲۳۴۵۶۷۸۹', postalCode: '۱۲۳۴۵۶۷۸۹۰' }),
      )
      .expect(201);
    expect(OrderSchema.parse(fa.body).address.phone).toBe('09123456789');

    makeCart('cart-2', [{ cartId: 'cart-2', variantId: 'var-1', quantity: 1 }]);
    const badPhone = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send(checkoutBody('cart-2', { phone: '0912' }))
      .expect(400);
    expect(Array.isArray(badPhone.body.message)).toBe(true);

    makeCart('cart-3', [{ cartId: 'cart-3', variantId: 'var-1', quantity: 1 }]);
    const badPostal = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send(checkoutBody('cart-3', { postalCode: '123456789' }))
      .expect(400);
    expect(JSON.stringify(badPostal.body.message)).toContain('کد پستی');
  });
});
