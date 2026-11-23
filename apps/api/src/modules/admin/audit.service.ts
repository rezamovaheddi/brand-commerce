import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AuditLog } from '@bc/contracts';
import { PrismaService } from '../../prisma/prisma.service';

interface RecordAuditInput {
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  ipAddress?: string | null;
  detailsJson?: unknown;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Appends an immutable audit log record.
   * By architectural design, audit records are write-once and cannot be updated or deleted.
   */
  async record(input: RecordAuditInput): Promise<AuditLog> {
    const row = await this.prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId ?? 'system',
        ipAddress: input.ipAddress ?? null,
        detailsJson: (input.detailsJson as Prisma.InputJsonValue) ?? undefined,
      },
    });

    return {
      id: row.id,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      actorId: row.actorId,
      ipAddress: row.ipAddress,
      detailsJson: row.detailsJson,
      createdAt: row.createdAt.toISOString(),
    };
  }

  /**
   * Lists the most recent audit logs, optionally filtered by entityType or action.
   */
  async list(filter?: { entityType?: string; action?: string; limit?: number }): Promise<{ items: AuditLog[] }> {
    const limit = filter?.limit ?? 50;
    const where: Prisma.AuditLogWhereInput = {
      ...(filter?.entityType ? { entityType: filter.entityType } : {}),
      ...(filter?.action ? { action: filter.action } : {}),
    };

    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });

    return {
      items: rows.map((r) => ({
        id: r.id,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        actorId: r.actorId,
        ipAddress: r.ipAddress,
        detailsJson: r.detailsJson,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
}
