import { createHash } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { OrgMemberSchema, OrgMeSchema, QuoteSchema, RfqSchema, type Rfq } from '@bc/contracts';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * N16 org access e2e (in-memory Prisma double). MANDATORY cross-org matrix:
 * guard (missing/invalid/revoked key, suspended org), role enforcement
 * (ACCOUNTANT is finance-only), org scoping of RFQ reads/accepts, and the
 * admin member/keys lifecycle (issue → one-time plaintext → revoke → rotate).
 */

interface FakeOrgRow {
  id: string;
  name: string;
  isSample: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
}

interface FakeMemberRow {
  id: string;
  organizationId: string;
  contactName: string;
  contactPhone: string;
  email: string | null;
  role: 'OWNER' | 'BUYER' | 'ACCOUNTANT';
  keyHash: string | null;
  keyLast4: string | null;
  keyRevokedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface FakeRfqItemRow {
  id: string;
  rfqId: string;
  variantId: string | null;
  productName: string;
  quantity: number;
  note: string | null;
}

interface FakeRfqRow {
  id: string;
  status: 'SUBMITTED' | 'PRICED' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'CLOSED';
  orgId: string | null;
  contactName: string;
  contactPhone: string;
  note: string | null;
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

const sha = (plaintext: string): string => createHash('sha256').update(plaintext).digest('hex');

const KEY_A1 = `dvorg_${'a'.repeat(32)}`; // org-a BUYER
const KEY_A2 = `dvorg_${'b'.repeat(32)}`; // org-a ACCOUNTANT
const KEY_B1 = `dvorg_${'c'.repeat(32)}`; // org-b BUYER
const KEY_A3 = `dvorg_${'d'.repeat(32)}`; // org-a revoked member

const VARIANTS: Record<string, { id: string; sku: string; priceMinor: number; status: 'ACTIVE' | 'ARCHIVED'; productId: string }> = {
  'var-1': { id: 'var-1', sku: 'DMV-SRM-30C', priceMinor: 3_950_000, status: 'ACTIVE', productId: 'prd-1' },
};

const PRODUCTS: Record<string, { status: 'ACTIVE'; nameFa: string }> = {
  'prd-1': { status: 'ACTIVE', nameFa: 'سرم ویتامین C اتیریال' },
};

const state = {
  orgs: [] as FakeOrgRow[],
  members: [] as FakeMemberRow[],
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
  memberSeq: 0,
};

function seedBase(): void {
  state.orgs = [
    { id: 'org-a', name: 'پخش سلامت پویا', isSample: true, status: 'ACTIVE', createdAt: new Date('2026-01-01T00:00:00.000Z') },
    { id: 'org-b', name: 'آرایشی آرمان', isSample: true, status: 'ACTIVE', createdAt: new Date('2026-01-01T01:00:00.000Z') },
  ];
  state.members = [
    {
      id: 'mem-a1',
      organizationId: 'org-a',
      contactName: 'خریدار پویا',
      contactPhone: '09121110001',
      email: 'buyer@orga.test',
      role: 'BUYER',
      keyHash: sha(KEY_A1),
      keyLast4: KEY_A1.slice(-4),
      keyRevokedAt: null,
      lastUsedAt: null,
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    },
    {
      id: 'mem-a2',
      organizationId: 'org-a',
      contactName: 'حسابدار پویا',
      contactPhone: '09121110002',
      email: 'acc@orga.test',
      role: 'ACCOUNTANT',
      keyHash: sha(KEY_A2),
      keyLast4: KEY_A2.slice(-4),
      keyRevokedAt: null,
      lastUsedAt: null,
      createdAt: new Date('2026-01-02T00:01:00.000Z'),
    },
    {
      id: 'mem-a3',
      organizationId: 'org-a',
      contactName: 'عضو باطل‌شده',
      contactPhone: '09121110003',
      email: 'revoked@orga.test',
      role: 'BUYER',
      keyHash: sha(KEY_A3),
      keyLast4: KEY_A3.slice(-4),
      keyRevokedAt: new Date('2026-01-03T00:00:00.000Z'),
      lastUsedAt: null,
      createdAt: new Date('2026-01-02T00:02:00.000Z'),
    },
    {
      id: 'mem-b1',
      organizationId: 'org-b',
      contactName: 'خریدار آرمان',
      contactPhone: '09122220001',
      email: 'buyer@orgb.test',
      role: 'BUYER',
      keyHash: sha(KEY_B1),
      keyLast4: KEY_B1.slice(-4),
      keyRevokedAt: null,
      lastUsedAt: null,
      createdAt: new Date('2026-01-02T01:00:00.000Z'),
    },
  ];
}

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
  seedBase();
}

const hydrateRfq = (rfq: FakeRfqRow): FakeRfqRow => ({
  ...rfq,
  items: state.rfqItems.filter((item) => item.rfqId === rfq.id),
  quote: state.quotes.find((quote) => quote.rfqId === rfq.id) ?? null,
});

const hydrateQuote = (quote: FakeQuoteRow): FakeQuoteRow & { rfq: { orgId: string | null } } => {
  const rfq = state.rfqs.find((row) => row.id === quote.rfqId);
  return {
    ...quote,
    revisions: state.revisions
      .filter((revision) => revision.quoteId === quote.id)
      .sort((a, b) => a.revisionNo - b.revisionNo) as unknown as Array<Record<string, unknown>>,
    rfq: { orgId: rfq?.orgId ?? null },
  };
};

const fakePrismaCore = {
  $connect: async (): Promise<void> => undefined,
  $disconnect: async (): Promise<void> => undefined,
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
    return 1;
  }),
  organization: {
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      return state.orgs.find((row) => row.id === args?.where?.id) ?? null;
    }),
    findMany: jest.fn(async () =>
      state.orgs.map((row) => ({
        ...row,
        _count: { members: state.members.filter((member) => member.organizationId === row.id).length },
      })),
    ),
  },
  organizationMembership: {
    findUnique: jest.fn(
      async (args?: { where?: { keyHash?: string; id?: string } }) => {
        if (args?.where?.keyHash !== undefined) {
          const member = state.members.find((row) => row.keyHash === args.where?.keyHash);
          if (!member) {
            return null;
          }
          const org = state.orgs.find((row) => row.id === member.organizationId);
          return { ...member, organization: org ? { ...org } : null };
        }
        return state.members.find((row) => row.id === args?.where?.id) ?? null;
      },
    ),
    findMany: jest.fn(async (args?: { where?: { organizationId?: string } }) => {
      return state.members.filter((row) => row.organizationId === args?.where?.organizationId);
    }),
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const email = data.email as string | null;
      if (
        email !== null &&
        state.members.some((row) => row.organizationId === data.organizationId && row.email === email)
      ) {
        throw new Prisma.PrismaClientKnownRequestError('dup email', {
          code: 'P2002',
          clientVersion: 'test',
        });
      }
      if (
        state.members.some(
          (row) =>
            row.organizationId === data.organizationId &&
            row.contactPhone === data.contactPhone &&
            row.role === data.role,
        )
      ) {
        throw new Prisma.PrismaClientKnownRequestError('dup phone+role', {
          code: 'P2002',
          clientVersion: 'test',
        });
      }
      state.memberSeq += 1;
      const member: FakeMemberRow = {
        id: `mem-new-${state.memberSeq}`,
        organizationId: data.organizationId as string,
        contactName: data.contactName as string,
        contactPhone: data.contactPhone as string,
        email: (data.email as string | null) ?? null,
        role: (data.role as FakeMemberRow['role']) ?? 'BUYER',
        keyHash: (data.keyHash as string | null) ?? null,
        keyLast4: (data.keyLast4 as string | null) ?? null,
        keyRevokedAt: null,
        lastUsedAt: null,
        createdAt: new Date('2026-01-10T00:00:00.000Z'),
      };
      state.members.push(member);
      return member;
    }),
    update: jest.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
      const member = state.members.find((row) => row.id === args.where.id);
      if (!member) {
        throw new Error('membership.update: not found');
      }
      Object.assign(member, args.data);
      return member;
    }),
  },
  rfq: {
    create: jest.fn(async ({ data }: { data: { items: { create: Array<Record<string, unknown>> } } & Record<string, unknown> }) => {
      state.rfqSeq += 1;
      const rfq: FakeRfqRow = {
        id: `rfq-${state.rfqSeq}`,
        status: 'SUBMITTED',
        orgId: (data.orgId as string | null) ?? null,
        contactName: data.contactName as string,
        contactPhone: data.contactPhone as string,
        note: (data.note as string | null) ?? null,
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
        });
      }
      return hydrateRfq(rfq);
    }),
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      const rfq = state.rfqs.find((row) => row.id === args?.where?.id);
      return rfq ? hydrateRfq(rfq) : null;
    }),
    findMany: jest.fn(async (args?: { where?: { status?: string; orgId?: string } }) => {
      let rows = [...state.rfqs];
      if (args?.where?.status) {
        rows = rows.filter((row) => row.status === args.where?.status);
      }
      if (args?.where?.orgId !== undefined) {
        rows = rows.filter((row) => row.orgId === args.where?.orgId);
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
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      const quote = state.quotes.find((row) => row.id === args?.where?.id);
      return quote ? hydrateQuote(quote) : null;
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
  inventoryLedger: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.ledger.push({ id: `led-${state.ledger.length + 1}`, createdAt: new Date(), ...data });
      return data;
    }),
  },
};

const fakePrisma = {
  ...fakePrismaCore,
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
    fn(fakePrismaCore as unknown),
} as unknown as PrismaService;

const ADMIN_KEY = 'test-admin-key';
const ADDRESS = {
  fullName: 'آرزو کریمی',
  phone: '09123456789',
  province: 'تهران',
  city: 'تهران',
  postalCode: '1234567890',
  addressLine: 'خیابان ولیعصر، پلاک ۱۲',
};

describe('N16 org access (e2e, in-memory Prisma)', () => {
  let app: INestApplication;
  const admin = { 'x-admin-key': ADMIN_KEY };

  beforeAll(async () => {
    process.env.ADMIN_API_KEY = ADMIN_KEY;
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

  const orgSubmit = (key: string, quantity = 2) =>
    request(app.getHttpServer())
      .post('/api/v1/b2b/org/rfqs')
      .set('x-org-key', key)
      .send({
        contactName: 'خریدار پویا',
        contactPhone: '09121110001',
        items: [{ variantId: 'var-1', productName: 'سرم ویتامین C اتیریال', quantity }],
      });

  // ---- guard matrix ----------------------------------------------------------

  it('rejects org endpoints without a key (401)', async () => {
    await request(app.getHttpServer()).get('/api/v1/b2b/org/me').expect(401);
  });

  it('rejects an unknown key (401)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/b2b/org/me')
      .set('x-org-key', `dvorg_${'e'.repeat(32)}`);
    expect(res.status).toBe(401);
  });

  it('rejects a revoked key (403)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/b2b/org/me')
      .set('x-org-key', KEY_A3);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('این کلید سازمانی باطل شده است');
  });

  it('rejects keys of a suspended organization (403)', async () => {
    const org = state.orgs.find((row) => row.id === 'org-b');
    if (org) {
      org.status = 'SUSPENDED';
    }
    const res = await request(app.getHttpServer())
      .get('/api/v1/b2b/org/me')
      .set('x-org-key', KEY_B1);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('سازمان شما تعلیق شده است');
  });

  it('me returns the organization identity of the key', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/b2b/org/me')
      .set('x-org-key', KEY_A1)
      .expect(200);
    const me = OrgMeSchema.parse(res.body);
    expect(me.organizationId).toBe('org-a');
    expect(me.organizationName).toBe('پخش سلامت پویا');
    expect(me.role).toBe('BUYER');
    expect(me.memberName).toBe('خریدار پویا');
    expect(me.isSample).toBe(true);
  });

  // ---- admin member/keys lifecycle -------------------------------------------

  it('admin creates a member and returns the plaintext key exactly once', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/orgs/org-a/members')
      .set(admin)
      .send({
        contactName: 'عضو تازه',
        contactPhone: '09121119999',
        email: 'new-buyer@orga.test',
        role: 'BUYER',
      })
      .expect(201);
    expect(res.body.accessKey).toMatch(/^dvorg_[0-9a-f]{32}$/);
    expect(res.body.hasKey).toBe(true);
    expect(res.body.keyLast4).toBe(res.body.accessKey.slice(-4));
    // plaintext never persisted: stored hash differs from plaintext
    const stored = state.members.find((row) => row.email === 'new-buyer@orga.test');
    expect(stored?.keyHash).toBeDefined();
    expect(stored?.keyHash).not.toBe(res.body.accessKey);
    // the returned key works immediately
    await request(app.getHttpServer())
      .get('/api/v1/b2b/org/me')
      .set('x-org-key', res.body.accessKey)
      .expect(200);
  });

  it('duplicate member (same email in the same org) is 409', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/orgs/org-a/members')
      .set(admin)
      .send({
        contactName: 'تکراری',
        contactPhone: '09121118888',
        email: 'buyer@orga.test',
        role: 'BUYER',
      })
      .expect(409);
  });

  it('admin org list shows member counts; member list never exposes hashes', async () => {
    const orgs = await request(app.getHttpServer())
      .get('/api/v1/admin/b2b/orgs')
      .set(admin)
      .expect(200);
    const a = (orgs.body.items as Array<{ id: string; memberCount: number }>).find((row) => row.id === 'org-a');
    expect(a?.memberCount).toBe(3);
    const members = await request(app.getHttpServer())
      .get('/api/v1/admin/b2b/orgs/org-a/members')
      .set(admin)
      .expect(200);
    const rows = (members.body.items as Array<Record<string, unknown>>).map((row) =>
      OrgMemberSchema.parse(row),
    );
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(JSON.stringify(row)).not.toContain('keyHash');
    }
  });

  // ---- org-scoped RFQs + mandatory cross-org matrix ---------------------------

  it('org RFQ submit binds orgId; ACCOUNTANT is forbidden (role rule)', async () => {
    const res = await orgSubmit(KEY_A1).expect(201);
    const rfq: Rfq = RfqSchema.parse(res.body);
    expect(rfq.orgId).toBe('org-a');
    const denied = await orgSubmit(KEY_A2);
    expect(denied.status).toBe(403);
    // denied call must not have created anything
    expect(state.rfqs).toHaveLength(1);
  });

  it('org RFQ list is scoped to the caller’s organization (N16 mandatory)', async () => {
    await orgSubmit(KEY_A1).expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/b2b/org/rfqs')
      .set('x-org-key', KEY_B1)
      .send({
        contactName: 'خریدار آرمان',
        contactPhone: '09122220001',
        items: [{ variantId: 'var-1', productName: 'سرم', quantity: 5 }],
      })
      .expect(201);
    const res = await request(app.getHttpServer())
      .get('/api/v1/b2b/org/rfqs')
      .set('x-org-key', KEY_A1)
      .expect(200);
    const items = (res.body.items as Rfq[]).map((row) => RfqSchema.parse(row));
    expect(items).toHaveLength(1);
    expect(items[0]?.orgId).toBe('org-a');
  });

  it('cross-org RFQ read is 404 — no existence leak (N16 mandatory)', async () => {
    await orgSubmit(KEY_B1).expect(201); // rfq-1 belongs to org-b
    const res = await request(app.getHttpServer())
      .get('/api/v1/b2b/org/rfqs/rfq-1')
      .set('x-org-key', KEY_A1);
    expect(res.status).toBe(404);
    // own-org read works
    await request(app.getHttpServer())
      .get('/api/v1/b2b/org/rfqs/rfq-1')
      .set('x-org-key', KEY_B1)
      .expect(200);
  });

  it('cross-org quote accept is 404; ACCOUNTANT accept is 403; buyer accept creates the order', async () => {
    await orgSubmit(KEY_A1).expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/rfqs/rfq-1/quote')
      .set(admin)
      .send({ validityDays: 14 })
      .expect(201);
    // org-b member cannot even see org-a's quote (404, no leak)
    const cross = await request(app.getHttpServer())
      .post('/api/v1/b2b/org/quotes/qt-1/accept')
      .set('x-org-key', KEY_B1)
      .send(ADDRESS);
    expect(cross.status).toBe(404);
    // accountant is forbidden by role (403)
    const acc = await request(app.getHttpServer())
      .post('/api/v1/b2b/org/quotes/qt-1/accept')
      .set('x-org-key', KEY_A2)
      .send(ADDRESS);
    expect(acc.status).toBe(403);
    expect(state.orders).toHaveLength(0);
    // buyer accept → real order + reservation
    const res = await request(app.getHttpServer())
      .post('/api/v1/b2b/org/quotes/qt-1/accept')
      .set('x-org-key', KEY_A1)
      .send(ADDRESS)
      .expect(201);
    expect(res.body.order.status).toBe('DRAFT');
    expect(QuoteSchema.parse(res.body.quote).status).toBe('ACCEPTED');
    expect(state.inventory.get('var-1')).toMatchObject({ reserved: 2 });
    expect(state.ledger.some((row) => row.reason === 'RESERVE')).toBe(true);
    // after accept the quote is no longer SENT — a foreign org must STILL see
    // 404 (not the 400 'already accepted' leak)
    const leak = await request(app.getHttpServer())
      .post('/api/v1/b2b/org/quotes/qt-1/accept')
      .set('x-org-key', KEY_B1)
      .send(ADDRESS);
    expect(leak.status).toBe(404);
    // own org buyer now gets the honest 400 (already accepted)
    const own = await request(app.getHttpServer())
      .post('/api/v1/b2b/org/quotes/qt-1/accept')
      .set('x-org-key', KEY_A1)
      .send(ADDRESS);
    expect(own.status).toBe(400);
    expect(own.body.message).toBe('این پیش‌فاکتور قبلاً پذیرفته شده است');
  });

  it('admin RFQ list exposes orgId for org-bound RFQs', async () => {
    await orgSubmit(KEY_A1).expect(201);
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/b2b/rfqs')
      .set(admin)
      .expect(200);
    const items = res.body.items as Array<{ id: string; orgId: string | null }>;
    expect(items[0]?.orgId).toBe('org-a');
  });

  // ---- revoke + rotate ---------------------------------------------------------

  it('revoke kills the key immediately; double revoke is 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/members/mem-a1/revoke')
      .set(admin)
      .expect(200);
    const res = await request(app.getHttpServer())
      .get('/api/v1/b2b/org/me')
      .set('x-org-key', KEY_A1);
    expect(res.status).toBe(403);
    await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/members/mem-a1/revoke')
      .set(admin)
      .expect(400);
  });

  it('re-issuing a key invalidates the old one and un-revokes the member', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/members/mem-a1/revoke')
      .set(admin)
      .expect(200);
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/b2b/members/mem-a1/key')
      .set(admin)
      .expect(201);
    expect(res.body.accessKey).toMatch(/^dvorg_[0-9a-f]{32}$/);
    expect(res.body.accessKey).not.toBe(KEY_A1);
    // old key no longer resolves → 401
    await request(app.getHttpServer())
      .get('/api/v1/b2b/org/me')
      .set('x-org-key', KEY_A1)
      .expect(401);
    // new key works
    await request(app.getHttpServer())
      .get('/api/v1/b2b/org/me')
      .set('x-org-key', res.body.accessKey)
      .expect(200);
  });
});
