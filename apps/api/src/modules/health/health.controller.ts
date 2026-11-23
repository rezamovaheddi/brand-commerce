import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponse, SystemTelemetry } from '@bc/contracts';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Always answers 200; `status` (ok/degraded) and `database` (up/down)
   * describe the dependency state so probes can alert on degradation.
   */
  @Get()
  @ApiOperation({ summary: 'بررسی سلامت عمومی سرویس و دیتابیس' })
  @ApiOkResponse({
    description: 'Health snapshot of the API and its database dependency',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        uptime: { type: 'number', example: 12.34 },
        database: { type: 'string', example: 'up' },
      },
    },
  })
  async check(): Promise<HealthResponse> {
    let database = 'down';
    try {
      // Cheap round-trip to confirm the Prisma connection is alive.
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      uptime: process.uptime(),
      database,
    };
  }

  /**
   * Kubernetes / container liveness probe: answers 200 when process is responsive.
   */
  @Get('liveness')
  @ApiOperation({ summary: 'پروب حیات (Liveness Probe)' })
  @ApiOkResponse({ description: 'پروسه فعال و پاسخگوست', type: Object })
  liveness(): { status: string; uptime: number } {
    return {
      status: 'ok',
      uptime: process.uptime(),
    };
  }

  /**
   * Readiness probe: answers 200 when database connectivity is verified, or 503 if not ready.
   */
  @Get('readiness')
  @ApiOperation({ summary: 'پروب آمادگی ترافیک (Readiness Probe)' })
  async readiness(@Res({ passthrough: true }) res: Response): Promise<{ status: string; database: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'up' };
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'not_ready', database: 'down' };
    }
  }

  /**
   * Detailed system telemetry (GAP-033 / S-019):
   * Reports memory usage, process uptime, node runtime, environment, and DB connectivity.
   */
  @Get('telemetry')
  @ApiOperation({ summary: 'تله‌متری جامع سیستم و مصرف منابع (GAP-033)' })
  @ApiOkResponse({ description: 'داده‌های تله‌متری زنده حافظه و سیستم', type: Object })
  async telemetry(): Promise<SystemTelemetry> {
    let database = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    const mem = process.memoryUsage();
    const toMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100;

    return {
      status: database === 'up' ? 'healthy' : 'degraded',
      uptime: Math.round(process.uptime() * 10) / 10,
      database,
      nodeVersion: process.version,
      memory: {
        rssMb: toMb(mem.rss),
        heapUsedMb: toMb(mem.heapUsed),
        heapTotalMb: toMb(mem.heapTotal),
        externalMb: toMb(mem.external),
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  }
}

