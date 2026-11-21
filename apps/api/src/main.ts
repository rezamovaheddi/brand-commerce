import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { API_PREFIX, applyAppConfig } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  applyAppConfig(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Brand Commerce API')
    .setVersion('1.0')
    .addTag('products')
    .addTag('health')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  app.enableShutdownHooks();

  // ConfigModule loads apps/api/.env; resolve PORT through ConfigService so
  // the .env value is honoured reliably (process.env is not yet populated
  // before module initialisation).
  const port = Number(app.get(ConfigService).get<string>('PORT') ?? 3001);
  await app.listen(port);

  new Logger('Bootstrap').log(
    `Brand Commerce API listening on port ${port} (prefix /${API_PREFIX}, docs at /docs)`,
  );
}

void bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error(
    'API bootstrap failed',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
});
