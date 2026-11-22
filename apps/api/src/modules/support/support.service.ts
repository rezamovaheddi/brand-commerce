import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AdminLeadUpdate,
  AdminTicketUpdate,
  CreateLead,
  CreateTicket,
  CustomerProfile,
  Lead,
  LeadStatus,
  Ticket,
  TicketReply,
  TicketStatus,
} from '@bc/contracts';
import { assertTicketTransition, canReplyToTicket } from '@bc/domain';
import { PrismaService } from '../../prisma/prisma.service';

interface TicketRowWithMessages {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  category: 'SUPPORT' | 'SALES' | 'COMPLAINT' | 'ADVERSE_EVENT';
  contactName: string;
  contactPhone: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    ticketId: string;
    author: 'CUSTOMER' | 'AGENT';
    body: string;
    createdAt: Date;
  }>;
}

interface LeadRow {
  id: string;
  contactName: string;
  contactPhone: string;
  message: string;
  source: 'CONTACT_FORM' | 'DEMO_REQUEST';
  status: LeadStatus;
  createdAt: Date;
}

function toTicketContract(row: TicketRowWithMessages): Ticket {
  return {
    id: row.id,
    subject: row.subject ?? '',
    status: row.status,
    priority: row.priority,
    category: row.category,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    messages: row.messages.map((msg) => ({
      id: msg.id,
      ticketId: msg.ticketId,
      author: msg.author,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toLeadContract(row: LeadRow): Lead {
  return {
    id: row.id,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    message: row.message,
    source: row.source,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

const TICKET_INCLUDE = {
  messages: { orderBy: { createdAt: 'asc' as const } },
} as const;

/**
 * CRM-lite (TASK-099 + K3): guest-authored support tickets with an
 * append-only timeline and contact/demo-form leads. Access is by id — the
 * same bootstrap trust level as applications/RFQ tracking until Identity
 * (P7) lands. Sensitive-data restriction (TASK-099 acceptance) is honored by
 * keeping bodies free-text only (no file uploads) and admin access behind
 * AdminKeyGuard.
 */
@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async createTicket(input: CreateTicket): Promise<Ticket> {
    const row = await this.prisma.supportTicket.create({
      data: {
        subject: input.subject,
        status: 'OPEN',
        priority: 'NORMAL',
        category: input.category,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        messages: {
          create: { author: 'CUSTOMER', body: input.body },
        },
      },
      include: TICKET_INCLUDE,
    });
    return toTicketContract(row as unknown as TicketRowWithMessages);
  }

  async getTicket(id: string): Promise<Ticket> {
    const row = await this.prisma.supportTicket.findUnique({ where: { id }, include: TICKET_INCLUDE });
    if (!row) {
      throw new NotFoundException('تیکت یافت نشد');
    }
    return toTicketContract(row as unknown as TicketRowWithMessages);
  }

  /** Customer reply — forbidden on CLOSED (lifecycle rule from @bc/domain). */
  async replyToTicket(id: string, input: TicketReply): Promise<Ticket> {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id }, select: { status: true } });
    if (!ticket) {
      throw new NotFoundException('تیکت یافت نشد');
    }
    if (!canReplyToTicket(ticket.status)) {
      throw new BadRequestException('این تیکت بسته شده است — برای پیگیری، تیکت جدیدی باز کنید');
    }
    await this.prisma.ticketMessage.create({
      data: { ticketId: id, author: 'CUSTOMER', body: input.body },
    });
    return this.getTicket(id);
  }

  async listTickets(status?: string): Promise<{ items: Ticket[] }> {
    const rows = await this.prisma.supportTicket.findMany({
      where: status ? { status: status as never } : undefined,
      include: TICKET_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return { items: rows.map((row) => toTicketContract(row as unknown as TicketRowWithMessages)) };
  }

  /** Agent reply appends to the timeline without changing status. */
  async replyAsAgent(id: string, input: TicketReply): Promise<Ticket> {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id }, select: { status: true } });
    if (!ticket) {
      throw new NotFoundException('تیکت یافت نشد');
    }
    if (!canReplyToTicket(ticket.status)) {
      throw new BadRequestException('تیکت بسته‌شده قابل پاسخ نیست');
    }
    await this.prisma.ticketMessage.create({
      data: { ticketId: id, author: 'AGENT', body: input.body },
    });
    return this.getTicket(id);
  }

  /** Status follows the domain state machine; priority is a free update. */
  async updateTicket(id: string, input: AdminTicketUpdate): Promise<Ticket> {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id }, select: { status: true } });
    if (!ticket) {
      throw new NotFoundException('تیکت یافت نشد');
    }
    if (input.status !== undefined && input.status !== ticket.status) {
      try {
        assertTicketTransition(ticket.status, input.status);
      } catch {
        throw new BadRequestException(
          `تغییر وضعیت از ${ticket.status} به ${input.status} مجاز نیست`,
        );
      }
    }
    await this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
      },
    });
    return this.getTicket(id);
  }

  async createLead(input: CreateLead): Promise<Lead> {
    const row = await this.prisma.crmLead.create({
      data: {
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        message: input.message,
        source: input.source,
        status: 'NEW',
      },
    });
    return toLeadContract(row as unknown as LeadRow);
  }

  async listLeads(status?: string): Promise<{ items: Lead[] }> {
    const rows = await this.prisma.crmLead.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: rows.map((row) => toLeadContract(row as unknown as LeadRow)) };
  }

  async updateLead(id: string, input: AdminLeadUpdate): Promise<Lead> {
    const lead = await this.prisma.crmLead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException('سرنخ یافت نشد');
    }
    const updated = await this.prisma.crmLead.update({
      where: { id },
      data: { status: input.status },
    });
    return toLeadContract(updated as unknown as LeadRow);
  }

  /**
   * Contact 360-lite: phone-keyed aggregation across commerce + CRM rows.
   * Paid total counts only PAID orders (authoritative status, not display).
   */
  async customerProfile(phone: string): Promise<CustomerProfile> {
    const [orders, ticketsCount, applicationsCount, membership] = await Promise.all([
      this.prisma.order.findMany({
        where: { phone },
        select: { status: true, subtotalMinor: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.supportTicket.count({ where: { contactPhone: phone } }),
      this.prisma.b2BApplication.count({ where: { contactPhone: phone } }),
      this.prisma.organizationMembership.findFirst({
        where: { contactPhone: phone },
        include: { organization: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    const paidTotalMinor = orders
      .filter((order) => order.status === 'PAID')
      .reduce((sum, order) => sum + order.subtotalMinor, 0);
    const last = orders[0];
    return {
      phone,
      ordersCount: orders.length,
      paidTotalMinor,
      lastOrderAt: last ? last.createdAt.toISOString() : null,
      lastOrderStatus: last ? last.status : null,
      ticketsCount,
      applicationsCount,
      organizationName: membership?.organization?.name ?? null,
    };
  }
}
