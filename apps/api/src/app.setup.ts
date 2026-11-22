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
  // 2mb: RFQ attachments arrive as base64 in JSON (B3-lite; domain caps a
  // single file at 512KB binary ⇒ ≤ ~700KB base64). Other bodies stay small.
  app.use(json({ limit: '2mb' }));
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
