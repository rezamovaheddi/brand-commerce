import { createHash, randomBytes } from 'crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AdminInventoryItem,
  AdminLedgerResponse,
  AdminOrderListResponse,
  AdjustStock,
  B2BApplication,
  CreateOrgMember,
  OrgMember,
} from '@bc/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { B2bService } from '../b2b/b2b.service';
import type { Rfq } from '@bc/contracts';

interface MembershipRow {
  id: string;
  organizationId: string;
  contactName: string;
  contactPhone: string;
  email: string | null;
  role: 'OWNER' | 'BUYER' | 'ACCOUNTANT';
  keyHash: string | null;
  keyLast4: string | null;
  keyRevokedAt: Date | null;
  createdAt: Date;
}

function toOrgMemberContract(row: MembershipRow): OrgMember {
  return {
    id: row.id,
    organizationId: row.organizationId,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    email: row.email ?? '',
    role: row.role,
    hasKey: row.keyHash !== null,
    keyLast4: row.keyLast4,
    keyRevokedAt: row.keyRevokedAt ? row.keyRevokedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

const ORDER_INCLUDE = { lines: true } as const;

/**
 * Operator console queries (bootstrap backoffice). Read-heavy; the single
 * write is a guarded, ledgered stock ADJUSTMENT.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly b2bService: B2bService,
  ) {}

  async listOrders(
    page: number,
    limit: number,
    status?: string,
  ): Promise<AdminOrderListResponse> {
    const where: Prisma.OrderWhereInput = status ? { status: status as Prisma.EnumOrderStatusFilter['equals'] } : {};
    const rows = await this.prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await this.prisma.order.count({ where });
    return {
      items: rows.map((row) => ({
        id: row.id,
        status: row.status,
        itemCount: row.itemCount,
        subtotalMinor: row.subtotalMinor,
        currency: row.currency,
        customerName: row.fullName,
        customerPhone: row.phone,
        lineCount: row.lines.length,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listInventory(): Promise<AdminInventoryItem[]> {
    const rows = await this.prisma.inventoryItem.findMany({
      include: {
        variant: { include: { product: { select: { nameFa: true } } } },
      },
      orderBy: { variantId: 'asc' },
    });
    return rows.map((row) => ({
      variantId: row.variantId,
      sku: row.variant?.sku ?? '',
      productNameFa: row.variant?.product?.nameFa ?? '',
      onHand: row.onHand,
      reserved: row.reserved,
      availableToSell: Math.max(0, row.onHand - row.reserved),
    }));
  }

  /** Guarded, ledgered stock adjustment (operator correction). */
  async adjustStock(variantId: string, input: AdjustStock): Promise<AdminInventoryItem> {
    const inventory = await this.prisma.inventoryItem.findUnique({
      where: { variantId },
    });
    if (!inventory) {
      throw new NotFoundException('این واریانت موجودی ثبت‌شده ندارد');
    }
    if (inventory.onHand + input.deltaOnHand < 0) {
      throw new BadRequestException('موجودی نهایی نمی‌تواند منفی شود');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { variantId },
        data: { onHand: { increment: input.deltaOnHand } },
      });
      await tx.inventoryLedger.create({
        data: {
          variantId,
          deltaOnHand: input.deltaOnHand,
          deltaReserved: 0,
          reason: 'ADJUSTMENT',
          refType: 'admin',
          refId: input.note,
        },
      });
    });
    const updated = await this.prisma.inventoryItem.findUniqueOrThrow({
      where: { variantId },
      include: { variant: { include: { product: { select: { nameFa: true } } } } },
    });
    return {
      variantId,
      sku: updated.variant?.sku ?? '',
      productNameFa: updated.variant?.product?.nameFa ?? '',
      onHand: updated.onHand,
      reserved: updated.reserved,
      availableToSell: Math.max(0, updated.onHand - updated.reserved),
    };
  }

  async listLedger(variantId?: string): Promise<AdminLedgerResponse> {
    const rows = await this.prisma.inventoryLedger.findMany({
      where: variantId ? { variantId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        variantId: row.variantId,
        deltaOnHand: row.deltaOnHand,
        deltaReserved: row.deltaReserved,
        reason: row.reason,
        refType: row.refType,
        refId: row.refId,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  // ---- B2B application review ---------------------------------------------

  async listB2BApplications(status?: string): Promise<{ items: B2BApplication[] }> {
    return this.b2bService.list(status);
  }

  async approveB2B(id: string, note: string): Promise<B2BApplication> {
    return this.b2bService.approve(id, note);
  }

  async rejectB2B(id: string, note: string): Promise<B2BApplication> {
    return this.b2bService.reject(id, note);
  }

  async requestInfoB2B(id: string, note: string): Promise<B2BApplication> {
    return this.b2bService.requestInfo(id, note);
  }

  async listRfqs(status?: string): Promise<{ items: Rfq[] }> {
    return this.b2bService.listRfqs(status);
  }

  async issueQuote(id: string, input: Parameters<B2bService['issueQuote']>[1]): Promise<unknown> {
    return this.b2bService.issueQuote(id, input);
  }

  async addRevision(id: string, input: Parameters<B2bService['addRevision']>[1]): Promise<unknown> {
    return this.b2bService.addRevision(id, input);
  }

  async downloadRfqAttachment(
    rfqId: string,
    attachmentId: string,
  ): Promise<{ meta: { filename: string; mime: string }; data: Buffer }> {
    return this.b2bService.getRfqAttachment(rfqId, attachmentId);
  }

  async downloadApplicationAttachment(
    applicationId: string,
    attachmentId: string,
  ): Promise<{ meta: { filename: string; mime: string }; data: Buffer }> {
    return this.b2bService.getApplicationAttachment(applicationId, attachmentId);
  }

  // ---- Organization members + access keys (N16) ------------------------------

  async listOrganizations(): Promise<{
    items: Array<{ id: string; name: string; isSample: boolean; status: string; memberCount: number; createdAt: string }>;
  }> {
    const rows = await this.prisma.organization.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        isSample: row.isSample,
        status: row.status,
        memberCount: row._count.members,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async listOrgMembers(organizationId: string): Promise<{ items: OrgMember[] }> {
    const rows = await this.prisma.organizationMembership.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    return { items: rows.map((row) => toOrgMemberContract(row as unknown as MembershipRow)) };
  }

  /**
   * Creates a member and issues their access key. The plaintext key is
   * returned EXACTLY ONCE here — only the SHA-256 hash is stored, so a lost
   * key is replaced (re-issued), never recovered.
   */
  async createOrgMember(organizationId: string, input: CreateOrgMember): Promise<OrgMember & { accessKey: string }> {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw new NotFoundException('سازمان یافت نشد');
    }
    const accessKey = `dvorg_${randomBytes(16).toString('hex')}`;
    let row: MembershipRow;
    try {
      const created = await this.prisma.organizationMembership.create({
        data: {
          organizationId,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          email: input.email,
          role: input.role,
          keyHash: createHash('sha256').update(accessKey).digest('hex'),
          keyLast4: accessKey.slice(-4),
        },
      });
      row = created as unknown as MembershipRow;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('عضوی با این شماره/نقش یا ایمیل در سازمان وجود دارد');
      }
      throw error;
    }
    return { ...toOrgMemberContract(row), accessKey };
  }

  /** Re-issues a member's key: old key stops working immediately. */
  async issueOrgMemberKey(memberId: string): Promise<OrgMember & { accessKey: string }> {
    const member = await this.prisma.organizationMembership.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('عضو یافت نشد');
    }
    const accessKey = `dvorg_${randomBytes(16).toString('hex')}`;
    const updated = await this.prisma.organizationMembership.update({
      where: { id: memberId },
      data: {
        keyHash: createHash('sha256').update(accessKey).digest('hex'),
        keyLast4: accessKey.slice(-4),
        keyRevokedAt: null,
      },
    });
    return { ...toOrgMemberContract(updated as unknown as MembershipRow), accessKey };
  }

  async revokeOrgMemberKey(memberId: string): Promise<OrgMember> {
    const member = await this.prisma.organizationMembership.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('عضو یافت نشد');
    }
    if (member.keyRevokedAt !== null) {
      throw new BadRequestException('کلید این عضو قبلاً باطل شده است');
    }
    if (member.keyHash === null) {
      throw new BadRequestException('این عضو کلید سازمانی ندارد');
    }
    const updated = await this.prisma.organizationMembership.update({
      where: { id: memberId },
      data: { keyRevokedAt: new Date() },
    });
    return toOrgMemberContract(updated as unknown as MembershipRow);
  }
}
