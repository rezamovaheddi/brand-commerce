import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApiError, Cart, CartSchema } from '@bc/contracts';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

type VariantStatusLiteral = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
type CartStatusLiteral = 'ACTIVE' | 'CONVERTED' | 'ABANDONED';

interface FakeVariantRow {
  id: string;
  sku: string;
  titleFa: string;
  titleEn: string;
  priceMinor: number;
  currency: string;
  isDefault: boolean;
  status: VariantStatusLiteral;
  productId: string;
}

interface FakeProductRow {
  id: string;
  status: VariantStatusLiteral;
  nameFa: string;
  nameEn: string;
}

interface FakeCartItemRecord {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
}

interface FakeCartRecord {
  id: string;
  status: CartStatusLiteral;
  createdAt: string;
  updatedAt: string;
}

/** Subset of Prisma's @@unique([cartId, variantId]) compound where-clause the API uses. */
interface FakeCompoundWhere {
  cartId_variantId: { cartId: string; variantId: string };
}

interface FakeUpsertArgs {
  where: FakeCompoundWhere;
  create: { cartId: string; variantId: string; quantity: number };
  update: { quantity: number };
}

/**
 * Fixtures: 2 ACTIVE variants of 2 ACTIVE products with different priceMinor,
 * plus 1 ARCHIVED variant (of an ACTIVE product) that must never be purchasable.
 */
const PRODUCTS: Record<string, FakeProductRow> = {
  'prd-1': { id: 'prd-1', status: 'ACTIVE', nameFa: 'ژل شست‌وشوی ملایم اتیریال', nameEn: 'Ethereal Gentle Cleanser' },
  'prd-2': { id: 'prd-2', status: 'ACTIVE', nameFa: 'سرم ویتامین C اتیریال', nameEn: 'Ethereal Vitamin C Serum' },
};

const VARIANTS: Record<string, FakeVariantRow> = {
  'var-1': {
    id: 'var-1',
    sku: 'DMV-CLN-150',
    titleFa: 'ژل شست‌وشوی ملایم اتیریال',
    titleEn: 'Ethereal Gentle Cleanser',
    priceMinor: 1_890_000,
    currency: 'IRR',
    isDefault: true,
    status: 'ACTIVE',
    productId: 'prd-1',
  },
  'var-2': {
    id: 'var-2',
    sku: 'DMV-SRM-30C',
    titleFa: 'سرم ویتامین C اتیریال',
    titleEn: 'Ethereal Vitamin C Serum',
    priceMinor: 2_250_000,
    currency: 'IRR',
    isDefault: true,
    status: 'ACTIVE',
    productId: 'prd-2',
  },
  'var-arch': {
    id: 'var-arch',
    sku: 'DMV-ARC-001',
    titleFa: 'محصول آرشیو شده',
    titleEn: 'Legacy Archived Cleanser',
    priceMinor: 999_000,
    currency: 'IRR',
    isDefault: false,
    status: 'ARCHIVED',
    productId: 'prd-1',
  },
};

interface FakeState {
  carts: FakeCartRecord[];
  items: FakeCartItemRecord[];
  cartSeq: number;
  itemSeq: number;
}

const state: FakeState = { carts: [], items: [], cartSeq: 0, itemSeq: 0 };

function compoundKey(cartId: string, variantId: string): string {
  return `${cartId}::${variantId}`;
}

/** Attaches each item's variant (+ parent product status) like Prisma's include would. */
function hydrateCart(
  cart: FakeCartRecord,
): FakeCartRecord & { items: Array<FakeCartItemRecord & { variant: FakeVariantRow & { product: FakeProductRow } }> } {
  return {
    ...cart,
    items: state.items
      .filter((item) => item.cartId === cart.id)
      .map((item) => {
        const variant = VARIANTS[item.variantId];
        if (!variant) {
          throw new Error(`Unknown fixture variant: ${item.variantId}`);
        }
        return { ...item, variant: { ...variant, product: { ...PRODUCTS[variant.productId] } } };
      }),
  };
}

/**
 * In-memory PrismaService double implementing only the methods the carts module
 * uses. Mutates `state` in place; beforeEach resets it between tests.
 */
const fakePrisma = {
  $connect: async (): Promise<void> => undefined,
  $disconnect: async (): Promise<void> => undefined,
  $queryRaw: async (): Promise<unknown[]> => [],
  cart: {
    create: jest.fn(async () => {
      state.cartSeq += 1;
      const cart: FakeCartRecord = {
        id: `cart-${state.cartSeq}`,
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      state.carts.push(cart);
      return hydrateCart(cart);
    }),
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      const cart = state.carts.find((row) => row.id === args?.where?.id);
      return cart ? hydrateCart(cart) : null;
    }),
  },
  cartItem: {
    upsert: jest.fn(async (args: FakeUpsertArgs) => {
      const { cartId, variantId } = args.where.cartId_variantId;
      const existing = state.items.find(
        (item) => compoundKey(item.cartId, item.variantId) === compoundKey(cartId, variantId),
      );
      if (existing) {
        existing.quantity = args.update.quantity;
        return { ...existing };
      }
      state.itemSeq += 1;
      const created: FakeCartItemRecord = {
        id: `itm-${state.itemSeq}`,
        cartId: args.create.cartId,
        variantId: args.create.variantId,
        quantity: args.create.quantity,
      };
      state.items.push(created);
      return { ...created };
    }),
    findUnique: jest.fn(async (args?: { where?: FakeCompoundWhere }) => {
      const where = args?.where?.cartId_variantId;
      if (!where) {
        return null;
      }
      return (
        state.items.find(
          (item) =>
            compoundKey(item.cartId, item.variantId) === compoundKey(where.cartId, where.variantId),
        ) ?? null
      );
    }),
    update: jest.fn(async (args: { where: FakeCompoundWhere; data: { quantity: number } }) => {
      const { cartId, variantId } = args.where.cartId_variantId;
      const existing = state.items.find(
        (item) => compoundKey(item.cartId, item.variantId) === compoundKey(cartId, variantId),
      );
      if (!existing) {
        throw new Error('cartItem.update: record not found');
      }
      existing.quantity = args.data.quantity;
      return { ...existing };
    }),
    delete: jest.fn(async (args: { where: FakeCompoundWhere }) => {
      const { cartId, variantId } = args.where.cartId_variantId;
      const index = state.items.findIndex(
        (item) => compoundKey(item.cartId, item.variantId) === compoundKey(cartId, variantId),
      );
      if (index < 0) {
        throw new Error('cartItem.delete: record not found');
      }
      state.items.splice(index, 1);
    }),
  },
  productVariant: {
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      const id = args?.where?.id;
      const variant = id !== undefined ? VARIANTS[id] : undefined;
      if (!variant) {
        return null;
      }
      return { ...variant, product: { ...PRODUCTS[variant.productId] } };
    }),
  },
} as unknown as PrismaService;

// Interactive transactions run against the same in-memory state — the double is
// single-threaded, so the callback simply re-enters the same fake client.
Object.assign(fakePrisma, {
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
    fn(fakePrisma as unknown as PrismaService),
});

describe('Carts API (e2e, in-memory Prisma)', () => {
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

  beforeEach(() => {
    state.carts = [];
    state.items = [];
    state.cartSeq = 0;
    state.itemSeq = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  /** Asserts the response is a success and validates it against the Cart contract. */
  function expectCart(status: number, body: unknown): Cart {
    expect(status).toBeLessThan(400);
    return CartSchema.parse(body);
  }

  /** Creates a fresh cart and returns its id (validating the contract). */
  async function createCartId(): Promise<string> {
    const response = await request(app.getHttpServer()).post('/api/v1/carts');
    return expectCart(response.status, response.body).id;
  }

  async function addItem(cartId: string, variantId: string, quantity: number) {
    return request(app.getHttpServer())
      .post(`/api/v1/carts/${cartId}/items`)
      .send({ variantId, quantity });
  }

  it('POST /api/v1/carts creates an empty cart with zero totals', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/carts');

    expect(response.status).toBe(201);
    const cart = expectCart(response.status, response.body);
    expect(cart.id).toBeTruthy();
    expect(cart.status).toBe('ACTIVE');
    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
    expect(cart.lineCount).toBe(0);
    expect(cart.subtotalMinor).toBe(0);
    expect(cart.currency).toBe('IRR');
  });

  it('GET /api/v1/carts/:id returns the persisted cart and 404s unknown ids', async () => {
    const cartId = await createCartId();

    const found = await request(app.getHttpServer()).get(`/api/v1/carts/${cartId}`);
    expect(found.status).toBe(200);
    const cart = expectCart(found.status, found.body);
    expect(cart.id).toBe(cartId);

    const missing = await request(app.getHttpServer()).get('/api/v1/carts/cart-does-not-exist');
    const missingBody = missing.body as ApiError;
    expect(missing.status).toBe(404);
    expect(missingBody.statusCode).toBe(404);
    expect(missingBody.message).toBe('سبد خرید یافت نشد');
  });

  it('POST /api/v1/carts/:id/items adds an item with server-resolved price and totals', async () => {
    const cartId = await createCartId();

    const response = await addItem(cartId, 'var-1', 2);
    expect(response.status).toBe(201);
    const cart = expectCart(response.status, response.body);

    expect(cart.items).toHaveLength(1);
    const item = cart.items[0];
    expect(item.variantId).toBe('var-1');
    expect(item.sku).toBe('DMV-CLN-150');
    expect(item.titleFa).toBe('ژل شست‌وشوی ملایم اتیریال');
    expect(item.titleEn).toBe('Ethereal Gentle Cleanser');
    expect(item.quantity).toBe(2);
    // Price comes from the fixture variant, never from the client.
    expect(item.unitPriceMinor).toBe(1_890_000);
    expect(item.currency).toBe('IRR');
    expect(item.lineTotalMinor).toBe(3_780_000);
    expect(cart.lineCount).toBe(1);
    expect(cart.itemCount).toBe(2);
    expect(cart.subtotalMinor).toBe(3_780_000);
  });

  it('POST items across two variants accumulates per-line and cart totals', async () => {
    const cartId = await createCartId();
    await addItem(cartId, 'var-1', 2);

    const response = await addItem(cartId, 'var-2', 1);
    expect(response.status).toBe(201);
    const cart = expectCart(response.status, response.body);

    expect(cart.items.map((item) => item.variantId).sort()).toEqual(['var-1', 'var-2']);
    expect(cart.lineCount).toBe(2);
    expect(cart.itemCount).toBe(3);
    expect(cart.subtotalMinor).toBe(2 * 1_890_000 + 1 * 2_250_000);
  });

  it('POST the same variant again merges into one line', async () => {
    const cartId = await createCartId();
    await addItem(cartId, 'var-1', 3);

    const response = await addItem(cartId, 'var-1', 4);
    expect(response.status).toBe(201);
    const cart = expectCart(response.status, response.body);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(7);
    expect(cart.lineCount).toBe(1);
    expect(cart.itemCount).toBe(7);
    expect(cart.subtotalMinor).toBe(7 * 1_890_000);
  });

  it('merging beyond the quantity limit clamps to 99 (never 102)', async () => {
    const cartId = await createCartId();
    await addItem(cartId, 'var-1', 97);

    const response = await addItem(cartId, 'var-1', 5);
    expect(response.status).toBe(201);
    const cart = expectCart(response.status, response.body);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(99);
    expect(cart.lineCount).toBe(1);
    expect(cart.itemCount).toBe(99);
    expect(cart.subtotalMinor).toBe(99 * 1_890_000);
  });

  it('POST an ARCHIVED variant is rejected with 404 and leaves the cart untouched', async () => {
    const cartId = await createCartId();

    const response = await addItem(cartId, 'var-arch', 1);
    const body = response.body as ApiError;
    expect(response.status).toBe(404);
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe('این محصول برای فروش در دسترس نیست');

    const after = await request(app.getHttpServer()).get(`/api/v1/carts/${cartId}`);
    const cart = expectCart(after.status, after.body);
    expect(cart.items).toEqual([]);
    expect(cart.subtotalMinor).toBe(0);
  });

  it('POST an unknown variant id is rejected with 404', async () => {
    const cartId = await createCartId();

    const response = await addItem(cartId, 'var-unknown', 1);
    const body = response.body as ApiError;
    expect(response.status).toBe(404);
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe('این محصول برای فروش در دسترس نیست');
  });

  it('PATCH /api/v1/carts/:id/items/:variantId replaces the quantity', async () => {
    const cartId = await createCartId();
    await addItem(cartId, 'var-1', 2);

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/carts/${cartId}/items/var-1`)
      .send({ quantity: 7 });
    expect(response.status).toBe(200);
    const cart = expectCart(response.status, response.body);

    // Replaced (7), not merged (2 + 7 = 9).
    expect(cart.items[0].quantity).toBe(7);
    expect(cart.items[0].lineTotalMinor).toBe(7 * 1_890_000);
    expect(cart.itemCount).toBe(7);
    expect(cart.subtotalMinor).toBe(7 * 1_890_000);
  });

  it('DELETE /api/v1/carts/:id/items/:variantId removes the line and returns the updated cart', async () => {
    const cartId = await createCartId();
    await addItem(cartId, 'var-1', 2);
    await addItem(cartId, 'var-2', 1);

    const response = await request(app.getHttpServer()).delete(`/api/v1/carts/${cartId}/items/var-1`);
    expect(response.status).toBe(200);
    const cart = expectCart(response.status, response.body);

    expect(cart.items.map((item) => item.variantId)).toEqual(['var-2']);
    expect(cart.lineCount).toBe(1);
    expect(cart.itemCount).toBe(1);
    expect(cart.subtotalMinor).toBe(2_250_000);
  });

  it('PATCH an unknown cart item is rejected with 404', async () => {
    const cartId = await createCartId();
    await addItem(cartId, 'var-1', 2);

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/carts/${cartId}/items/var-2`)
      .send({ quantity: 3 });
    const body = response.body as ApiError;
    expect(response.status).toBe(404);
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe('این مورد در سبد خرید یافت نشد');
  });

  it('DELETE an unknown cart item is rejected with 404', async () => {
    const cartId = await createCartId();

    const response = await request(app.getHttpServer()).delete(
      `/api/v1/carts/${cartId}/items/var-unknown`,
    );
    const body = response.body as ApiError;
    expect(response.status).toBe(404);
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe('این مورد در سبد خرید یافت نشد');
  });

  it('unknown cart ids 404 on every cart route with the Persian message', async () => {
    const unknown = 'cart-does-not-exist';

    const get = await request(app.getHttpServer()).get(`/api/v1/carts/${unknown}`);
    const post = await addItem(unknown, 'var-1', 1);
    const patch = await request(app.getHttpServer())
      .patch(`/api/v1/carts/${unknown}/items/var-1`)
      .send({ quantity: 1 });
    const remove = await request(app.getHttpServer()).delete(`/api/v1/carts/${unknown}/items/var-1`);

    for (const response of [get, post, patch, remove]) {
      const body = response.body as ApiError;
      expect(response.status).toBe(404);
      expect(body.statusCode).toBe(404);
      expect(body.message).toBe('سبد خرید یافت نشد');
    }
  });

  it('quantity 0 or 100 in the body is rejected with 400 and a message array', async () => {
    const cartId = await createCartId();

    const addZero = await addItem(cartId, 'var-1', 0);
    const addHundred = await addItem(cartId, 'var-1', 100);
    const patchZero = await request(app.getHttpServer())
      .patch(`/api/v1/carts/${cartId}/items/var-1`)
      .send({ quantity: 0 });

    for (const response of [addZero, addHundred, patchZero]) {
      const body = response.body as ApiError;
      expect(response.status).toBe(400);
      expect(body.statusCode).toBe(400);
      expect(Array.isArray(body.message)).toBe(true);
      expect((body.message as string[]).length).toBeGreaterThan(0);
    }

    // Rejected requests must never touch storage.
    const after = await request(app.getHttpServer()).get(`/api/v1/carts/${cartId}`);
    const cart = expectCart(after.status, after.body);
    expect(cart.items).toEqual([]);
    expect(cart.subtotalMinor).toBe(0);
  });

  it('a missing variantId in the body is rejected with 400 before any write', async () => {
    const cartId = await createCartId();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/carts/${cartId}/items`)
      .send({ quantity: 1 });
    const body = response.body as ApiError;
    expect(response.status).toBe(400);
    expect(Array.isArray(body.message)).toBe(true);

    const after = await request(app.getHttpServer()).get(`/api/v1/carts/${cartId}`);
    const cart = expectCart(after.status, after.body);
    expect(cart.items).toEqual([]);
  });
});
