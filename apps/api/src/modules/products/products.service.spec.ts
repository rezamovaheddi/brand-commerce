import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

type MockFn = jest.Mock<Promise<unknown>, unknown[]>;

/** Shape of the findMany args the service is expected to pass to Prisma. */
interface ProductFindManyArgs {
  where?: Record<string, unknown>;
  include?: { variants: boolean; category: boolean };
  skip?: number;
  take?: number;
  orderBy?: Record<string, string>;
}

interface CategoryFindManyRow {
  slug: string;
  nameFa: string;
  nameEn: string;
  _count: { products: number };
}

describe('ProductsService', () => {
  let service: ProductsService;
  let controller: ProductsController;
  let productFindMany: MockFn;
  let productCount: MockFn;
  let productFindUnique: MockFn;
  let categoryFindMany: MockFn;

  beforeEach(async () => {
    productFindMany = jest.fn();
    productCount = jest.fn();
    productFindUnique = jest.fn();
    categoryFindMany = jest.fn();

    const fakePrisma = {
      product: { findMany: productFindMany, count: productCount, findUnique: productFindUnique },
      category: { findMany: categoryFindMany },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [ProductsService, { provide: PrismaService, useValue: fakePrisma }],
    }).compile();

    service = moduleRef.get(ProductsService);
    controller = moduleRef.get(ProductsController);
  });

  const lastFindManyArgs = (): ProductFindManyArgs =>
    (productFindMany.mock.calls[0]?.[0] ?? {}) as ProductFindManyArgs;

  describe('list()', () => {
    it('applies default pagination math and the ACTIVE status where clause', async () => {
      productFindMany.mockResolvedValue([]);
      productCount.mockResolvedValue(0);

      const result = await service.list({ page: 1, limit: 12 });

      expect(productFindMany).toHaveBeenCalledTimes(1);
      expect(lastFindManyArgs()).toEqual({
        where: { status: 'ACTIVE' },
        include: { variants: true, category: true },
        skip: 0,
        take: 12,
        orderBy: { createdAt: 'desc' },
      });
      expect(productCount).toHaveBeenCalledWith({ where: { status: 'ACTIVE' } });
      expect(result).toEqual({ items: [], total: 0, page: 1, limit: 12, totalPages: 0 });
    });

    it('computes totalPages as ceil(total / limit) and skips by page', async () => {
      productFindMany.mockResolvedValue([]);
      productCount.mockResolvedValue(25);

      const result = await service.list({ page: 3, limit: 12 });

      expect(result.total).toBe(25);
      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(Math.ceil(25 / 12));
      expect(lastFindManyArgs().skip).toBe((3 - 1) * 12);
    });

    it('filters by category slug through the category join', async () => {
      productFindMany.mockResolvedValue([]);
      productCount.mockResolvedValue(0);

      await service.list({ page: 1, limit: 12, category: 'cleansers' });

      expect(lastFindManyArgs().where).toEqual({
        status: 'ACTIVE',
        category: { is: { slug: 'cleansers' } },
      });
    });

    it('builds an insensitive OR search over both names when q is provided', async () => {
      productFindMany.mockResolvedValue([]);
      productCount.mockResolvedValue(0);

      await service.list({ page: 1, limit: 12, q: 'serum' });

      expect(lastFindManyArgs().where).toEqual({
        status: 'ACTIVE',
        OR: [
          { nameFa: { contains: 'serum', mode: 'insensitive' } },
          { nameEn: { contains: 'serum', mode: 'insensitive' } },
        ],
      });
    });
  });

  describe('findBySlug()', () => {
    it('returns null when no product matches the slug', async () => {
      productFindUnique.mockResolvedValue(null);

      expect(await service.findBySlug('does-not-exist')).toBeNull();
    });

    it('hides rows whose status is not ACTIVE', async () => {
      productFindUnique.mockResolvedValue({
        id: 'p-archived',
        slug: 'legacy-archived-cleanser',
        nameFa: 'محصول آرشیو شده',
        nameEn: 'Legacy Archived Cleanser',
        descriptionFa: null,
        descriptionEn: null,
        status: 'ARCHIVED',
        isSample: true,
        category: null,
        variants: [],
      });

      expect(await service.findBySlug('legacy-archived-cleanser')).toBeNull();
    });

    it('maps the ACTIVE row (with variants and category) to the contract', async () => {
      productFindUnique.mockResolvedValue({
        id: 'p-1',
        slug: 'ethereal-gentle-cleanser',
        nameFa: 'ژل شست‌وشوی ملایم اتیریال',
        nameEn: 'Ethereal Gentle Cleanser',
        descriptionFa: null,
        descriptionEn: null,
        status: 'ACTIVE',
        isSample: true,
        category: { slug: 'cleansers', nameFa: 'پاک‌کننده‌ها', nameEn: 'Cleansers' },
        variants: [
          {
            id: 'var-1',
            sku: 'DMV-CLN-150',
            titleFa: 'حجم ۱۵۰ میلی‌لیتر',
            titleEn: '150 ml',
            priceMinor: 1890000,
            currency: 'IRR',
            isDefault: true,
            status: 'ACTIVE',
          },
        ],
      });

      const product = await service.findBySlug('ethereal-gentle-cleanser');

      expect(product).not.toBeNull();
      expect(product?.nameEn).toBe('Ethereal Gentle Cleanser');
      expect(product?.variants).toHaveLength(1);
      expect(product?.variants[0]?.isDefault).toBe(true);
    });

    it('makes the controller throw NotFound when the service returns null', async () => {
      productFindUnique.mockResolvedValue(null);

      await expect(controller.findBySlug('does-not-exist')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listCategories()', () => {
    it('queries active categories with ACTIVE product counts and maps them', async () => {
      const rows: CategoryFindManyRow[] = [
        { slug: 'cleansers', nameFa: 'پاک‌کننده‌ها', nameEn: 'Cleansers', _count: { products: 2 } },
        { slug: 'serums', nameFa: 'سرم‌ها', nameEn: 'Serums', _count: { products: 1 } },
      ];
      categoryFindMany.mockResolvedValue(rows);

      const categories = await service.listCategories();

      expect(categoryFindMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: { _count: { select: { products: { where: { status: 'ACTIVE' } } } } },
      });
      expect(categories).toEqual([
        { slug: 'cleansers', nameFa: 'پاک‌کننده‌ها', nameEn: 'Cleansers', productCount: 2 },
        { slug: 'serums', nameFa: 'سرم‌ها', nameEn: 'Serums', productCount: 1 },
      ]);
    });
  });
});
