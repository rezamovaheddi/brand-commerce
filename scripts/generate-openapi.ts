import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../apps/api/src/app.module';
import { applyAppConfig } from '../apps/api/src/app.setup';

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  applyAppConfig(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Brand Commerce API')
    .setDescription('Full OpenAPI specification for Brand Commerce Platform (Dermavia)')
    .setVersion('1.0')
    .addTag('products', 'Catalog and inventory products')
    .addTag('cart', 'Customer cart operations')
    .addTag('checkout', 'Order checkout with snapshot pricing')
    .addTag('payments', 'Sandbox payment adapter & confirmation')
    .addTag('b2b', 'B2B Wholesale portal and organizations')
    .addTag('rfq', 'Request for Quote & revision workflow')
    .addTag('crm', 'Customer Support tickets and 360 profile')
    .addTag('inventory', 'Atomic raw-SQL stock guard and adjustments')
    .addTag('ledger', 'Append-only financial transaction ledger')
    .addTag('health', 'Liveness and database connectivity probes')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const outPath = resolve('apps/api/openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2) + '\n', 'utf8');
  console.log(
    `OpenAPI specification successfully exported to ${outPath} with ${Object.keys(document.paths).length} endpoints.`,
  );
  await app.close();
  process.exit(0);
}

generate().catch((err: unknown) => {
  console.error('Failed to generate OpenAPI spec:', err);
  process.exit(1);
});
