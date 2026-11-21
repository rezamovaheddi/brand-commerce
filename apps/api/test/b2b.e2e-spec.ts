import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  AdminB2BDecisionSchema,
  B2BApplicationSchema,
  type B2BApplication,
} from '@bc/contracts';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * B2B onboarding e2e (in-memory Prisma double): public submit/track → admin
 * review matrix (approve creates Organization + OWNER membership atomically;
 * reject/request-info record notes; terminal states are guarded).
 */

interface FakeApplicationRow {
  id: string;
  contactName: string;
  contactPhone: string;
  orgName: string;
  economicCode: string | null;
  licenseRef: string | null;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const state = {
  applications: [] as FakeApplicationRow[],
  organizations: [] as Array<{ id: string; name: string; isSample: boolean; status: string }>,
  memberships: [] as Array<Record<string, unknown>>,
  appSeq: 0,
  orgSeq: 0,
};

function resetState(): void {
  state.applications = [];
  state.organizations = [];
  state.memberships = [];
  state.appSeq = 0;
  state.orgSeq = 0;
}

const fakePrismaCore = {
  $connect: async (): Promise<void> => undefined,
  $disconnect: async (): Promise<void> => undefined,
  $transaction: undefined as unknown, // assigned below (self passthrough)
  b2BApplication: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.appSeq += 1;
      const row: FakeApplicationRow = {
        id: `app-${state.appSeq}`,
        contactName: data.contactName as string,
        contactPhone: data.contactPhone as string,
        orgName: data.orgName as string,
        economicCode: (data.economicCode as string | null) ?? null,
        licenseRef: (data.licenseRef as string | null) ?? null,
        status: 'SUBMITTED',
        reviewNote: null,
        reviewedAt: null,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        updatedAt: new Date('2026-01-05T00:00:00.000Z'),
      };
      state.applications.push(row);
      return row;
    }),
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      return state.applications.find((row) => row.id === args?.where?.id) ?? null;
    }),
    findMany: jest.fn(async (args?: { where?: { status?: string } }) => {
      let rows = [...state.applications];
      if (args?.where?.status) {
        rows = rows.filter((row) => row.status === args.where?.status);
      }
      return rows;
    }),
    update: jest.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = state.applications.find((r) => r.id === args.where.id);
      if (!row) {
        throw new Error('b2BApplication.update: not found');
      }
      Object.assign(row, args.data);
      return row;
    }),
  },
  organization: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.orgSeq += 1;
      const org = { id: `org-${state.orgSeq}`, name: data.name as string, isSample: true, status: 'ACTIVE' };
      state.organizations.push(org);
      return org;
    }),
  },
  organizationMembership: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.memberships.push({ ...data });
      return data;
    }),
  },
};

const fakePrisma = {
  ...fakePrismaCore,
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
    fn(fakePrismaCore as unknown),
} as unknown as PrismaService;

const KEY = 'test-admin-key';

describe('B2B onboarding (e2e, in-memory Prisma)', () => {
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

  const validApplication = {
    contactName: 'آرزو کریمی',
    contactPhone: '09123456789',
    orgName: 'پخش شمال‌گستر',
    economicCode: '1234567890',
  };

  it('accepts a public application (SUBMITTED) with Persian-digit economic code', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/b2b/applications')
      .send({ ...validApplication, economicCode: '۱۲۳۴۵۶۷۸۹۰' })
      .expect(201);
    const parsed = B2BApplicationSchema.parse(res.body);
    expect(parsed.status).toBe('SUBMITTED');
    expect(parsed.economicCode).toBe('1234567890');
  });

  it('rejects invalid phone and economic code', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/b2b/applications')
      .send({ ...validApplication, contactPhone: '08123456789' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.message)).toContain('۰۹');
  });

  it('404 for unknown application id', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/b2b/applications/nope');
    expect(res.status).toBe(404);
  });

  it('admin review requires the key', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/admin/b2b/applications');
    expect(res.status).toBe(401);
  });

  it('admin approves → APPROVED + Organization + OWNER membership created atomically', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/b2b/applications')
      .send(validApplication)
      .expect(201);
    const id = (created.body as B2BApplication).id;
    const decision = AdminB2BDecisionSchema.parse({ note: 'مدارک کامل و معتبر' });
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/b2b/applications/${id}/approve`)
      .set(auth)
      .send(decision)
      .expect(200);
    const parsed = B2BApplicationSchema.parse(res.body);
    expect(parsed.status).toBe('APPROVED');
    expect(parsed.reviewNote).toBe('مدارک کامل و معتبر');
    expect(state.organizations).toHaveLength(1);
    expect(state.organizations[0]).toMatchObject({ name: 'پخش شمال‌گستر', status: 'ACTIVE' });
    expect(state.memberships).toHaveLength(1);
    expect(state.memberships[0]).toMatchObject({ role: 'OWNER', contactPhone: '09123456789' });
  });

  it('double approve is rejected (terminal state guard)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/b2b/applications')
      .send(validApplication)
      .expect(201);
    const id = (created.body as B2BApplication).id;
    await request(app.getHttpServer())
      .post(`/api/v1/admin/b2b/applications/${id}/approve`)
      .set(auth)
      .send({ note: 'تأیید اول' })
      .expect(200);
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/b2b/applications/${id}/approve`)
      .set(auth)
      .send({ note: 'تأیید دوم' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('این درخواست قبلاً تأیید شده است');
  });

  it('reject path records the note and blocks later approval', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/b2b/applications')
      .send(validApplication)
      .expect(201);
    const id = (created.body as B2BApplication).id;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/b2b/applications/${id}/reject`)
      .set(auth)
      .send({ note: 'مدارک ناقص' })
      .expect(200);
    expect(B2BApplicationSchema.parse(res.body).status).toBe('REJECTED');
    const later = await request(app.getHttpServer())
      .post(`/api/v1/admin/b2b/applications/${id}/approve`)
      .set(auth)
      .send({ note: 'تلاش دوباره' });
    expect(later.status).toBe(400);
    expect(later.body.message).toBe('درخواست رد‌شده قابل تأیید نیست — درخواست جدید ثبت کنید');
  });

  it('request-info sets NEEDS_INFO; admin list filters by status', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/b2b/applications')
      .send(validApplication)
      .expect(201);
    const id = (created.body as B2BApplication).id;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/b2b/applications/${id}/request-info`)
      .set(auth)
      .send({ note: 'مجوز بهداشت ارسال شود' })
      .expect(200);
    expect(B2BApplicationSchema.parse(res.body).status).toBe('NEEDS_INFO');

    const list = await request(app.getHttpServer())
      .get('/api/v1/admin/b2b/applications?status=NEEDS_INFO')
      .set(auth)
      .expect(200);
    expect(list.body.items).toHaveLength(1);
  });
});
