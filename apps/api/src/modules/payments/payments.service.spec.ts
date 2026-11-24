import 'reflect-metadata';
import { createHmac } from 'node:crypto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentFindUnique: jest.Mock;
  let paymentCreate: jest.Mock;
  let paymentUpdate: jest.Mock;
  let orderFindUnique: jest.Mock;
  let ordersTransition: jest.Mock;
  let ordersGet: jest.Mock;
  let inventoryConvertToSale: jest.Mock;
  let inventoryRestock: jest.Mock;
  let configGet: jest.Mock;

  const TEST_SECRET = 'test-sandbox-secret-key-32-chars';

  const mockOrderRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'ord-101',
    status: 'AWAITING_PAYMENT',
    currency: 'IRR',
    itemCount: 1,
    subtotalMinor: 1500000,
    fullName: 'کاربر تست',
    phone: '09121111111',
    province: 'تهران',
    city: 'تهران',
    postalCode: '1111111111',
    addressLine: 'آدرس تست',
    lines: [],
    createdAt: new Date('2026-11-20T10:00:00.000Z'),
    ...overrides,
  });

  const mockOrderContract = (overrides: Record<string, unknown> = {}) => ({
    id: 'ord-101',
    status: 'AWAITING_PAYMENT',
    currency: 'IRR',
    itemCount: 1,
    subtotalMinor: 1500000,
    address: {
      fullName: 'کاربر تست',
      phone: '09121111111',
      province: 'تهران',
      city: 'تهران',
      postalCode: '1111111111',
      addressLine: 'آدرس تست',
    },
    lines: [],
    createdAt: '2026-11-20T10:00:00.000Z',
    ...overrides,
  });

  const mockPaymentRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'pay-202',
    orderId: 'ord-101',
    amountMinor: 1500000,
    currency: 'IRR',
    status: 'PENDING',
    provider: 'sandbox',
    isSandbox: true,
    createdAt: new Date('2026-11-20T10:01:00.000Z'),
    ...overrides,
  });

  const sign = (paymentId: string, result: string) =>
    createHmac('sha256', TEST_SECRET).update(`${paymentId}.${result}`).digest('hex');

  beforeEach(async () => {
    paymentFindUnique = jest.fn();
    paymentCreate = jest.fn();
    paymentUpdate = jest.fn();
    orderFindUnique = jest.fn();
    ordersTransition = jest.fn();
    ordersGet = jest.fn();
    inventoryConvertToSale = jest.fn().mockResolvedValue(undefined);
    inventoryRestock = jest.fn().mockResolvedValue(undefined);
    configGet = jest.fn((key: string) => {
      if (key === 'PAYMENT_SANDBOX_SECRET') return TEST_SECRET;
      if (key === 'PAYMENT_SANDBOX_MODE') return 'true';
      return null;
    });

    const fakePrisma = {
      payment: {
        findUnique: paymentFindUnique,
        create: paymentCreate,
        update: paymentUpdate,
      },
      order: {
        findUnique: orderFindUnique,
      },
    } as unknown as PrismaService;

    const fakeOrders = {
      transition: ordersTransition,
      get: ordersGet,
    } as unknown as OrdersService;

    const fakeInventory = {
      convertToSale: inventoryConvertToSale,
      restockForOrder: inventoryRestock,
    } as unknown as InventoryService;

    const fakeConfig = {
      get: configGet,
    } as unknown as ConfigService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: fakePrisma },
        { provide: OrdersService, useValue: fakeOrders },
        { provide: InventoryService, useValue: fakeInventory },
        { provide: ConfigService, useValue: fakeConfig },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
  });

  describe('pay()', () => {
    it('creates a PENDING sandbox payment and transitions order to AWAITING_PAYMENT', async () => {
      ordersTransition.mockResolvedValue(mockOrderContract());
      paymentCreate.mockResolvedValue(mockPaymentRow());

      const res = await service.pay('ord-101');
      expect(ordersTransition).toHaveBeenCalledWith('ord-101', 'AWAITING_PAYMENT');
      expect(paymentCreate).toHaveBeenCalledWith({
        data: {
          orderId: 'ord-101',
          amountMinor: 1500000,
          currency: 'IRR',
          status: 'PENDING',
          provider: 'sandbox',
          isSandbox: true,
          idempotencyKey: null,
        },
        select: expect.any(Object),
      });
      expect(res.payment.id).toBe('pay-202');
      expect(res.payment.isSandbox).toBe(true);
    });

    it('returns existing payment when idempotencyKey matches without creating new row', async () => {
      paymentFindUnique.mockResolvedValue(mockPaymentRow({ idempotencyKey: 'idem-key-1' }));
      orderFindUnique.mockResolvedValue(mockOrderRow());

      const res = await service.pay('ord-101', 'idem-key-1');
      expect(paymentCreate).not.toHaveBeenCalled();
      expect(res.payment.id).toBe('pay-202');
    });
  });

  describe('callback()', () => {
    it('rejects invalid HMAC signature with UnauthorizedException', async () => {
      await expect(
        service.callback('pay-202', { result: 'succeeded', signature: 'invalid-hex-signature' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('processes successful payment callback: updates payment, transitions order to PAID, and converts inventory reservation', async () => {
      paymentFindUnique.mockResolvedValue(mockPaymentRow({ status: 'PENDING' }));
      ordersTransition.mockResolvedValue(mockOrderContract({ status: 'PAID' }));

      const signature = sign('pay-202', 'succeeded');
      const payment = await service.callback('pay-202', { result: 'succeeded', signature });

      expect(paymentUpdate).toHaveBeenCalledWith({
        where: { id: 'pay-202' },
        data: { status: 'SUCCEEDED' },
      });
      expect(ordersTransition).toHaveBeenCalledWith('ord-101', 'PAID');
      expect(inventoryConvertToSale).toHaveBeenCalledWith('ord-101');
      expect(payment.status).toBe('SUCCEEDED');
    });

    it('processes failed payment callback: marks payment FAILED', async () => {
      paymentFindUnique.mockResolvedValue(mockPaymentRow({ status: 'PENDING' }));

      const signature = sign('pay-202', 'failed');
      const payment = await service.callback('pay-202', { result: 'failed', signature });

      expect(paymentUpdate).toHaveBeenCalledWith({
        where: { id: 'pay-202' },
        data: { status: 'FAILED' },
      });
      expect(ordersTransition).not.toHaveBeenCalled();
      expect(payment.status).toBe('FAILED');
    });

    it('idempotently returns terminal SUCCEEDED payment on duplicate callback', async () => {
      paymentFindUnique.mockResolvedValue(mockPaymentRow({ status: 'SUCCEEDED' }));

      const signature = sign('pay-202', 'succeeded');
      const payment = await service.callback('pay-202', { result: 'succeeded', signature });

      expect(paymentUpdate).not.toHaveBeenCalled();
      expect(payment.status).toBe('SUCCEEDED');
    });

    it('rejects contradictory callback for terminal payment with BadRequestException', async () => {
      paymentFindUnique.mockResolvedValue(mockPaymentRow({ status: 'SUCCEEDED' }));

      const signature = sign('pay-202', 'failed');
      await expect(
        service.callback('pay-202', { result: 'failed', signature }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refund()', () => {
    it('refunds a SUCCEEDED payment, transitions order to REFUNDED, and restocks inventory', async () => {
      paymentFindUnique.mockResolvedValue(mockPaymentRow({ status: 'SUCCEEDED' }));
      ordersTransition.mockResolvedValue(mockOrderContract({ status: 'REFUNDED' }));

      const res = await service.refund('pay-202');
      expect(paymentUpdate).toHaveBeenCalledWith({
        where: { id: 'pay-202' },
        data: { status: 'REFUNDED' },
      });
      expect(ordersTransition).toHaveBeenCalledWith('ord-101', 'REFUNDED');
      expect(inventoryRestock).toHaveBeenCalledWith('ord-101');
      expect(res.payment.status).toBe('REFUNDED');
      expect(res.order.status).toBe('REFUNDED');
    });

    it('rejects refunding a non-SUCCEEDED payment with BadRequestException', async () => {
      paymentFindUnique.mockResolvedValue(mockPaymentRow({ status: 'PENDING' }));
      await expect(service.refund('pay-202')).rejects.toThrow(BadRequestException);
    });
  });
});
