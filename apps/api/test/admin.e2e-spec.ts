import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  AdminInventoryItem,
  AdminLedgerResponseSchema,
  AdminOrderListResponseSchema,
} from '@bc/contracts';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Admin console e2e (in-memory Prisma double). Guard matrix: missing/incorrect
 * ADMIN_API_KEY; orders list; inventory list; guarded ledgered stock adjust.
 */

interface FakeOrderRow {
  id: string;
  status: string;
  currency: string;
  itemCount: number;
  subtotalMinor: number;
  fullName: string;
  phone: string;
  createdAt: Date;
  lines: Array<Record<string, unknown>>;
}

interface FakeInventoryRow {
  variantId: string;
  onHand: number;
  reserved: number;
  variant: { sku: string; product: { nameFa: string } };
}

const ORDER: FakeOrderRow = {
  id: 'ord-1',
  status: 'PAID',
  currency: 'IRR',
  itemCount: 2,
  subtotalMinor: 4_500_000,
  fullName: 'آرزو کریمی',
  phone: '09123456789',
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  lines: [{}, {}],
};

const INVENTORY: FakeInventoryRow = {
  variantId: 'var-1',
  onHand: 25,
  reserved: 3,
  variant: { sku: 'DMV-CLN-150', product: { nameFa: 'ژل شست‌وشوی ملایم اتیریال' } },
};

const state = {
  orders: [] as FakeOrderRow[],
  inventory: new Map<string, FakeInventoryRow>(),
  ledger: [] as Array<Record<string, unknown>>,
};

function makeApp(adminKey: string | undefined): Promise<INestApplication> {
  if (adminKey === undefined) {
    delete process.env.ADMIN_API_KEY;
  } else {
    process.env.ADMIN_API_KEY = adminKey;
  }
  return Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(fakePrisma)
    .compile()
    .then((moduleRef) => {
      const app = moduleRef.createNestApplication();
      applyAppConfig(app);
      return app.init();
    });
}

const fakePrisma = {
  $connect: async (): Promise<void> => undefined,
  $disconnect: async (): Promise<void> => undefined,
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
    fn(fakePrisma),
  $executeRaw: jest.fn(async (): Promise<number> => 1),
  order: {
    findMany: jest.fn(async (args?: { where?: { status?: string }; skip?: number; take?: number }) => {
      let rows = [...state.orders];
      if (args?.where?.status) {
        rows = rows.filter((row) => row.status === args.where?.status);
      }
      return rows.slice(args?.skip ?? 0, (args?.skip ?? 0) + (args?.take ?? 100));
    }),
    count: jest.fn(async (args?: { where?: { status?: string } }) => {
      let rows = [...state.orders];
      if (args?.where?.status) {
        rows = rows.filter((row) => row.status === args.where?.status);
      }
      return rows.length;
    }),
  },
  inventoryItem: {
    findUnique: jest.fn(async (args?: { where?: { variantId?: string } }) => {
      return state.inventory.get(args?.where?.variantId ?? '') ?? null;
    }),
    findUniqueOrThrow: jest.fn(async (args?: { where?: { variantId?: string } }) => {
      const row = state.inventory.get(args?.where?.variantId ?? '');
      if (!row) {
        throw new Error('inventoryItem.findUniqueOrThrow: not found');
      }
      return row;
    }),
    findMany: jest.fn(async () => Array.from(state.inventory.values())),
    update: jest.fn(async (args: { where: { variantId: string }; data: { onHand: { increment: number } } }) => {
      const row = state.inventory.get(args.where.variantId);
      if (!row) {
        throw new Error('inventoryItem.update: not found');
      }
      row.onHand += args.data.onHand.increment;
      return row;
    }),
  },
  inventoryLedger: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const row = {
        id: `led-${state.ledger.length + 1}`,
        createdAt: new Date('2026-01-04T00:00:00.000Z'),
        ...data,
      };
      state.ledger.push(row);
      return row;
    }),
    findMany: jest.fn(async () => [...state.ledger].sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime())),
  },
} as unknown as PrismaService;

describe('Admin console API (e2e, in-memory Prisma — bootstrap key guard)', () => {
  let app: INestApplication;
  const KEY = 'test-admin-key';
  const auth = { 'x-admin-key': KEY };

  beforeAll(async () => {
    app = await makeApp(KEY);
  });

  afterAll(async () => {
    await app.close();
    delete process.env.ADMIN_API_KEY;
  });

  beforeEach(() => {
    state.orders = [{ ...ORDER, createdAt: new Date(ORDER.createdAt), lines: [{}, {}] }];
    state.inventory = new Map([['var-1', { ...INVENTORY, variant: { ...INVENTORY.variant, product: { ...INVENTORY.variant.product } } }]]);
    state.ledger = [];
    jest.clearAllMocks();
  });

  it('401 without the x-admin-key header', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/admin/orders');
    expect(res.status).toBe(401);
  });

  it('401 with a wrong key', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/orders')
      .set({ 'x-admin-key': 'wrong-key' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('کلید ادمین معتبر نیست');
  });

  it('lists orders (any status) satisfying the admin contract', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/orders')
      .set(auth)
      .expect(200);
    const parsed = AdminOrderListResponseSchema.parse(res.body);
    expect(parsed.total).toBe(1);
    expect(parsed.items[0]).toMatchObject({ id: 'ord-1', status: 'PAID', lineCount: 2 });
  });

  it('filters orders by status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/orders?status=DRAFT')
      .set(auth)
      .expect(200);
    expect(res.body.total).toBe(0);
  });

  it('lists inventory with availableToSell computed server-side', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/inventory')
      .set(auth)
      .expect(200);
    const items = res.body.items as AdminInventoryItem[];
    expect(items[0]).toMatchObject({ variantId: 'var-1', onHand: 25, reserved: 3, availableToSell: 22 });
  });

  it('adjusts stock with a ledger row (ADJUSTMENT)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/inventory/var-1/adjust')
      .set(auth)
      .send({ deltaOnHand: 10, note: 'رسید انبار شماره ۱۲' })
      .expect(200);
    const item = res.body as AdminInventoryItem;
    expect(item.onHand).toBe(35);
    expect(item.availableToSell).toBe(32);
    expect(state.ledger).toHaveLength(1);
    expect(state.ledger[0]).toMatchObject({ reason: 'ADJUSTMENT', deltaOnHand: 10, refType: 'admin' });
  });

  it('rejects adjustments that would make stock negative', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/inventory/var-1/adjust')
      .set(auth)
      .send({ deltaOnHand: -100, note: 'تست منفی' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('موجودی نهایی نمی‌تواند منفی شود');
  });

  it('404 for a variant without inventory', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/inventory/var-none/adjust')
      .set(auth)
      .send({ deltaOnHand: 5, note: 'unknown variant' });
    expect(res.status).toBe(404);
  });

  it('rejects zero-delta adjustments', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/inventory/var-1/adjust')
      .set(auth)
      .send({ deltaOnHand: 0, note: 'zero' });
    expect(res.status).toBe(400);
  });

  it('returns ledger rows', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/inventory/var-1/adjust')
      .set(auth)
      .send({ deltaOnHand: 10, note: 'ledger test' })
      .expect(200);
    const res = await request(app.getHttpServer()).get('/api/v1/admin/ledger').set(auth).expect(200);
    const parsed = AdminLedgerResponseSchema.parse(res.body);
    expect(parsed.items).toHaveLength(1);
  });
});

describe('Admin console API disabled (ADMIN_API_KEY unset → 404)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await makeApp(undefined);
  });

  afterAll(async () => {
    await app.close();
    delete process.env.ADMIN_API_KEY;
  });

  it('404s admin routes when the key is not configured', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/orders')
      .set({ 'x-admin-key': 'anything' });
    expect(res.status).toBe(404);
  });
});
