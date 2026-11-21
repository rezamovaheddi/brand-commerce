import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AcceptQuote,
  B2BApplication,
  CreateB2BApplication,
  CreateRfq,
  IssueQuote,
  OrgMe,
  Order,
  Quote,
  QuoteRevision,
  Rfq,
} from '@bc/contracts';
import { canActAsOrgBuyer } from '@bc/domain';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { toOrderContract } from '../orders/order.mapper';
import type { OrgMemberContext } from './org-member.guard';

const RFQ_INCLUDE = {
  items: true,
  quote: { include: { revisions: { orderBy: { revisionNo: 'asc' as const } } } },
} as const;

interface QuoteLine {
  variantId: string | null;
  productName: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

interface RfqItemRow {
  id: string;
  variantId: string | null;
  productName: string;
  quantity: number;
  note: string | null;
}

interface RfqRowWithRelations {
  id: string;
  status: 'SUBMITTED' | 'PRICED' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'CLOSED';
  orgId: string | null;
  contactName: string;
  contactPhone: string;
  note: string | null;
  createdAt: Date;
  items: RfqItemRow[];
  quote: (QuoteRowWithRevisions & { rfqId: string; status: QuoteRowStatus }) | null;
}

type QuoteRowStatus = 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

interface QuoteRevisionRow {
  id: string;
  revisionNo: number;
  linesJson: unknown;
  subtotalMinor: number;
  currency: string;
  leadTimeDays: number | null;
  paymentTerms: string | null;
  isSample: boolean;
  note: string | null;
  createdAt: Date;
}

interface QuoteRowWithRevisions {
  id: string;
  rfqId: string;
  status: QuoteRowStatus;
  currency: string;
  validUntil: Date;
  createdAt: Date;
  revisions: QuoteRevisionRow[];
}

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

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

  // ---- RFQ / Quote (N11 immutable revisions) ---------------------------------

  /** Public RFQ submit (items with/without variantId — custom lines allowed at intake). */
  async submitRfq(input: CreateRfq): Promise<Rfq> {
    return this.createRfq(input, null);
  }

  /**
   * Org-scoped RFQ submit (N16): bound to the member's organization. Role
   * enforcement is a domain rule — ACCOUNTANT is finance-only.
   */
  async submitOrgRfq(member: OrgMemberContext, input: CreateRfq): Promise<Rfq> {
    if (!canActAsOrgBuyer(member.role)) {
      throw new ForbiddenException('نقش شما (حساب‌دار) اجازه ثبت درخواست قیمت ندارد');
    }
    return this.createRfq(input, member.organizationId);
  }

  private async createRfq(input: CreateRfq, orgId: string | null): Promise<Rfq> {
    const rfq = await this.prisma.rfq.create({
      data: {
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        orgId,
        note: input.note ?? null,
        status: 'SUBMITTED',
        items: {
          create: input.items.map((item) => ({
            variantId: item.variantId ?? null,
            productName: item.productName,
            quantity: item.quantity,
            note: item.note ?? null,
          })),
        },
      },
      include: RFQ_INCLUDE,
    });
    return this.toRfqContract(rfq as unknown as RfqRowWithRelations);
  }

  /** Who the org key belongs to (portal identity banner). */
  async orgMe(member: OrgMemberContext): Promise<OrgMe> {
    return {
      organizationId: member.organizationId,
      organizationName: member.organizationName,
      isSample: member.organizationIsSample,
      memberName: member.memberName,
      role: member.role,
    };
  }

  /** Only THIS organization's RFQs — scoping is in the where clause. */
  async listOrgRfqs(member: OrgMemberContext, status?: string): Promise<{ items: Rfq[] }> {
    const rows = await this.prisma.rfq.findMany({
      where: {
        orgId: member.organizationId,
        ...(status ? { status: status as Prisma.EnumRfqStatusFilter['equals'] } : {}),
      },
      include: RFQ_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: rows.map((row) => this.toRfqContract(row as unknown as RfqRowWithRelations)) };
  }

  /**
   * Cross-org read is answered with 404 — an org must not learn that another
   * organization's RFQ id exists.
   */
  async getOrgRfq(member: OrgMemberContext, id: string): Promise<Rfq> {
    const row = await this.prisma.rfq.findUnique({ where: { id }, include: RFQ_INCLUDE });
    if (!row || row.orgId !== member.organizationId) {
      throw new NotFoundException('درخواست قیمت یافت نشد');
    }
    return this.toRfqContract(row as unknown as RfqRowWithRelations);
  }

  async getRfq(id: string): Promise<Rfq> {
    const row = await this.prisma.rfq.findUnique({ where: { id }, include: RFQ_INCLUDE });
    if (!row) {
      throw new NotFoundException('درخواست قیمت یافت نشد');
    }
    return this.toRfqContract(row as unknown as RfqRowWithRelations);
  }

  async listRfqs(status?: string): Promise<{ items: Rfq[] }> {
    const rows = await this.prisma.rfq.findMany({
      where: status ? { status: status as Prisma.EnumRfqStatusFilter['equals'] } : undefined,
      include: RFQ_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: rows.map((row) => this.toRfqContract(row as unknown as RfqRowWithRelations)) };
  }

  /**
   * Admin issues Quote + Revision 1 (APPEND-ONLY). Every RFQ line must carry a
   * variantId — unit prices are resolved SERVER-SIDE from the catalog and
   * marked isSample=true (real contract pricing awaits D-11).
   */
  async issueQuote(rfqId: string, input: IssueQuote): Promise<Quote> {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId }, include: RFQ_INCLUDE });
    if (!rfq) {
      throw new NotFoundException('درخواست قیمت یافت نشد');
    }
    if (rfq.status === 'ACCEPTED' || rfq.status === 'CLOSED' || rfq.status === 'REJECTED') {
      throw new BadRequestException('این درخواست قیمت قابل قیمت‌گذاری نیست');
    }
    if (rfq.items.some((item) => item.variantId === null)) {
      throw new BadRequestException(
        'برای صدور پیش‌فاکتور همه اقلام باید محصول مشخص داشته باشند (خط سفارشی در فاز OEM)',
      );
    }
    const lines = await this.resolveLines(rfq.items);
    const subtotalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
    const validUntil = new Date(Date.now() + input.validityDays * 24 * 60 * 60 * 1000);
    const quote = await this.prisma.$transaction(async (tx) => {
      const created = await tx.quote.create({
        data: {
          rfqId,
          status: 'SENT',
          currency: 'IRR',
          validUntil,
        },
      });
      await tx.quoteRevision.create({
        data: {
          quoteId: created.id,
          revisionNo: 1,
          linesJson: lines as unknown as Prisma.InputJsonValue,
          subtotalMinor,
          currency: 'IRR',
          leadTimeDays: input.leadTimeDays ?? null,
          paymentTerms: input.paymentTerms ?? null,
          isSample: true,
          note: input.note ?? null,
        },
      });
      await tx.rfq.update({ where: { id: rfqId }, data: { status: 'QUOTED' } });
      return created;
    });
    return this.getQuote(quote.id);
  }

  /** Appends an immutable Revision n+1 (prior revisions are never edited). */
  async addRevision(quoteId: string, input: IssueQuote): Promise<Quote> {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true, revisions: { orderBy: { revisionNo: 'desc' }, take: 1 } },
    });
    if (!quote) {
      throw new NotFoundException('پیش‌فاکتور یافت نشد');
    }
    if (quote.status === 'ACCEPTED') {
      throw new BadRequestException('پیش‌فاکتور پذیرفته‌شده قابل بازنگری نیست');
    }
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: quote.rfqId },
      include: RFQ_INCLUDE,
    });
    if (!rfq) {
      throw new NotFoundException('درخواست قیمت یافت نشد');
    }
    const lines = await this.resolveLines(rfq.items);
    const subtotalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
    const validUntil = new Date(Date.now() + input.validityDays * 24 * 60 * 60 * 1000);
    const nextRevisionNo = (quote.revisions[0]?.revisionNo ?? 0) + 1;
    await this.prisma.$transaction(async (tx) => {
      await tx.quoteRevision.create({
        data: {
          quoteId,
          revisionNo: nextRevisionNo,
          linesJson: lines as unknown as Prisma.InputJsonValue,
          subtotalMinor,
          currency: 'IRR',
          leadTimeDays: input.leadTimeDays ?? null,
          paymentTerms: input.paymentTerms ?? null,
          isSample: true,
          note: input.note ?? null,
        },
      });
      await tx.quote.update({
        where: { id: quoteId },
        data: { status: 'SENT', validUntil },
      });
      await tx.rfq.update({ where: { id: quote.rfqId }, data: { status: 'QUOTED' } });
    });
    return this.getQuote(quoteId);
  }

  /**
   * Customer accepts a SENT, unexpired quote → atomic conversion to a real
   * DRAFT order with server-side snapshots + inventory reservation (409 on
   * shortage). The order then flows through the normal payment path.
   */
  async acceptQuote(quoteId: string, address: AcceptQuote): Promise<{ order: Order; quote: Quote }> {
    const quote = await this.fetchQuoteWithRevisions(quoteId);
    if (!quote) {
      throw new NotFoundException('پیش‌فاکتور یافت نشد');
    }
    await this.assertAcceptable(quote);
    return this.convertQuoteToOrder(quote, address);
  }

  /**
   * Org-scoped accept (N16). Scoping runs BEFORE any status gate: a foreign
   * org gets 404 whether the quote is SENT, ACCEPTED or expired — no
   * existence/status leak. Role rule (ACCOUNTANT) is next, then the shared
   * state gates.
   */
  async acceptOrgQuote(member: OrgMemberContext, quoteId: string, address: AcceptQuote): Promise<{ order: Order; quote: Quote }> {
    const quote = await this.fetchQuoteWithRevisions(quoteId);
    if (!quote || quote.rfq === null || quote.rfq.orgId !== member.organizationId) {
      throw new NotFoundException('پیش‌فاکتور یافت نشد');
    }
    if (!canActAsOrgBuyer(member.role)) {
      throw new ForbiddenException('نقش شما (حساب‌دار) اجازه پذیرش پیش‌فاکتور ندارد');
    }
    await this.assertAcceptable(quote);
    return this.convertQuoteToOrder(quote, address);
  }

  /** Fetch quote + latest revision + owning RFQ's orgId (no state gates). */
  private async fetchQuoteWithRevisions(
    quoteId: string,
  ): Promise<(QuoteRowWithRevisions & { rfq: { orgId: string | null } | null }) | null> {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: { select: { orgId: true } }, revisions: { orderBy: { revisionNo: 'desc' }, take: 1 } },
    });
    return (quote as unknown as QuoteRowWithRevisions & { rfq: { orgId: string | null } | null }) ?? null;
  }

  /** Shared status/expiry gate for both public and org-scoped accept. */
  private async assertAcceptable(
    quote: QuoteRowWithRevisions & { rfq: { orgId: string | null } | null },
  ): Promise<void> {
    if (quote.status === 'ACCEPTED') {
      throw new BadRequestException('این پیش‌فاکتور قبلاً پذیرفته شده است');
    }
    if (quote.status !== 'SENT') {
      throw new BadRequestException('این پیش‌فاکتور قابل پذیرش نیست');
    }
    if (quote.validUntil.getTime() < Date.now()) {
      await this.prisma.quote.update({ where: { id: quote.id }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('پیش‌فاکتور منقضی شده است');
    }
    const latest = quote.revisions[0];
    if (!latest || latest.linesJson === null) {
      throw new BadRequestException('پیش‌فاکتور بدون قلم قابل پذیرش نیست');
    }
  }

  /** Atomic conversion: order + immutable line snapshots + inventory reserve. */
  private async convertQuoteToOrder(
    quote: QuoteRowWithRevisions & { rfq: { orgId: string | null } | null },
    address: AcceptQuote,
  ): Promise<{ order: Order; quote: Quote }> {
    const quoteId = quote.id;
    const latest = quote.revisions[0] as QuoteRevisionRow;
    const lines = latest.linesJson as unknown as QuoteLine[];

    let createdId: string;
    try {
      createdId = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            status: 'DRAFT',
            currency: quote.currency,
            itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
            subtotalMinor: latest.subtotalMinor,
            fullName: address.fullName,
            phone: address.phone,
            province: address.province,
            city: address.city,
            postalCode: address.postalCode,
            addressLine: address.addressLine,
          },
        });
        await tx.orderLine.createMany({
          data: lines.map((line) => ({
            orderId: order.id,
            variantId: line.variantId ?? '',
            sku: 'RFQ',
            productNameFa: line.productName,
            productNameEn: line.productName,
            titleFa: line.productName,
            titleEn: line.productName,
            quantity: line.quantity,
            unitPriceMinor: line.unitPriceMinor,
            currency: latest.currency,
            lineTotalMinor: line.lineTotalMinor,
          })),
        });
        await this.inventoryService.reserveInTx(
          tx,
          order.id,
          lines
            .filter((line) => line.variantId !== null)
            .map((line) => ({ variantId: line.variantId as string, quantity: line.quantity })),
        );
        await tx.quote.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } });
        await tx.rfq.update({ where: { id: quote.rfqId }, data: { status: 'ACCEPTED' } });
        return order.id;
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error; // 409 'موجودی کافی نیست' — inventory guard
      }
      throw error;
    }

    const orderRow = await this.prisma.order.findUnique({
      where: { id: createdId },
      include: { lines: true },
    });
    if (!orderRow) {
      throw new Error('quote accept: order vanished after transaction');
    }
    return { order: toOrderContract(orderRow), quote: await this.getQuote(quoteId) };
  }

  async getQuote(id: string): Promise<Quote> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { revisions: { orderBy: { revisionNo: 'asc' } } },
    });
    if (!quote) {
      throw new NotFoundException('پیش‌فاکتور یافت نشد');
    }
    return this.toQuoteContract(quote as unknown as QuoteRowWithRevisions);
  }

  /** Resolves RFQ lines to server-priced catalog lines (all must have variantId). */
  private async resolveLines(
    items: Array<{ variantId: string | null; productName: string; quantity: number }>,
  ): Promise<QuoteLine[]> {
    const lines: QuoteLine[] = [];
    for (const item of items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId as string },
        include: { product: true },
      });
      if (!variant || variant.status !== 'ACTIVE' || variant.product.status !== 'ACTIVE') {
        throw new NotFoundException(`محصول خط «${item.productName}» برای فروش در دسترس نیست`);
      }
      lines.push({
        variantId: variant.id,
        productName: variant.product.nameFa,
        quantity: item.quantity,
        unitPriceMinor: variant.priceMinor,
        lineTotalMinor: variant.priceMinor * item.quantity,
      });
    }
    return lines;
  }

  private toQuoteContract(quote: QuoteRowWithRevisions): Quote {
    return {
      id: quote.id,
      rfqId: quote.rfqId,
      status: quote.status,
      currency: quote.currency,
      validUntil: quote.validUntil.toISOString(),
      revisions: quote.revisions.map((revision) => ({
        id: revision.id,
        revisionNo: revision.revisionNo,
        lines: revision.linesJson as unknown as QuoteRevision['lines'],
        subtotalMinor: revision.subtotalMinor,
        currency: revision.currency,
        leadTimeDays: revision.leadTimeDays,
        paymentTerms: revision.paymentTerms,
        isSample: true,
        note: revision.note,
        createdAt: revision.createdAt.toISOString(),
      })),
    };
  }

  private toRfqContract(row: RfqRowWithRelations): Rfq {
    return {
      id: row.id,
      status: row.status,
      orgId: row.orgId ?? null,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      items: row.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        productName: item.productName,
        quantity: item.quantity,
        note: item.note,
      })),
      note: row.note,
      quote: row.quote ? this.toQuoteContract(row.quote as unknown as QuoteRowWithRevisions) : null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
