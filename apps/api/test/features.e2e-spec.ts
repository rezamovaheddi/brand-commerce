import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';

describe('Features API (e2e) — TASK-196', () => {
  jest.setTimeout(30000);
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    applyAppConfig(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/features returns default evaluation flags', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/features')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.flags).toBeDefined();
    expect(res.body.flags.FEATURE_SAMPLE_BADGES).toBe(true);
    expect(res.body.flags.FEATURE_LOYALTY_PROGRAM).toBe(false);
    expect(res.body.flags.FEATURE_B2B_OEM).toBe(false); // default guest context
  });

  it('GET /api/v1/features respects role header for B2B buyer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/features')
      .set('x-user-role', 'BUYER')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.context.role).toBe('BUYER');
    expect(res.body.flags.FEATURE_B2B_OEM).toBe(true);
  });

  it('GET /api/v1/features/:key returns single flag evaluation and metadata', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/features/FEATURE_SAMPLE_BADGES')
      .expect(200);

    expect(res.body.key).toBe('FEATURE_SAMPLE_BADGES');
    expect(res.body.enabled).toBe(true);
    expect(res.body.defaultValue).toBe(true);
    expect(res.body.description).toContain('honest sample data disclosures');
  });

  it('GET /api/v1/features/:key handles unknown flag safely', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/features/UNKNOWN_FLAG_XYZ')
      .expect(200);

    expect(res.body.key).toBe('UNKNOWN_FLAG_XYZ');
    expect(res.body.enabled).toBe(false);
    expect(res.body.defaultValue).toBe(false);
  });
});
