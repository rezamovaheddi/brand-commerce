import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApiError, Category, HealthResponse, ProductListResponse, ProductSchema } from '@bc/contracts';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

type ProductStatusLiteral = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

interface FakeVariantRow {
  id: string;
  sku: string;
  titleFa: string;
  titleEn: string;
  priceMinor: number;
  currency: string;
  isDefault: boolean;
  status: ProductStatusLiteral;
  inventory: { onHand: number; reserved: number } | null;
}

interface FakeProductRow {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string;
  descriptionFa: string | null;
  descriptionEn: string | null;
  status: ProductStatusLiteral;
  isSample: boolean;
  categoryId: string;
  category: { slug: string; nameFa: string; nameEn: string } | null;
  variants: FakeVariantRow[];
  createdAt: string;
}

interface FakeCategoryRow {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string;
}

/** Subset of Prisma.ProductWhereInput the service actually builds. */
interface FakeWhere {
  status?: ProductStatusLiteral;
  category?: { is?: { slug?: string } };
  OR?: Array<{
    nameFa?: { contains?: string; mode?: string };
    nameEn?: { contains?: string; mode?: string };
  }>;
}

interface FakeFindManyArgs {
  where?: FakeWhere | null;
  skip?: number;
  take?: number;
}

const CATEGORIES: FakeCategoryRow[] = [
  { id: 'cat-cleansers', slug: 'cleansers', nameFa: 'پاک‌کننده‌ها', nameEn: 'Cleansers' },
  { id: 'cat-serums', slug: 'serums', nameFa: 'سرم‌ها', nameEn: 'Serums' },
];

function categoryRef(slug: string): { slug: string; nameFa: string; nameEn: string } {
  const category = CATEGORIES.find((entry) => entry.slug === slug);
  if (!category) {
    throw new Error(`Unknown fixture category: ${slug}`);
  }
  return { slug: category.slug, nameFa: category.nameFa, nameEn: category.nameEn };
}

function variant(id: string, sku: string, priceMinor: number): FakeVariantRow {
  return {
    id,
    sku,
    titleFa: 'حجم ۳۰ میلی‌لیتر (نمونه)',
    titleEn: 'Sample size',
    priceMinor,
    currency: 'IRR',
    isDefault: true,
    status: 'ACTIVE',
    inventory: { onHand: 25, reserved: 0 },
  };
}

// 3 ACTIVE sample products across 2 categories + 1 ARCHIVED product that must
// never appear in the public catalog (even though it is the newest row).
const PRODUCTS: FakeProductRow[] = [
  {
    id: 'prd-1',
    slug: 'ethereal-gentle-cleanser',
    nameFa: 'ژل شست‌وشوی ملایم اتیریال',
    nameEn: 'Ethereal Gentle Cleanser',
    descriptionFa: 'ژل شست‌وشوی روزانه (داده نمونه)',
    descriptionEn: 'Daily gel cleanser (sample data)',
    status: 'ACTIVE',
    isSample: true,
    categoryId: 'cat-cleansers',
    category: categoryRef('cleansers'),
    variants: [variant('var-1', 'DMV-CLN-150', 1890000)],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'prd-2',
    slug: 'ethereal-cream-cleanser',
    nameFa: 'شیر پاک‌کننده خامه‌ای اتیریال',
    nameEn: 'Ethereal Cream Cleanser',
    descriptionFa: 'شیر پاک‌کننده غنی (داده نمونه)',
    descriptionEn: 'Rich cream cleanser (sample data)',
    status: 'ACTIVE',
    isSample: true,
    categoryId: 'cat-cleansers',
    category: categoryRef('cleansers'),
    variants: [variant('var-2', 'DMV-CLN-200', 2250000)],
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'prd-3',
    slug: 'ethereal-vitamin-c-serum',
    nameFa: 'سرم ویتامین C اتیریال',
    nameEn: 'Ethereal Vitamin C Serum',
    descriptionFa: 'سرم روشن‌کننده (داده نمونه)',
    descriptionEn: 'Brightening serum (sample data)',
    status: 'ACTIVE',
    isSample: true,
    categoryId: 'cat-serums',
    category: categoryRef('serums'),
    variants: [variant('var-3', 'DMV-SRM-30C', 3950000)],
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'prd-4',
    slug: 'legacy-archived-cleanser',
    nameFa: 'محصول آرشیو شده',
    nameEn: 'Legacy Archived Cleanser',
    descriptionFa: null,
    descriptionEn: null,
    status: 'ARCHIVED',
    isSample: true,
    categoryId: 'cat-cleansers',
    category: categoryRef('cleansers'),
    variants: [],
    createdAt: '2026-01-04T00:00:00.000Z',
  },
];

function matchesWhere(row: FakeProductRow, where?: FakeWhere | null): boolean {
  if (!where) {
    return true;
  }
  if (where.status !== undefined && row.status !== where.status) {
    return false;
  }
  const slug = where.category?.is?.slug;
  if (slug !== undefined && (row.category?.slug ?? null) !== slug) {
    return false;
  }
  const search = where.OR?.[0]?.nameFa?.contains;
  if (search !== undefined) {
    // Emulate the OR (nameFa OR nameEn, case-insensitive contains) clause.
    const needle = search.toLowerCase();
    const haystack = `${row.nameFa} ${row.nameEn}`.toLowerCase();
    if (!haystack.includes(needle)) {
      return false;
    }
  }
  return true;
}

/** In-memory PrismaService double implementing only the methods the API uses. */
const fakePrisma = {
  $connect: async (): Promise<void> => undefined,
  $disconnect: async (): Promise<void> => undefined,
  $queryRaw: async (): Promise<unknown[]> => [],
  product: {
    findMany: jest.fn(async (args?: FakeFindManyArgs) => {
      const filtered = PRODUCTS.filter((row) => matchesWhere(row, args?.where)).sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
      );
      const skip = args?.skip ?? 0;
      const take = args?.take ?? filtered.length;
      return filtered.slice(skip, skip + take);
    }),
    count: jest.fn(async (args?: { where?: FakeWhere | null }) =>
      PRODUCTS.filter((row) => matchesWhere(row, args?.where)).length,
    ),
    findUnique: jest.fn(
      async (args?: { where?: { slug?: string } }) =>
        PRODUCTS.find((row) => row.slug === args?.where?.slug) ?? null,
    ),
  },
  category: {
    findMany: jest.fn(async () =>
      CATEGORIES.map((category) => ({
        slug: category.slug,
        nameFa: category.nameFa,
        nameEn: category.nameEn,
        _count: {
          products: PRODUCTS.filter(
            (row) => row.categoryId === category.id && row.status === 'ACTIVE',
          ).length,
        },
      })),
    ),
  },
} as unknown as PrismaService;

describe('Products API (e2e, in-memory Prisma)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(fakePrisma)
      .compile();

    app = moduleRef.createNestApplication();
    applyAppConfig(app);
    await app.init();
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health reports status ok with database up', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');
    const body = response.body as HealthResponse;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: 'ok', database: 'up' });
    expect(typeof body.uptime).toBe('number');
  });

  it('GET /api/v1/products returns the paginated ACTIVE list only', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/products');
    const body = response.body as ProductListResponse;

    expect(response.status).toBe(200);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.page).toBe(1);
    expect(body.total).toBe(3);
    expect(body.totalPages).toBe(Math.ceil(body.total / body.limit));
    expect(body.items.length).toBe(3);
    // ARCHIVED rows (even the newest one) never surface.
    const slugs = body.items.map((item) => item.slug);
    expect(slugs).not.toContain('legacy-archived-cleanser');
    // Items must validate against the shared contract.
    expect(() => ProductSchema.parse(body.items[0])).not.toThrow();
  });

  it('GET /api/v1/products?limit=999 is rejected with 400 and a message array', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/products?limit=999');
    const body = response.body as ApiError;

    expect(response.status).toBe(400);
    expect(body.statusCode).toBe(400);
    expect(Array.isArray(body.message)).toBe(true);
    expect(body.message.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/products?category=cleansers only returns matching fixtures', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/products?category=cleansers');
    const body = response.body as ProductListResponse;

    expect(response.status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.items.every((item) => item.category?.slug === 'cleansers')).toBe(true);
    expect(body.items.map((item) => item.slug).sort()).toEqual([
      'ethereal-cream-cleanser',
      'ethereal-gentle-cleanser',
    ]);
  });

  it('GET /api/v1/products/:slug serves an existing product and 404s unknown slugs', async () => {
    const found = await request(app.getHttpServer()).get('/api/v1/products/ethereal-gentle-cleanser');
    const foundBody = found.body as ProductListResponse['items'][number];

    expect(found.status).toBe(200);
    expect(foundBody.nameEn).toBe('Ethereal Gentle Cleanser');
    expect(foundBody.isSample).toBe(true);
    expect(() => ProductSchema.parse(foundBody)).not.toThrow();

    const missing = await request(app.getHttpServer()).get('/api/v1/products/does-not-exist');
    const missingBody = missing.body as ApiError;

    expect(missing.status).toBe(404);
    expect(missingBody).toMatchObject({ statusCode: 404, message: 'محصول یافت نشد' });
  });

  it('GET /api/v1/categories lists active categories with productCount', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/categories');
    const categories = response.body as Category[];

    expect(response.status).toBe(200);
    expect(Array.isArray(categories)).toBe(true);
    const cleansers = categories.find((category) => category.slug === 'cleansers');
    const serums = categories.find((category) => category.slug === 'serums');
    expect(cleansers?.productCount).toBe(2);
    expect(serums?.productCount).toBe(1);
  });
});
