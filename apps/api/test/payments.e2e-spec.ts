import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createHmac } from 'node:crypto';
import { PayOrderResponseSchema, PaymentSchema, type Payment } from '@bc/contracts';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Payments API e2e (in-memory Prisma double) — the SANDBOX adapter: state
 * machine guards, HMAC webhook verification, idempotency and refunds. The
 * double implements $transaction passthrough and only the methods the modules
 * touch (order find/update, payment find/create/update).
 */

interface FakeOrderRow {
  id: string;
  status: 'DRAFT' | 'CANCELLED' | 'AWAITING_PAYMENT' | 'PAID' | 'REFUNDED';
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

interface FakePaymentRow {
  id: string;
  orderId: string;
  amountMinor: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  provider: string;
  isSandbox: boolean;
  idempotencyKey: string | null;
  createdAt: Date;
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
  lines: [],
};

const state = {
  orders: [] as FakeOrderRow[],
  payments: [] as FakePaymentRow[],
  orderSeq: 0,
  paymentSeq: 0,
};

function resetState(sandboxMode: string): void {
  const clone = JSON.parse(JSON.stringify(ORDER)) as FakeOrderRow;
  state.orders = [{ ...clone, createdAt: new Date(clone.createdAt) }];
  state.payments = [];
  state.orderSeq = 0;
  state.paymentSeq = 0;
  process.env.PAYMENT_SANDBOX_MODE = sandboxMode;
  process.env.PAYMENT_SANDBOX_SECRET = 'test-secret';
}

const fakePrismaCore = {
  $connect: async (): Promise<void> => undefined,
  $disconnect: async (): Promise<void> => undefined,
  order: {
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      return state.orders.find((o) => o.id === args?.where?.id) ?? null;
    }),
    update: jest.fn(async (args: { where: { id: string }; data: { status: string } }) => {
      const row = state.orders.find((o) => o.id === args.where.id);
      if (!row) {
        throw new Error('order.update: not found');
      }
      row.status = args.data.status as FakeOrderRow['status'];
      return row;
    }),
  },
  payment: {
    findUnique: jest.fn(async (args?: { where?: { id?: string; idempotencyKey?: string } }) => {
      const w = args?.where;
      if (!w) {
        return null;
      }
      const row = state.payments.find(
        (p) => (w.id !== undefined && p.id === w.id) || (w.idempotencyKey !== undefined && p.idempotencyKey === w.idempotencyKey),
      );
      return row ?? null;
    }),
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.paymentSeq += 1;
      const row: FakePaymentRow = {
        id: `pay-${state.paymentSeq}`,
        orderId: data.orderId as string,
        amountMinor: data.amountMinor as number,
        currency: data.currency as string,
        status: 'PENDING',
        provider: 'sandbox',
        isSandbox: true,
        idempotencyKey: (data.idempotencyKey as string | null) ?? null,
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
      };
      state.payments.push(row);
      return row;
    }),
    update: jest.fn(async (args: { where: { id: string }; data: { status: string } }) => {
      const row = state.payments.find((p) => p.id === args.where.id);
      if (!row) {
        throw new Error('payment.update: not found');
      }
      row.status = args.data.status as FakePaymentRow['status'];
      return row;
    }),
  },
};

const fakePrisma = {
  ...fakePrismaCore,
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
    fn(fakePrismaCore as unknown),
} as unknown as PrismaService;

const sandboxSignature = (paymentId: string, result: string, secret = 'test-secret'): string =>
  createHmac('sha256', secret).update(`${paymentId}.${result}`).digest('hex');

describe('Payments API (e2e, in-memory Prisma — SANDBOX)', () => {
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
    resetState('true');
    jest.clearAllMocks();
  });

  const pay = (orderId: string, key?: string) =>
    request(app.getHttpServer())
      .post(`/api/v1/payments/orders/${orderId}/pay`)
      .set(key ? { 'x-idempotency-key': key } : {});

  it('creates a sandbox payment for a DRAFT order and moves it to AWAITING_PAYMENT', async () => {
    const res = await pay('ord-1').expect(201);
    const parsed = PayOrderResponseSchema.parse(res.body);
    expect(parsed.payment.isSandbox).toBe(true);
    expect(parsed.payment.status).toBe('PENDING');
    expect(parsed.payment.amountMinor).toBe(4_500_000);
    expect(parsed.order.status).toBe('AWAITING_PAYMENT');
    expect(parsed.payment.provider).toBe('sandbox');
  });

  it('is idempotent per x-idempotency-key (same payment returned, no state change)', async () => {
    const first = await pay('ord-1', 'idem-1').expect(201);
    const second = await pay('ord-1', 'idem-1').expect(201);
    expect(second.body.payment.id).toBe(first.body.payment.id);
    expect(state.payments).toHaveLength(1);
  });

  it('rejects paying a CANCELLED order (state machine)', async () => {
    state.orders[0]!.status = 'CANCELLED';
    const res = await pay('ord-1');
    expect(res.status).toBe(400);
  });

  it('rejects a callback with a wrong HMAC signature', async () => {
    const created = await pay('ord-1').expect(201);
    const paymentId = (created.body as { payment: Payment }).payment.id;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/payments/${paymentId}/callback`)
      .send({ result: 'succeeded', signature: '0'.repeat(64) });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('امضای درگاه معتبر نیست');
  });

  it('succeeded callback → payment SUCCEEDED + order PAID (real HMAC path)', async () => {
    const created = await pay('ord-1').expect(201);
    const paymentId = (created.body as { payment: Payment }).payment.id;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/payments/${paymentId}/callback`)
      .send({ result: 'succeeded', signature: sandboxSignature(paymentId, 'succeeded') })
      .expect(200);
    const payment: Payment = PaymentSchema.parse(res.body);
    expect(payment.status).toBe('SUCCEEDED');
    expect(state.orders[0]!.status).toBe('PAID');
  });

  it('replays the same terminal callback idempotently', async () => {
    const created = await pay('ord-1').expect(201);
    const paymentId = (created.body as { payment: Payment }).payment.id;
    const sig = sandboxSignature(paymentId, 'succeeded');
    await request(app.getHttpServer())
      .post(`/api/v1/payments/${paymentId}/callback`)
      .send({ result: 'succeeded', signature: sig })
      .expect(200);
    const again = await request(app.getHttpServer())
      .post(`/api/v1/payments/${paymentId}/callback`)
      .send({ result: 'succeeded', signature: sig })
      .expect(200);
    expect(again.body.status).toBe('SUCCEEDED');
  });

  it('failed callback keeps the order in AWAITING_PAYMENT', async () => {
    const created = await pay('ord-1').expect(201);
    const paymentId = (created.body as { payment: Payment }).payment.id;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/payments/${paymentId}/callback`)
      .send({ result: 'failed', signature: sandboxSignature(paymentId, 'failed') })
      .expect(200);
    expect((res.body as Payment).status).toBe('FAILED');
    expect(state.orders[0]!.status).toBe('AWAITING_PAYMENT');
  });

  it('refund moves payment and order to REFUNDED; refunding PENDING is rejected', async () => {
    const created = await pay('ord-1').expect(201);
    const paymentId = (created.body as { payment: Payment }).payment.id;

    const bad = await request(app.getHttpServer()).post(`/api/v1/payments/${paymentId}/refund`);
    expect(bad.status).toBe(400);
    expect(bad.body.message).toBe('این وضعیت پرداخت قابل بازگشت نیست');

    await request(app.getHttpServer())
      .post(`/api/v1/payments/${paymentId}/callback`)
      .send({ result: 'succeeded', signature: sandboxSignature(paymentId, 'succeeded') })
      .expect(200);

    const refund = await request(app.getHttpServer()).post(`/api/v1/payments/${paymentId}/refund`).expect(200);
    const parsed = PayOrderResponseSchema.parse(refund.body);
    expect(parsed.payment.status).toBe('REFUNDED');
    expect(parsed.order.status).toBe('REFUNDED');
  });

  it('sandbox-confirm works when enabled and 404s when disabled', async () => {
    const created = await pay('ord-1').expect(201);
    const paymentId = (created.body as { payment: Payment }).payment.id;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/payments/${paymentId}/sandbox-confirm`)
      .send({ result: 'succeeded' })
      .expect(200);
    expect((res.body as Payment).status).toBe('SUCCEEDED');

    resetState('false');
    const hidden = await request(app.getHttpServer())
      .post('/api/v1/payments/pay-1/sandbox-confirm')
      .send({ result: 'succeeded' });
    expect(hidden.status).toBe(404);
  });
});
