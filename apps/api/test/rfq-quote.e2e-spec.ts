import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  QuoteSchema,
  RfqSchema,
  type Quote,
  type Rfq,
} from '@bc/contracts';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * RFQ → Quote → Accept → Order e2e (in-memory Prisma double). Guards tested:
 * immutable revisions (append-only), invalid transition pricing, expiry,
 * double-accept, inventory reservation on accept (409 path), terminal guards.
 */

interface FakeRfqItemRow {
  id: string;
  rfqId: string;
  variantId: string | null;
  productName: string;
  quantity: number;
  note: string | null;
  itemKind: 'CATALOG' | 'OEM';
  specNote: string | null;
}

interface FakeRfqRow {
  id: string;
  status: 'SUBMITTED' | 'PRICED' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'CLOSED';
  contactName: string;
  contactPhone: string;
  note: string | null;
  targetMarket: string | null;
  packaging: string | null;
  requestedDeliveryDate: Date | null;
  confidentiality: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: FakeRfqItemRow[];
  quote: FakeQuoteRow | null;
}

interface FakeQuoteRow {
  id: string;
  rfqId: string;
  status: 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  currency: string;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
  revisions: Array<Record<string, unknown>>;
  rfq?: FakeRfqRow;
}

interface FakeRevisionRow {
  id: string;
  quoteId: string;
  revisionNo: number;
  linesJson: Array<Record<string, unknown>>;
  subtotalMinor: number;
  currency: string;
  leadTimeDays: number | null;
  paymentTerms: string | null;
  isSample: boolean;
  note: string | null;
  createdAt: Date;
}

const state = {
  rfqs: [] as FakeRfqRow[],
  rfqItems: [] as FakeRfqItemRow[],
  quotes: [] as FakeQuoteRow[],
  revisions: [] as FakeRevisionRow[],
  orders: [] as Array<Record<string, unknown>>,
  orderLines: [] as Array<Record<string, unknown>>,
  inventory: new Map<string, { onHand: number; reserved: number }>(),
  ledger: [] as Array<Record<string, unknown>>,
  rfqSeq: 0,
  itemSeq: 0,
  quoteSeq: 0,
  revisionSeq: 0,
  orderSeq: 0,
};

const VARIANTS: Record<string, { id: string; sku: string; priceMinor: number; status: 'ACTIVE' | 'ARCHIVED'; productId: string }> = {
  'var-1': { id: 'var-1', sku: 'DMV-SRM-30C', priceMinor: 3_950_000, status: 'ACTIVE', productId: 'prd-1' },
  'var-arch': { id: 'var-arch', sku: 'DMV-ARC-001', priceMinor: 999_000, status: 'ARCHIVED', productId: 'prd-1' },
};

const PRODUCTS: Record<string, { status: 'ACTIVE'; nameFa: string }> = {
  'prd-1': { status: 'ACTIVE', nameFa: 'سرم ویتامین C اتیریال' },
};

function resetState(): void {
  state.rfqs = [];
  state.rfqItems = [];
  state.quotes = [];
  state.revisions = [];
  state.orders = [];
  state.orderLines = [];
  state.inventory = new Map([['var-1', { onHand: 10, reserved: 0 }]]);
  state.ledger = [];
  state.rfqSeq = 0;
  state.itemSeq = 0;
  state.quoteSeq = 0;
  state.revisionSeq = 0;
  state.orderSeq = 0;
}

const hydrateRfq = (rfq: FakeRfqRow): FakeRfqRow => ({
  ...rfq,
  items: state.rfqItems.filter((item) => item.rfqId === rfq.id),
  quote: state.quotes.find((quote) => quote.rfqId === rfq.id) ?? null,
});

const fakePrismaCore = {
  $connect: async (): Promise<void> => undefined,
  $disconnect: async (): Promise<void> => undefined,
  // Emulates the guarded inventory UPDATEs so assertions can observe the
  // reservation effect (the real DB does this in one atomic statement).
  $executeRaw: jest.fn(async (...args: unknown[]): Promise<number> => {
    const strings = args[0] as TemplateStringsArray;
    const sql = strings.join("");
    const values = args.slice(1);
    if (sql.includes('"reserved" = "reserved" +')) {
      const qty = values[0] as number;
      const variantId = values[1] as string;
      const minAvailable = values[2] as number;
      const row = state.inventory.get(variantId);
      if (!row || row.onHand - row.reserved < minAvailable) {
        return 0;
      }
      row.reserved += qty;
      return 1;
    }
    if (sql.includes('"onHand" = "onHand" -')) {
      const qty = values[0] as number;
      const variantId = values[1] as string;
      const row = state.inventory.get(variantId);
      if (!row || row.reserved < qty) {
        return 0;
      }
      row.onHand -= qty;
      row.reserved -= qty;
      return 1;
    }
    if (sql.includes('"reserved" = "reserved" -')) {
      const qty = values[0] as number;
      const variantId = values[1] as string;
      const row = state.inventory.get(variantId);
      if (!row || row.reserved < qty) {
        return 0;
      }
      row.reserved -= qty;
      return 1;
    }
    return 1;
  }),
  inventoryLedger: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.ledger.push({ id: `led-${state.ledger.length + 1}`, createdAt: new Date(), ...data });
      return data;
    }),
    findMany: jest.fn(async () => state.ledger),
  },
  rfq: {
    create: jest.fn(async ({ data }: { data: { items: { create: Array<Record<string, unknown>> } } & Record<string, unknown> }) => {
      state.rfqSeq += 1;
      const rfq: FakeRfqRow = {
        id: `rfq-${state.rfqSeq}`,
        status: 'SUBMITTED',
        contactName: data.contactName as string,
        contactPhone: data.contactPhone as string,
        note: (data.note as string | null) ?? null,
        targetMarket: (data.targetMarket as string | null) ?? null,
        packaging: (data.packaging as string | null) ?? null,
        requestedDeliveryDate: (data.requestedDeliveryDate as Date | null) ?? null,
        confidentiality: (data.confidentiality as boolean | undefined) ?? false,
        createdAt: new Date('2026-01-06T00:00:00.000Z'),
        updatedAt: new Date('2026-01-06T00:00:00.000Z'),
        items: [],
        quote: null,
      };
      state.rfqs.push(rfq);
      for (const item of data.items.create) {
        state.itemSeq += 1;
        state.rfqItems.push({
          id: `ritem-${state.itemSeq}`,
          rfqId: rfq.id,
          variantId: (item.variantId as string | null) ?? null,
          productName: item.productName as string,
          quantity: item.quantity as number,
          note: (item.note as string | null) ?? null,
          itemKind: ((item.itemKind as 'CATALOG' | 'OEM') ?? 'CATALOG'),
          specNote: (item.specNote as string | null) ?? null,
        });
      }
      return hydrateRfq(rfq);
    }),
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      const rfq = state.rfqs.find((row) => row.id === args?.where?.id);
      return rfq ? hydrateRfq(rfq) : null;
    }),
    findMany: jest.fn(async (args?: { where?: { status?: string } }) => {
      let rows = [...state.rfqs];
      if (args?.where?.status) {
        rows = rows.filter((row) => row.status === args.where?.status);
      }
      return rows.map(hydrateRfq);
    }),
    update: jest.fn(async (args: { where: { id: string }; data: { status: string } }) => {
      const rfq = state.rfqs.find((row) => row.id === args.where.id);
      if (!rfq) {
        throw new Error('rfq.update: not found');
      }
      rfq.status = args.data.status as FakeRfqRow['status'];
      return hydrateRfq(rfq);
    }),
  },
  rfqItem: {
    findMany: jest.fn(async (args?: { where?: { rfqId?: string } }) => {
      return state.rfqItems.filter((item) => item.rfqId === args?.where?.rfqId);
    }),
  },
  quote: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.quoteSeq += 1;
      const quote: FakeQuoteRow = {
        id: `qt-${state.quoteSeq}`,
        rfqId: data.rfqId as string,
        status: 'SENT',
        currency: data.currency as string,
        validUntil: data.validUntil as Date,
        createdAt: new Date('2026-01-07T00:00:00.000Z'),
        updatedAt: new Date('2026-01-07T00:00:00.000Z'),
        revisions: [],
      };
      state.quotes.push(quote);
      const rfq = state.rfqs.find((row) => row.id === quote.rfqId);
      if (rfq) {
        rfq.quote = quote;
      }
      return quote;
    }),
    findUnique: jest.fn(async (args?: { where?: { id?: string }; include?: unknown }) => {
      const quote = state.quotes.find((row) => row.id === args?.where?.id);
      if (!quote) {
        return null;
      }
      return {
        ...quote,
        revisions: state.revisions
          .filter((revision) => revision.quoteId === quote.id)
          .sort((a, b) => a.revisionNo - b.revisionNo),
      };
    }),
    update: jest.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
      const quote = state.quotes.find((row) => row.id === args.where.id);
      if (!quote) {
        throw new Error('quote.update: not found');
      }
      Object.assign(quote, args.data);
      return quote;
    }),
  },
  quoteRevision: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.revisionSeq += 1;
      const revision: FakeRevisionRow = {
        id: `rev-${state.revisionSeq}`,
        quoteId: data.quoteId as string,
        revisionNo: data.revisionNo as number,
        linesJson: data.linesJson as Array<Record<string, unknown>>,
        subtotalMinor: data.subtotalMinor as number,
        currency: data.currency as string,
        leadTimeDays: (data.leadTimeDays as number | null) ?? null,
        paymentTerms: (data.paymentTerms as string | null) ?? null,
        isSample: true,
        note: (data.note as string | null) ?? null,
        createdAt: new Date('2026-01-07T01:00:00.000Z'),
      };
      state.revisions.push(revision);
      return revision;
    }),
  },
  productVariant: {
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      const variant = VARIANTS[args?.where?.id ?? ''];
      if (!variant) {
        return null;
      }
      return { ...variant, product: { ...PRODUCTS[variant.productId] } };
    }),
  },
  order: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.orderSeq += 1;
      const order = {
        id: `ord-${state.orderSeq}`,
        status: 'DRAFT',
        lines: [],
        createdAt: new Date('2026-01-08T00:00:00.000Z'),
        ...data,
      };
      state.orders.push(order);
      return order;
    }),
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      return state.orders.find((row) => row.id === args?.where?.id) ?? null;
    }),
  },
  orderLine: {
    createMany: jest.fn(async ({ data }: { data: Array<Record<string, unknown>> }) => {
      state.orderLines.push(...data.map((line) => ({ ...line })));
      return { count: data.length };
    }),
    findMany: jest.fn(async (): Promise<Array<Record<string, unknown>>> => []),
  },
};

const fakePrisma = {
  ...fakePrismaCore,
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
    fn(fakePrismaCore as unknown),
} as unknown as PrismaService;

const KEY = 'test-admin-key';
const ADDRESS = {
  fullName: 'آرزو کریمی',
  phone: '09123456789',
  province: 'تهران',
  city: 'تهران',
  postalCode: '1234567890',
  addressLine: 'خیابان ولیعصر، پلاک ۱۲',
};

describe('RFQ → Quote → Accept → Order (e2e, in-memory Prisma)', () => {
  let app: INestApplication;
  const auth = { 'x-admin-key': KEY };

  beforeAll(async () => {
    process.env.ADMIN_API_KEY = KEY;
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
    delete process.env.ADMIN_API_KEY;
  });

  beforeEach(() => {
    resetState();
    jest.clearAllMocks();
  });

  const submitRfq = () =>
    request(app.getHttpServer())
      .post('/api/v1/b2b/rfqs')
      .send({
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        items: [{ variantId: 'var-1', productName: 'سرم ویتامین C اتیریال', quantity: 2 }],
        note: 'نیاز فوری',
      });

  it('N10 brief fields are stored and returned (market/packaging/delivery/confidentiality)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/b2b/rfqs')
      .send({
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        items: [{ variantId: 'var-1', productName: 'سرم', quantity: 2 }],
        targetMarket: 'بازار فارسی‌زبان خلیج فارس',
        packaging: 'جعبه ۲۴تایی با برندینگ مشتری',
        requestedDeliveryDate: '2026-03-15',
        confidentiality: true,
      })
      .expect(201);
    const rfq: Rfq = RfqSchema.parse(res.body);
    expect(rfq.targetMarket).toContain('خلیج فارس');
    expect(rfq.packaging).toContain('۲۴تایی');
    expect(rfq.requestedDeliveryDate).toBe('2026-03-15');
    expect(rfq.confidentiality).toBe(true);
  });

  it('public RFQ submit creates SUBMITTED rfq with items', async () => {
    const res = await submitRfq().expect(201);
    const rfq: Rfq = RfqSchema.parse(res.body);
    expect(rfq.status).toBe('SUBMITTED');
    expect(rfq.items).toHaveLength(1);
    expect(rfq.items[0]?.quantity).toBe(2);
    expect(rfq.quote).toBeNull();
  });

  it('RFQ with a custom (variant-less) line is allowed at intake', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/b2b/rfqs')
      .send({
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        items: [{ productName: 'سفارشی: شامپو با رایحه اختصاصی', quantity: 500 }],
      })
      .expect(201);
    expect(RfqSchema.parse(res.body).items[0]?.variantId).toBeNull();
  });

  it('admin issues Quote Revision 1 with SERVER-resolved prices (isSample=true)', async () => {
    await submitRfq().expect(201);
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14, leadTimeDays: 7, paymentTerms: 'پیش‌پرداخت ۵۰٪', note: 'نرخ نمونه' })
      .expect(201);
    const quote: Quote = QuoteSchema.parse(res.body);
    expect(quote.status).toBe('SENT');
    expect(quote.revisions).toHaveLength(1);
    expect(quote.revisions[0]?.revisionNo).toBe(1);
    expect(quote.revisions[0]?.isSample).toBe(true);
    expect(quote.revisions[0]?.lines[0]?.unitPriceMinor).toBe(3_950_000); // server price
    expect(quote.revisions[0]?.subtotalMinor).toBe(7_900_000);
  });

  it('pricing an rfq with an ARCHIVED variant line is rejected', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/b2b/rfqs')
      .send({
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        items: [{ variantId: 'var-arch', productName: 'محصول آرشیو', quantity: 1 }],
      })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14 });
    expect(res.status).toBe(404);
  });

  it('addRevision appends Revision 2 immutably — Revision 1 untouched', async () => {
    await submitRfq().expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14 })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/quotes/qt-1/revisions')
      .set(auth)
      .send({ validityDays: 30, note: 'نرخ جدید پس از مذاکره' })
      .expect(200);
    const quote: Quote = QuoteSchema.parse(res.body);
    expect(quote.revisions).toHaveLength(2);
    expect(quote.revisions[0]?.revisionNo).toBe(1);
    expect(quote.revisions[1]?.revisionNo).toBe(2);
    expect(quote.revisions[1]?.note).toBe('نرخ جدید پس از مذاکره');
    // immutability: revision 1 row unchanged in the double store
    expect(state.revisions.find((r) => r.revisionNo === 1)?.subtotalMinor).toBe(7_900_000);
  });

  it('accept converts the SENT quote into a real DRAFT order (inventory reserved)', async () => {
    await submitRfq().expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14 })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/api/v1/b2b/quotes/qt-1/accept')
      .send(ADDRESS)
      .expect(201);
    const parsed = res.body as { order: { id: string; status: string; itemCount: number }; quote: Quote };
    expect(parsed.order.status).toBe('DRAFT');
    expect(parsed.order.itemCount).toBe(2);
    expect(parsed.quote.status).toBe('ACCEPTED');
    expect(state.orders).toHaveLength(1);
    expect(state.orderLines).toHaveLength(1);
    expect(state.inventory.get('var-1')).toMatchObject({ reserved: 2 });
    expect(state.ledger.some((row) => row.reason === 'RESERVE')).toBe(true);
  });

  it('double accept is rejected (terminal guard)', async () => {
    await submitRfq().expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14 })
      .expect(201);
    await request(app.getHttpServer()).post('/api/v1/b2b/quotes/qt-1/accept').send(ADDRESS).expect(201);
    const res = await request(app.getHttpServer()).post('/api/v1/b2b/quotes/qt-1/accept').send(ADDRESS);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('این پیش‌فاکتور قبلاً پذیرفته شده است');
  });

  it('accepting an expired quote marks it EXPIRED and rejects', async () => {
    await submitRfq().expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14 })
      .expect(201);
    // age the quote beyond validity
    const quote = state.quotes[0]!;
    quote.validUntil = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const res = await request(app.getHttpServer()).post('/api/v1/b2b/quotes/qt-1/accept').send(ADDRESS);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('پیش‌فاکتور منقضی شده است');
    expect(state.quotes[0]!.status).toBe('EXPIRED');
  });

  it('insufficient stock at accept → 409 (inventory guard rolls the conversion back)', async () => {
    await submitRfq().expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14 })
      .expect(201);
    // make the double report a failed guarded update
    (fakePrismaCore.$executeRaw as jest.Mock).mockResolvedValueOnce(0);
    const res = await request(app.getHttpServer()).post('/api/v1/b2b/quotes/qt-1/accept').send(ADDRESS);
    expect(res.status).toBe(409);
    expect(JSON.stringify(res.body.message)).toContain('موجودی');
    // The passthrough double cannot roll back state (real DB does); assert the
    // quote stayed SENT — the conversion never completed.
    expect(state.quotes[0]!.status).toBe('SENT');
  });

  // ---- N10/N12: OEM/custom lines ---------------------------------------------

  it('OEM intake requires specNote and forbids variantId (contract-level)', async () => {
    const missing = await request(app.getHttpServer())
      .post('/api/v1/b2b/rfqs')
      .send({
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        items: [{ productName: 'سفارشی: شامپو OEM', quantity: 500, itemKind: 'OEM' }],
      });
    expect(missing.status).toBe(400);
    expect(JSON.stringify(missing.body.message)).toContain('شرح فنی');

    const withVariant = await request(app.getHttpServer())
      .post('/api/v1/b2b/rfqs')
      .send({
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        items: [
          {
            productName: 'سفارشی: شامپو OEM',
            quantity: 500,
            itemKind: 'OEM',
            specNote: 'شامپو با فرمول اختصاصی و رایحه مشتری',
            variantId: 'var-1',
          },
        ],
      });
    expect(withVariant.status).toBe(400);

    const ok = await request(app.getHttpServer())
      .post('/api/v1/b2b/rfqs')
      .send({
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        items: [
          {
            productName: 'سفارشی: شامپو OEM',
            quantity: 500,
            itemKind: 'OEM',
            specNote: 'شامپو با فرمول اختصاصی و رایحه مشتری',
          },
        ],
      })
      .expect(201);
    const rfq: Rfq = RfqSchema.parse(ok.body);
    expect(rfq.items[0]?.itemKind).toBe('OEM');
    expect(rfq.items[0]?.variantId).toBeNull();
    expect(rfq.items[0]?.specNote).toContain('فرمول');
  });

  it('quoting an OEM line without oemUnitPrices is rejected', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/b2b/rfqs')
      .send({
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        items: [
          { productName: 'سفارشی: شامپو OEM', quantity: 500, itemKind: 'OEM', specNote: 'فرمول اختصاصی مشتری' },
        ],
      })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.message)).toContain('خط OEM');
  });

  it('manual price on a CATALOG line is rejected; OEM price keys must be OEM lines', async () => {
    await submitRfq().expect(201); // ritem-1 CATALOG with var-1
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14, oemUnitPrices: { 'ritem-1': 100 } });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('قیمت دستی فقط برای خطوط OEM مجاز است');
  });

  it('OEM quote prices the line from oemUnitPrices (snapshot keeps itemKind)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/b2b/rfqs')
      .send({
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        items: [
          { productName: 'سفارشی: شامپو OEM', quantity: 500, itemKind: 'OEM', specNote: 'فرمول اختصاصی مشتری' },
        ],
      })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14, oemUnitPrices: { 'ritem-1': 125_000 } })
      .expect(201);
    const quote: Quote = QuoteSchema.parse(res.body);
    const line = quote.revisions[0]?.lines[0];
    expect(line?.itemKind).toBe('OEM');
    expect(line?.variantId).toBeNull();
    expect(line?.unitPriceMinor).toBe(125_000); // operator price, not catalog
    expect(line?.lineTotalMinor).toBe(62_500_000);
    expect(quote.revisions[0]?.subtotalMinor).toBe(62_500_000);
    expect(quote.revisions[0]?.isSample).toBe(true);
  });

  it('accept of an OEM-only quote reserves NO inventory and stamps sku=OEM', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/b2b/rfqs')
      .send({
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        items: [
          { productName: 'سفارشی: شامپو OEM', quantity: 500, itemKind: 'OEM', specNote: 'فرمول اختصاصی مشتری' },
        ],
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14, oemUnitPrices: { 'ritem-1': 125_000 } })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/api/v1/b2b/quotes/qt-1/accept')
      .send(ADDRESS)
      .expect(201);
    expect(res.body.order.status).toBe('DRAFT');
    expect(res.body.order.itemCount).toBe(500);
    expect(state.orderLines[0]?.sku).toBe('OEM');
    expect(state.inventory.get('var-1')).toMatchObject({ reserved: 0 }); // untouched
    expect(state.ledger.some((row) => row.reason === 'RESERVE')).toBe(false);
  });

  it('mixed catalog+OEM quote reserves only the catalog line', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/b2b/rfqs')
      .send({
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        items: [
          { variantId: 'var-1', productName: 'سرم ویتامین C اتیریال', quantity: 2 },
          { productName: 'سفارشی: شامپو OEM', quantity: 100, itemKind: 'OEM', specNote: 'بسته‌بندی اختصاصی فروشگاه' },
        ],
      })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(auth)
      .send({ validityDays: 14, oemUnitPrices: { 'ritem-2': 90_000 } })
      .expect(201);
    const quote: Quote = QuoteSchema.parse(res.body);
    expect(quote.revisions[0]?.lines).toHaveLength(2);
    expect(quote.revisions[0]?.subtotalMinor).toBe(3_950_000 * 2 + 9_000_000);
    await request(app.getHttpServer())
      .post('/api/v1/b2b/quotes/qt-1/accept')
      .send(ADDRESS)
      .expect(201);
    expect(state.inventory.get('var-1')).toMatchObject({ reserved: 2 }); // catalog only
    expect(state.orderLines.map((line) => line.sku).sort()).toEqual(['OEM', 'RFQ']);
  });
});
