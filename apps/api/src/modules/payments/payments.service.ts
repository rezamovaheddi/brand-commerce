import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Payment, SandboxCallback, type PayOrderResponse } from '@bc/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { toOrderContract } from '../orders/order.mapper';
import { toPaymentContract, type PaymentRow } from './payment.mapper';

const PAYMENT_SELECT = {
  id: true,
  orderId: true,
  amountMinor: true,
  currency: true,
  status: true,
  provider: true,
  isSandbox: true,
  createdAt: true,
} as const;

/**
 * Sandbox payment adapter (P3). Every record is marked provider='sandbox' +
 * isSandbox=true (literal in the contract) — this is NEVER real money and the
 * UI must label it SANDBOX. The real PSP adapter replaces this module without
 * touching the order state machine, the HMAC verification pattern or the
 * idempotency rules.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly config: ConfigService,
  ) {}

  private sandboxSecret(): string {
    return this.config.get<string>('PAYMENT_SANDBOX_SECRET') ?? 'dev-sandbox-secret-change-me';
  }

  private sandboxModeEnabled(): boolean {
    return this.config.get<string>('PAYMENT_SANDBOX_MODE') === 'true';
  }

  /** Starts a sandbox payment for a DRAFT order (DRAFT → AWAITING_PAYMENT). */
  async pay(orderId: string, idempotencyKey?: string): Promise<PayOrderResponse> {
    if (idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({
        where: { idempotencyKey },
        select: PAYMENT_SELECT,
      });
      if (existing) {
        return this.responseFor(existing as unknown as PaymentRow);
      }
    }

    // Transition is domain-guarded: only DRAFT → AWAITING_PAYMENT passes.
    const order = await this.ordersService.transition(orderId, 'AWAITING_PAYMENT');
    const paymentRow = await this.prisma.payment.create({
      data: {
        orderId,
        amountMinor: order.subtotalMinor,
        currency: order.currency,
        status: 'PENDING',
        provider: 'sandbox',
        isSandbox: true,
        idempotencyKey: idempotencyKey ?? null,
      },
      select: PAYMENT_SELECT,
    });
    return { order, payment: toPaymentContract(paymentRow as unknown as PaymentRow) };
  }

  /**
   * Gateway callback with REAL HMAC-SHA256 verification over `${id}.${result}`
   * (timing-safe comparison). Sandbox confirmations use the same code path.
   */
  async callback(paymentId: string, body: SandboxCallback): Promise<Payment> {
    const expected = createHmac('sha256', this.sandboxSecret())
      .update(`${paymentId}.${body.result}`)
      .digest('hex');
    const provided = Buffer.from(body.signature, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');
    if (provided.length !== expectedBuf.length || !timingSafeEqual(provided, expectedBuf)) {
      throw new UnauthorizedException('امضای درگاه معتبر نیست');
    }

    const row = await this.getPaymentRow(paymentId);
    if (row.status === 'PENDING') {
      if (body.result === 'succeeded') {
        await this.prisma.payment.update({ where: { id: paymentId }, data: { status: 'SUCCEEDED' } });
        await this.ordersService.transition(row.orderId, 'PAID');
        row.status = 'SUCCEEDED';
      } else {
        await this.prisma.payment.update({ where: { id: paymentId }, data: { status: 'FAILED' } });
        row.status = 'FAILED';
      }
      return toPaymentContract(row);
    }
    // Idempotent replay of the same terminal result is answered as-is; any
    // other move out of a terminal state is rejected.
    const terminal = row.status === 'SUCCEEDED' ? 'succeeded' : 'failed';
    if (body.result === terminal) {
      return toPaymentContract(row);
    }
    throw new BadRequestException('این پرداخت در وضعیت نهایی است');
  }

  /** Sandbox-only convenience: computes the signature and calls callback(). */
  async sandboxConfirm(paymentId: string, result: 'succeeded' | 'failed'): Promise<Payment> {
    if (!this.sandboxModeEnabled()) {
      // Hidden in production: without sandbox mode this route must not exist.
      throw new NotFoundException();
    }
    const signature = createHmac('sha256', this.sandboxSecret())
      .update(`${paymentId}.${result}`)
      .digest('hex');
    return this.callback(paymentId, { result, signature });
  }

  /** Sandbox refund (SUCCEEDED → REFUNDED) + order PAID → REFUNDED. */
  async refund(paymentId: string): Promise<PayOrderResponse> {
    const row = await this.getPaymentRow(paymentId);
    if (row.status !== 'SUCCEEDED') {
      throw new BadRequestException('این وضعیت پرداخت قابل بازگشت نیست');
    }
    await this.prisma.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED' } });
    const order = await this.ordersService.transition(row.orderId, 'REFUNDED');
    row.status = 'REFUNDED';
    return { order, payment: toPaymentContract(row) };
  }

  async get(paymentId: string): Promise<Payment> {
    return toPaymentContract(await this.getPaymentRow(paymentId));
  }

  private async getPaymentRow(paymentId: string): Promise<PaymentRow> {
    const row = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: PAYMENT_SELECT,
    });
    if (!row) {
      throw new NotFoundException('پرداخت یافت نشد');
    }
    return row as unknown as PaymentRow;
  }

  private async responseFor(row: PaymentRow): Promise<PayOrderResponse> {
    const orderRow = await this.prisma.order.findUnique({
      where: { id: row.orderId },
      include: { lines: true },
    });
    if (!orderRow) {
      throw new NotFoundException('سفارش یافت نشد');
    }
    return { order: toOrderContract(orderRow), payment: toPaymentContract(row) };
  }
}
