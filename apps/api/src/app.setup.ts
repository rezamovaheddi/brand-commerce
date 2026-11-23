import { INestApplication, ValidationPipe } from '@nestjs/common';
import { json, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { randomUUID } from 'crypto';

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

  // GAP-009 / S-017: Request ID & Correlation middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const rawId = req.header('x-request-id') || req.header('x-correlation-id');
    const requestId =
      rawId && /^[a-zA-Z0-9_-]{1,64}$/.test(rawId) ? rawId : randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    (req as unknown as { requestId: string }).requestId = requestId;
    next();
  });

  // GAP-009 / S-017: Structured HTTP Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const requestId = req.headers['x-request-id'];
      if (process.env.NODE_ENV !== 'test') {
        const timestamp = new Date().toISOString();
        const level =
          res.statusCode >= 500
            ? 'ERROR'
            : res.statusCode >= 400
              ? 'WARN'
              : 'INFO';
        const logLine = `[HTTP] ${timestamp} [${requestId}] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${durationMs}ms`;
        if (level === 'ERROR') {
          console.error(logLine);
        } else if (level === 'WARN') {
          console.warn(logLine);
        } else {
          console.log(logLine);
        }
      }
    });
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix(API_PREFIX);
}
