import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { OrderSchema, type Order } from '@bc/contracts';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Orders API e2e (in-memory Prisma double) — read + cancel of DRAFT drafts.
 * Lines are immutable snapshots; cancel follows the @bc/domain state machine.
 */

interface FakeOrderLine {
  orderId: string;
  variantId: string;
  sku: string;
  productNameFa: string;
  productNameEn: string;
  titleFa: string;
  titleEn: string;
  quantity: number;
  unitPriceMinor: number;
  currency: string;
  lineTotalMinor: number;
}

interface FakeOrderRow {
  id: string;
  status: 'DRAFT' | 'CANCELLED';
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
  lines: FakeOrderLine[];
}

const ORDER: FakeOrderRow = {
  id: 'ord-1',
  status: 'DRAFT',
  currency: 'IRR',
  itemCount: 2,
  subtotalMinor: 4_500_000,
  fullName: 'آرزو کریمی',
  phone: '09123456789',
  province: 'تهران',
  city: 'تهران',
  postalCode: '1234567890',
  addressLine: 'خیابان ولیعصر، پلاک ۱۲، واحد ۳',
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  lines: [
    {
      orderId: 'ord-1',
      variantId: 'var-1',
      sku: 'DMV-SRM-30C',
      productNameFa: 'سرم ویتامین C اتیریال',
      productNameEn: 'Ethereal Vitamin C Serum',
      titleFa: 'حجم ۳۰ میلی‌لیتر',
      titleEn: '30 ml',
      quantity: 2,
      unitPriceMinor: 2_250_000,
      currency: 'IRR',
      lineTotalMinor: 4_500_000,
    },
  ],
};

const state = { orders: [] as FakeOrderRow[] };

const fakePrismaCore = {
  $connect: async (): Promise<void> => undefined,
  $disconnect: async (): Promise<void> => undefined,
  $executeRaw: jest.fn(async (): Promise<number> => 1),
  inventoryLedger: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => data),
  },
  orderLine: {
    findMany: jest.fn(async (): Promise<Array<Record<string, unknown>>> => []),
  },
  order: {
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      return state.orders.find((o) => o.id === args?.where?.id) ?? null;
    }),
    update: jest.fn(async (args: { where: { id: string }; data: { status: string } }) => {
      const row = state.orders.find((o) => o.id === args.where.id);
      if (!row) {
        throw new Error('order.update: not found');
      }
      row.status = args.data.status as 'DRAFT' | 'CANCELLED';
      return row;
    }),
  },
};

// Interactive transactions run against the same in-memory state.
Object.assign(fakePrismaCore, {
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
    fn(fakePrismaCore as unknown),
});

const fakePrisma = fakePrismaCore as unknown as PrismaService;

describe('Orders API (e2e, in-memory Prisma)', () => {
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
    const clone = JSON.parse(JSON.stringify(ORDER)) as FakeOrderRow;
    // JSON round-trip turns Date into string — the mapper expects a real Date
    // (Prisma always delivers Date), so revive it.
    state.orders = [{ ...clone, createdAt: new Date(clone.createdAt) }];
    jest.clearAllMocks();
  });

  it('404 for unknown order with the Persian message', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/orders/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('سفارش یافت نشد');
  });

  it('returns a DRAFT order that satisfies the Order contract', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/orders/ord-1').expect(200);
    const order: Order = OrderSchema.parse(res.body);
    expect(order.status).toBe('DRAFT');
    expect(order.itemCount).toBe(2);
    expect(order.subtotalMinor).toBe(4_500_000);
    expect(order.lines[0]).toMatchObject({ sku: 'DMV-SRM-30C', lineTotalMinor: 4_500_000 });
    expect(order.address.city).toBe('تهران');
  });

  it('cancels a DRAFT order', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/orders/ord-1/cancel').expect(200);
    const order: Order = OrderSchema.parse(res.body);
    expect(order.status).toBe('CANCELLED');
  });

  it('rejects cancelling an already-CANCELLED order (state machine)', async () => {
    await request(app.getHttpServer()).post('/api/v1/orders/ord-1/cancel').expect(200);
    const res = await request(app.getHttpServer()).post('/api/v1/orders/ord-1/cancel');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('این وضعیت سفارش قابل لغو نیست');
  });
});
