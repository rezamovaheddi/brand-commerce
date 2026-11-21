import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Single Prisma connection shared across the whole app
 * (exported globally by PrismaModule).
 *
 * Bootstrap is resilient (DEC-009): an unreachable database must not kill the
 * process — /health reports database:'down' honestly and Prisma reconnects
 * lazily on the first query. Prisma connects lazily by default; $connect() here
 * is only an eager probe, so catching its failure is safe.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.warn(
        `Database unreachable at bootstrap (${error instanceof Error ? error.message : String(error)}) — serving degraded; /health reports database:'down'`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
