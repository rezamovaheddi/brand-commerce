import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponse } from '@bc/contracts';
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
}
