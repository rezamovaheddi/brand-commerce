import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { B2BApplication, CreateB2BApplication } from '@bc/contracts';
import { PrismaService } from '../../prisma/prisma.service';

const APP_SELECT = {
  id: true,
  contactName: true,
  contactPhone: true,
  orgName: true,
  economicCode: true,
  licenseRef: true,
  status: true,
  reviewNote: true,
  createdAt: true,
} as const;

type B2BApplicationRow = {
  id: string;
  contactName: string;
  contactPhone: string;
  orgName: string;
  economicCode: string | null;
  licenseRef: string | null;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';
  reviewNote: string | null;
  createdAt: Date;
};

function toApplicationContract(row: B2BApplicationRow): B2BApplication {
  return {
    id: row.id,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    orgName: row.orgName,
    economicCode: row.economicCode,
    licenseRef: row.licenseRef,
    status: row.status,
    reviewNote: row.reviewNote,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * B2B onboarding scaffold (P4 slice — decision-independent).
 * Submit → admin review → approve creates Organization + OWNER membership.
 * Contract pricing (D-11) and credit (D-12) stay feature-gated OFF; the
 * portal itself is NOT activated until those decisions land (honest state).
 */
@Injectable()
export class B2bService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(input: CreateB2BApplication): Promise<B2BApplication> {
    const row = await this.prisma.b2BApplication.create({
      data: {
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        orgName: input.orgName,
        economicCode: input.economicCode ?? null,
        licenseRef: input.licenseRef ?? null,
        status: 'SUBMITTED',
      },
      select: APP_SELECT,
    });
    return toApplicationContract(row as unknown as B2BApplicationRow);
  }

  async get(id: string): Promise<B2BApplication> {
    const row = await this.prisma.b2BApplication.findUnique({ where: { id }, select: APP_SELECT });
    if (!row) {
      throw new NotFoundException('درخواست یافت نشد');
    }
    return toApplicationContract(row as unknown as B2BApplicationRow);
  }

  async list(status?: string): Promise<{ items: B2BApplication[] }> {
    const rows = await this.prisma.b2BApplication.findMany({
      where: status ? { status: status as Prisma.EnumB2BApplicationStatusFilter['equals'] } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: APP_SELECT,
    });
    return { items: rows.map((row) => toApplicationContract(row as unknown as B2BApplicationRow)) };
  }

  /** Admin decision: approve → Organization + OWNER membership (atomic). */
  async approve(id: string, note: string): Promise<B2BApplication> {
    const row = await this.getApplicationRow(id);
    if (row.status === 'APPROVED') {
      throw new BadRequestException('این درخواست قبلاً تأیید شده است');
    }
    if (row.status === 'REJECTED') {
      throw new BadRequestException('درخواست رد‌شده قابل تأیید نیست — درخواست جدید ثبت کنید');
    }
    await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: row.orgName, isSample: true, status: 'ACTIVE' },
      });
      await tx.organizationMembership.create({
        data: {
          organizationId: organization.id,
          contactName: row.contactName,
          contactPhone: row.contactPhone,
          role: 'OWNER',
        },
      });
      await tx.b2BApplication.update({
        where: { id },
        data: { status: 'APPROVED', reviewNote: note, reviewedAt: new Date() },
      });
    });
    return this.get(id);
  }

  async reject(id: string, note: string): Promise<B2BApplication> {
    const row = await this.getApplicationRow(id);
    if (row.status === 'APPROVED') {
      throw new BadRequestException('درخواست تأییدشده قابل رد نیست');
    }
    await this.prisma.b2BApplication.update({
      where: { id },
      data: { status: 'REJECTED', reviewNote: note, reviewedAt: new Date() },
    });
    return this.get(id);
  }

  async requestInfo(id: string, note: string): Promise<B2BApplication> {
    const row = await this.getApplicationRow(id);
    if (row.status === 'APPROVED' || row.status === 'REJECTED') {
      throw new BadRequestException('برای درخواست نهایی‌شده امکان ثبت نقص وجود ندارد');
    }
    await this.prisma.b2BApplication.update({
      where: { id },
      data: { status: 'NEEDS_INFO', reviewNote: note },
    });
    return this.get(id);
  }

  private async getApplicationRow(id: string): Promise<B2BApplicationRow> {
    const row = await this.prisma.b2BApplication.findUnique({ where: { id }, select: APP_SELECT });
    if (!row) {
      throw new NotFoundException('درخواست یافت نشد');
    }
    return row as unknown as B2BApplicationRow;
  }
}
