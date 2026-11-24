import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderFindUnique: jest.Mock;
  let orderFindMany: jest.Mock;
  let orderUpdate: jest.Mock;
  let inventoryRelease: jest.Mock;

  const mockOrderRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'ord-101',
    status: 'DRAFT',
    currency: 'IRR',
    itemCount: 1,
    subtotalMinor: 2500000,
    fullName: 'آزمایشگر سیستم',
    phone: '09121234567',
    province: 'تهران',
    city: 'تهران',
    postalCode: '1234567890',
    addressLine: 'خیابان ولیعصر، پلاک ۱',
    createdAt: new Date('2026-11-20T10:00:00Z'),
    lines: [
      {
        variantId: 'var-1',
        sku: 'DMV-SRM-001',
        productNameFa: 'سرم ضدپیری',
        productNameEn: 'Anti-aging Serum',
        titleFa: '۳۰ میلی‌لیتر',
        titleEn: '30 ml',
        quantity: 1,
        unitPriceMinor: 2500000,
        currency: 'IRR',
        lineTotalMinor: 2500000,
      },
    ],
    ...overrides,
  });

  beforeEach(async () => {
    orderFindUnique = jest.fn();
    orderFindMany = jest.fn();
    orderUpdate = jest.fn();
    inventoryRelease = jest.fn().mockResolvedValue(undefined);

    const fakePrisma = {
      order: {
        findUnique: orderFindUnique,
        findMany: orderFindMany,
        update: orderUpdate,
      },
    } as unknown as PrismaService;

    const fakeInventory = {
      releaseForOrder: inventoryRelease,
    } as unknown as InventoryService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: fakePrisma },
        { provide: InventoryService, useValue: fakeInventory },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  describe('get()', () => {
    it('returns an order when found', async () => {
      orderFindUnique.mockResolvedValue(mockOrderRow());
      const order = await service.get('ord-101');
      expect(order.id).toBe('ord-101');
      expect(order.status).toBe('DRAFT');
      expect(order.address.fullName).toBe('آزمایشگر سیستم');
      expect(order.lines).toHaveLength(1);
    });

    it('throws NotFoundException when order does not exist', async () => {
      orderFindUnique.mockResolvedValue(null);
      await expect(service.get('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listByPhone()', () => {
    it('returns orders matching normalized phone number', async () => {
      orderFindMany.mockResolvedValue([mockOrderRow()]);
      const orders = await service.listByPhone(' 09121234567 ');
      expect(orderFindMany).toHaveBeenCalledWith({
        where: { phone: '09121234567' },
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(orders).toHaveLength(1);
    });

    it('returns empty array if phone is empty string', async () => {
      const orders = await service.listByPhone('   ');
      expect(orders).toEqual([]);
      expect(orderFindMany).not.toHaveBeenCalled();
    });
  });

  describe('cancel()', () => {
    it('cancels a DRAFT order and releases inventory reservation', async () => {
      orderFindUnique
        .mockResolvedValueOnce(mockOrderRow({ status: 'DRAFT' }))
        .mockResolvedValueOnce(mockOrderRow({ status: 'CANCELLED' }));

      const order = await service.cancel('ord-101');
      expect(orderUpdate).toHaveBeenCalledWith({
        where: { id: 'ord-101' },
        data: { status: 'CANCELLED' },
      });
      expect(inventoryRelease).toHaveBeenCalledWith('ord-101');
      expect(order.status).toBe('CANCELLED');
    });

    it('rejects cancellation if order is in non-cancellable status (e.g. DELIVERED)', async () => {
      orderFindUnique.mockResolvedValue(mockOrderRow({ status: 'DELIVERED' }));
      await expect(service.cancel('ord-101')).rejects.toThrow(BadRequestException);
      expect(inventoryRelease).not.toHaveBeenCalled();
    });
  });

  describe('transition()', () => {
    it('allows legal order status transition (DRAFT -> AWAITING_PAYMENT)', async () => {
      orderFindUnique
        .mockResolvedValueOnce(mockOrderRow({ status: 'DRAFT' }))
        .mockResolvedValueOnce(mockOrderRow({ status: 'AWAITING_PAYMENT' }));

      const order = await service.transition('ord-101', 'AWAITING_PAYMENT');
      expect(orderUpdate).toHaveBeenCalledWith({
        where: { id: 'ord-101' },
        data: { status: 'AWAITING_PAYMENT' },
      });
      expect(order.status).toBe('AWAITING_PAYMENT');
    });

    it('rejects illegal status transition (DRAFT -> DELIVERED) with BadRequestException', async () => {
      orderFindUnique.mockResolvedValue(mockOrderRow({ status: 'DRAFT' }));
      await expect(service.transition('ord-101', 'DELIVERED')).rejects.toThrow(BadRequestException);
    });
  });
});
