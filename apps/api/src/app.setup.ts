import { INestApplication, ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import helmet from 'helmet';

/** Single source of truth for the API route prefix (shared with e2e tests). */
export const API_PREFIX = 'api/v1';

/**
 * HTTP-layer configuration shared by main.ts and the e2e harness, so tests run
 * against the exact same middleware/pipeline as production.
 */
export function applyAppConfig(app: INestApplication): void {
  app.use(json({ limit: '100kb' }));
  app.use(helmet());
  // Dev-friendly CORS: any origin, no credentials.
  app.enableCors({ origin: true, credentials: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix(API_PREFIX);
}
