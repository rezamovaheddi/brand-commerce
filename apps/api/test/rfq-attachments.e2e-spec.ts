import { createHash } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { RfqAttachmentMetaSchema, type RfqAttachmentMeta } from '@bc/contracts';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * RFQ attachments e2e (in-memory Prisma double) — B3-lite policy matrix:
 * MIME whitelist, 512KB cap, ≤3 files per RFQ, base64 round-trip download,
 * integrity sha256, and 404 scoping (unknown rfq / foreign attachment path).
 */

interface FakeAttachmentRow {
  id: string;
  rfqId: string;
  applicationId?: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  sha256: string;
  dataBytes: Buffer;
  createdAt: Date;
}

const state = {
  rfqs: [] as Array<Record<string, unknown>>,
  applications: [] as Array<Record<string, unknown>>,
  attachments: [] as FakeAttachmentRow[],
  appAttachments: [] as FakeAttachmentRow[],
  seq: 0,
  appSeq: 0,
};

function resetState(): void {
  state.rfqs = [
    {
      id: 'rfq-1',
      status: 'SUBMITTED',
      orgId: null,
      contactName: 'آرزو کریمی',
      contactPhone: '09123456789',
      note: null,
      createdAt: new Date('2026-01-06T00:00:00.000Z'),
      items: [],
    },
  ];
  state.applications = [{ id: 'app-1' }];
  state.attachments = [];
  state.appAttachments = [];
  state.seq = 0;
  state.appSeq = 0;
}

const ADMIN_KEY = 'test-admin-key';

const fakePrismaCore = {
  $connect: async (): Promise<void> => undefined,
  $disconnect: async (): Promise<void> => undefined,
  rfq: {
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      const row = state.rfqs.find((entry) => entry.id === args?.where?.id);
      if (!row) {
        return null;
      }
      // hydrate like the real include: items + attachment metas (no bytes)
      return {
        ...row,
        attachments: state.attachments
          .filter((att) => att.rfqId === row.id)
          .map((att) => ({
            id: att.id,
            rfqId: att.rfqId,
            filename: att.filename,
            mime: att.mime,
            sizeBytes: att.sizeBytes,
            sha256: att.sha256,
            createdAt: att.createdAt,
          })),
      };
    }),
  },
  rfqAttachment: {
    count: jest.fn(async (args?: { where?: { rfqId?: string } }) => {
      return state.attachments.filter((row) => row.rfqId === args?.where?.rfqId).length;
    }),
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.seq += 1;
      const row: FakeAttachmentRow = {
        id: `att-${state.seq}`,
        rfqId: data.rfqId as string,
        filename: data.filename as string,
        mime: data.mime as string,
        sizeBytes: data.sizeBytes as number,
        sha256: data.sha256 as string,
        dataBytes: data.dataBytes as Buffer,
        createdAt: new Date('2026-01-12T00:00:00.000Z'),
      };
      state.attachments.push(row);
      return row;
    }),
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      return state.attachments.find((row) => row.id === args?.where?.id) ?? null;
    }),
  },
  b2BApplication: {
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      return state.applications.find((row) => row.id === args?.where?.id) ?? null;
    }),
  },
  applicationAttachment: {
    count: jest.fn(async (args?: { where?: { applicationId?: string } }) => {
      return state.appAttachments.filter((row) => row.applicationId === args?.where?.applicationId)
        .length;
    }),
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.appSeq += 1;
      const row: FakeAttachmentRow = {
        id: `doc-${state.appSeq}`,
        rfqId: '',
        applicationId: data.applicationId as string,
        filename: data.filename as string,
        mime: data.mime as string,
        sizeBytes: data.sizeBytes as number,
        sha256: data.sha256 as string,
        dataBytes: data.dataBytes as Buffer,
        createdAt: new Date('2026-01-13T00:00:00.000Z'),
      };
      state.appAttachments.push(row);
      return row;
    }),
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      return state.appAttachments.find((row) => row.id === args?.where?.id) ?? null;
    }),
  },
};

const fakePrisma = {
  ...fakePrismaCore,
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
    fn(fakePrismaCore as unknown),
} as unknown as PrismaService;

describe('RFQ attachments (e2e, in-memory Prisma)', () => {
  let app: INestApplication;

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

  const upload = (body: Record<string, unknown>, rfqId = 'rfq-1') =>
    request(app.getHttpServer()).post(`/api/v1/b2b/rfqs/${rfqId}/attachments`).send(body);

  const PDF = (bytes: number): { filename: string; mime: string; contentBase64: string } => ({
    filename: 'spec.pdf',
    mime: 'application/pdf',
    contentBase64: Buffer.alloc(bytes, 0x25).toString('base64'),
  });

  it('uploads an attachment and returns metadata without the bytes', async () => {
    const payload = PDF(1024);
    const res = await upload(payload).expect(201);
    const meta: RfqAttachmentMeta = RfqAttachmentMetaSchema.parse(res.body);
    expect(meta.rfqId).toBe('rfq-1');
    expect(meta.sizeBytes).toBe(1024);
    expect(meta.sha256).toBe(createHash('sha256').update(Buffer.from(payload.contentBase64, 'base64')).digest('hex'));
    expect(JSON.stringify(res.body)).not.toContain('contentBase64');
    expect(JSON.stringify(res.body)).not.toContain('dataBytes');
  });

  it('downloads the exact uploaded bytes with the right content type', async () => {
    const payload = { filename: 'مشخصات.png', mime: 'image/png', contentBase64: Buffer.from([1, 2, 3, 4, 250]).toString('base64') };
    const created = await upload(payload).expect(201);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/b2b/rfqs/rfq-1/attachments/${created.body.id}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(Buffer.from(res.body as Buffer)).toEqual(Buffer.from(payload.contentBase64, 'base64'));
  });

  it('rejects a non-whitelisted MIME type', async () => {
    const res = await upload({ ...PDF(64), mime: 'application/zip' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('فقط PDF، PNG یا JPEG پذیرفته می‌شود');
  });

  it('rejects files above the 512KB cap', async () => {
    const res = await upload(PDF(512 * 1024 + 1));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('حجم فایل بیش از حد مجاز (۵۱۲ کیلوبایت) است');
  });

  it('rejects invalid/empty base64 content', async () => {
    const res = await upload({ filename: 'x.pdf', mime: 'application/pdf', contentBase64: '!!!!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('محتوای فایل خالی یا base64 نامعتبر است');
  });

  it('enforces the 3-attachment cap per RFQ', async () => {
    await upload(PDF(64)).expect(201);
    await upload({ ...PDF(64), filename: 'b.pdf' }).expect(201);
    await upload({ ...PDF(64), filename: 'c.pdf' }).expect(201);
    const res = await upload({ ...PDF(64), filename: 'd.pdf' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('حداکثر ۳ پیوست برای هر درخواست قیمت مجاز است');
  });

  it('rejects path-like filenames before any write', async () => {
    const res = await upload({ ...PDF(64), filename: '../evil.pdf' });
    expect(res.status).toBe(400);
    expect(state.attachments).toHaveLength(0);
  });

  it('404 for an unknown RFQ', async () => {
    await upload(PDF(64), 'rfq-unknown').expect(404);
  });

  it('404 for a download whose attachment is not on that RFQ', async () => {
    const created = await upload(PDF(64)).expect(201);
    await request(app.getHttpServer())
      .get(`/api/v1/b2b/rfqs/rfq-other/attachments/${created.body.id}`)
      .expect(404);
    await request(app.getHttpServer())
      .get('/api/v1/b2b/rfqs/rfq-1/attachments/att-unknown')
      .expect(404);
  });

  it('upload for a non-existent RFQ never creates rows (admin view stays empty)', async () => {
    await upload(PDF(64), 'rfq-unknown').expect(404);
    const list = await request(app.getHttpServer())
      .get('/api/v1/b2b/rfqs/rfq-1')
      .expect(200);
    // rfq-1 exists with zero attachments — public Rfq view includes metas
    expect(list.body.attachments).toEqual([]);
  });

  // ---- B3: application (license/permit) documents -----------------------------

  const uploadDoc = (body: Record<string, unknown>, applicationId = 'app-1') =>
    request(app.getHttpServer())
      .post(`/api/v1/b2b/applications/${applicationId}/attachments`)
      .send(body);

  it('uploads a license document to an application (meta without bytes)', async () => {
    const res = await uploadDoc({ ...PDF(512), filename: 'business-license.pdf' }).expect(201);
    expect(res.body.applicationId).toBe('app-1');
    expect(res.body.sizeBytes).toBe(512);
    expect(JSON.stringify(res.body)).not.toContain('contentBase64');
    expect(JSON.stringify(res.body)).not.toContain('dataBytes');
  });

  it('enforces the 3-document cap per application', async () => {
    await uploadDoc({ ...PDF(64), filename: 'a.pdf' }).expect(201);
    await uploadDoc({ ...PDF(64), filename: 'b.pdf' }).expect(201);
    await uploadDoc({ ...PDF(64), filename: 'c.pdf' }).expect(201);
    const res = await uploadDoc({ ...PDF(64), filename: 'd.pdf' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('حداکثر ۳ مدرک برای هر درخواست همکاری مجاز است');
  });

  it('downloads an application document with matching bytes', async () => {
    const payload = { filename: 'permit.png', mime: 'image/png', contentBase64: Buffer.from([9, 8, 7, 6]).toString('base64') };
    const created = await uploadDoc(payload).expect(201);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/b2b/applications/app-1/attachments/${created.body.id}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(Buffer.from(res.body as Buffer)).toEqual(Buffer.from(payload.contentBase64, 'base64'));
  });

  it('404 for unknown application or mismatched document path', async () => {
    await uploadDoc(PDF(64), 'app-unknown').expect(404);
    const created = await uploadDoc(PDF(64)).expect(201);
    await request(app.getHttpServer())
      .get(`/api/v1/b2b/applications/app-other/attachments/${created.body.id}`)
      .expect(404);
    await request(app.getHttpServer())
      .get('/api/v1/b2b/applications/app-1/attachments/doc-unknown')
      .expect(404);
  });
});
