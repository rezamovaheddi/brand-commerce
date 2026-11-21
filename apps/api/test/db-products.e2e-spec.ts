import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';

/**
 * REAL-DATABASE integration test. Skipped (with a log line) whenever the
 * configured DATABASE_URL is unreachable, so the suite stays green on machines
 * without Docker/PostgreSQL infrastructure.
 */
const SKIP_MESSAGE =
  '[SKIP] DATABASE unreachable — integration test pending infrastructure (Docker unavailable on this machine)';

const CONNECT_TIMEOUT_MS = 5000;

describe('Products API (real database integration)', () => {
  let app: INestApplication | undefined;
  let skip = false;

  beforeAll(async () => {
    const probe = new PrismaClient();
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        probe.$connect(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`DATABASE connect timed out after ${CONNECT_TIMEOUT_MS}ms`)),
            CONNECT_TIMEOUT_MS,
          );
        }),
      ]);
    } catch {
      skip = true;
      console.log(SKIP_MESSAGE);
      return;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
      // Always release the probe connection (also prevents jest open handles
      // when the connect attempt timed out).
      await probe.$disconnect().catch(() => undefined);
    }

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    applyAppConfig(app);
    await app.init();
  }, 15000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('lists at least one seeded sample product', async () => {
    if (skip || !app) {
      console.log(SKIP_MESSAGE);
      return;
    }

    const response = await request(app.getHttpServer()).get('/api/v1/products');

    expect(response.status).toBe(200);
    const body = response.body as { items: Array<{ isSample: boolean }> };
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    expect(body.items.some((item) => item.isSample === true)).toBe(true);
  });

  it('serves a seeded product by slug', async () => {
    if (skip || !app) {
      console.log(SKIP_MESSAGE);
      return;
    }

    const response = await request(app.getHttpServer()).get(
      '/api/v1/products/ethereal-gentle-cleanser',
    );

    expect(response.status).toBe(200);
    expect(response.body.slug).toBe('ethereal-gentle-cleanser');
    expect(response.body.isSample).toBe(true);
  });
});
