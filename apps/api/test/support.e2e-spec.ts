import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  CustomerProfileSchema,
  LeadSchema,
  TicketSchema,
  type CustomerProfile,
  type Lead,
  type Ticket,
} from '@bc/contracts';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * CRM-lite e2e (TASK-099 + K3, in-memory Prisma double): ticket lifecycle per
 * the domain state machine (OPEN→…→CLOSED terminal), append-only timeline,
 * guest replies blocked after close, K3 leads, and the phone-keyed customer
 * 360-lite aggregation (paid total counts only PAID orders).
 */

interface FakeTicketRow {
  id: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  category: 'SUPPORT' | 'SALES' | 'COMPLAINT' | 'ADVERSE_EVENT';
  contactName: string;
  contactPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FakeMessageRow {
  id: string;
  ticketId: string;
  author: 'CUSTOMER' | 'AGENT';
  body: string;
  createdAt: Date;
}

interface FakeLeadRow {
  id: string;
  contactName: string;
  contactPhone: string;
  message: string;
  source: 'CONTACT_FORM' | 'DEMO_REQUEST';
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISCARDED';
  createdAt: Date;
}

const state = {
  tickets: [] as FakeTicketRow[],
  messages: [] as FakeMessageRow[],
  leads: [] as FakeLeadRow[],
  orders: [] as Array<{ phone: string; status: string; subtotalMinor: number; createdAt: Date }>,
  applications: [] as Array<{ contactPhone: string }>,
  memberships: [] as Array<{ contactPhone: string; organization: { name: string } }>,
  ticketSeq: 0,
  messageSeq: 0,
  leadSeq: 0,
};

function resetState(): void {
  state.tickets = [];
  state.messages = [];
  state.leads = [];
  state.orders = [];
  state.applications = [];
  state.memberships = [];
  state.ticketSeq = 0;
  state.messageSeq = 0;
  state.leadSeq = 0;
}

const hydrateTicket = (ticket: FakeTicketRow): FakeTicketRow & { messages: FakeMessageRow[] } => ({
  ...ticket,
  messages: state.messages
    .filter((msg) => msg.ticketId === ticket.id)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
});

const fakePrismaCore = {
  $connect: async (): Promise<void> => undefined,
  $disconnect: async (): Promise<void> => undefined,
  supportTicket: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> & { messages?: { create: Array<Record<string, unknown>> } } }) => {
      state.ticketSeq += 1;
      const ticket: FakeTicketRow = {
        id: `tkt-${state.ticketSeq}`,
        subject: (data.subject as string | undefined) ?? '',
        status: (data.status as FakeTicketRow['status']) ?? 'OPEN',
        priority: (data.priority as FakeTicketRow['priority']) ?? 'NORMAL',
        category: (data.category as FakeTicketRow['category']) ?? 'SUPPORT',
        contactName: data.contactName as string,
        contactPhone: data.contactPhone as string,
        createdAt: new Date('2026-01-14T00:00:00.000Z'),
        updatedAt: new Date('2026-01-14T00:00:00.000Z'),
      };
      state.tickets.push(ticket);
      // Prisma accepts a single object OR an array for nested create.
      const msgCreates = data.messages?.create;
      const msgList = Array.isArray(msgCreates) ? msgCreates : msgCreates ? [msgCreates] : [];
      for (const msg of msgList) {
        state.messageSeq += 1;
        state.messages.push({
          id: `msg-${state.messageSeq}`,
          ticketId: ticket.id,
          author: (msg.author as 'CUSTOMER' | 'AGENT') ?? 'CUSTOMER',
          body: msg.body as string,
          createdAt: new Date('2026-01-14T00:01:00.000Z'),
        });
      }
      return hydrateTicket(ticket);
    }),
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      const ticket = state.tickets.find((row) => row.id === args?.where?.id);
      return ticket ? hydrateTicket(ticket) : null;
    }),
    findMany: jest.fn(async (args?: { where?: { status?: string; contactPhone?: string } }) => {
      let rows = [...state.tickets];
      if (args?.where?.status) {
        rows = rows.filter((row) => row.status === args.where?.status);
      }
      if (args?.where?.contactPhone) {
        rows = rows.filter((row) => row.contactPhone === args.where?.contactPhone);
      }
      return rows
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .map(hydrateTicket);
    }),
    update: jest.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
      const ticket = state.tickets.find((row) => row.id === args.where.id);
      if (!ticket) {
        throw new Error('supportTicket.update: not found');
      }
      Object.assign(ticket, args.data);
      ticket.updatedAt = new Date('2026-01-14T02:00:00.000Z');
      return hydrateTicket(ticket);
    }),
    count: jest.fn(async (args?: { where?: { contactPhone?: string } }) => {
      return state.tickets.filter((row) => row.contactPhone === args?.where?.contactPhone).length;
    }),
  },
  ticketMessage: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.messageSeq += 1;
      const msg: FakeMessageRow = {
        id: `msg-${state.messageSeq}`,
        ticketId: data.ticketId as string,
        author: data.author as 'CUSTOMER' | 'AGENT',
        body: data.body as string,
        createdAt: new Date('2026-01-14T03:00:00.000Z'),
      };
      state.messages.push(msg);
      return msg;
    }),
  },
  crmLead: {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      state.leadSeq += 1;
      const lead: FakeLeadRow = {
        id: `lead-${state.leadSeq}`,
        contactName: data.contactName as string,
        contactPhone: data.contactPhone as string,
        message: data.message as string,
        source: (data.source as FakeLeadRow['source']) ?? 'CONTACT_FORM',
        status: (data.status as FakeLeadRow['status']) ?? 'NEW',
        createdAt: new Date('2026-01-14T04:00:00.000Z'),
      };
      state.leads.push(lead);
      return lead;
    }),
    findUnique: jest.fn(async (args?: { where?: { id?: string } }) => {
      return state.leads.find((row) => row.id === args?.where?.id) ?? null;
    }),
    findMany: jest.fn(async (args?: { where?: { status?: string } }) => {
      let rows = [...state.leads];
      if (args?.where?.status) {
        rows = rows.filter((row) => row.status === args.where?.status);
      }
      return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }),
    update: jest.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
      const lead = state.leads.find((row) => row.id === args.where.id);
      if (!lead) {
        throw new Error('crmLead.update: not found');
      }
      Object.assign(lead, args.data);
      return lead;
    }),
  },
  order: {
    findMany: jest.fn(async (args?: { where?: { phone?: string } }) => {
      return state.orders
        .filter((row) => row.phone === args?.where?.phone)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }),
  },
  b2BApplication: {
    count: jest.fn(async (args?: { where?: { contactPhone?: string } }) => {
      return state.applications.filter((row) => row.contactPhone === args?.where?.contactPhone)
        .length;
    }),
  },
  organizationMembership: {
    findFirst: jest.fn(async (args?: { where?: { contactPhone?: string } }) => {
      return state.memberships.find((row) => row.contactPhone === args?.where?.contactPhone) ?? null;
    }),
  },
};

const fakePrisma = {
  ...fakePrismaCore,
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
    fn(fakePrismaCore as unknown),
} as unknown as PrismaService;

const ADMIN_KEY = 'test-admin-key';

const TICKET_INPUT = {
  subject: 'سفارش من دیر ارسال شده',
  body: 'پنج روز از زمان اعلام‌شده ارسال گذشته و هنوز کد رهگیری ندارم.',
  contactName: 'آرزو کریمی',
  contactPhone: '09123456789',
};

describe('CRM-lite tickets/leads (e2e, in-memory Prisma)', () => {
  let app: INestApplication;
  const admin = { 'x-admin-key': ADMIN_KEY };

  beforeAll(async () => {
    process.env.ADMIN_API_KEY = ADMIN_KEY;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(fakePrisma)
      .compile();
    app = moduleRef.createNestApplication();
    applyAppConfig(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.ADMIN_API_KEY;
  });

  beforeEach(() => {
    resetState();
    jest.clearAllMocks();
  });

  it('creates an OPEN ticket with the first CUSTOMER message', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/support/tickets')
      .send(TICKET_INPUT)
      .expect(201);
    const ticket: Ticket = TicketSchema.parse(res.body);
    expect(ticket.status).toBe('OPEN');
    expect(ticket.priority).toBe('NORMAL');
    expect(ticket.messages).toHaveLength(1);
    expect(ticket.messages[0]?.author).toBe('CUSTOMER');
    expect(ticket.messages[0]?.body).toContain('رهگیری');
  });

  it('tracking a missing ticket is 404', async () => {
    await request(app.getHttpServer()).get('/api/v1/support/tickets/tkt-x').expect(404);
  });

  it('customer reply appends to the append-only timeline', async () => {
    await request(app.getHttpServer()).post('/api/v1/support/tickets').send(TICKET_INPUT).expect(201);
    const res = await request(app.getHttpServer())
      .post('/api/v1/support/tickets/tkt-1/replies')
      .send({ body: 'مجدد بررسی می‌کنید؟' })
      .expect(201);
    const ticket: Ticket = TicketSchema.parse(res.body);
    expect(ticket.messages).toHaveLength(2);
    expect(ticket.messages[1]?.author).toBe('CUSTOMER');
    expect(ticket.status).toBe('OPEN'); // reply does not change status
  });

  it('admin sees the ticket in the list; agent reply lands as AGENT', async () => {
    await request(app.getHttpServer()).post('/api/v1/support/tickets').send(TICKET_INPUT).expect(201);
    const list = await request(app.getHttpServer())
      .get('/api/v1/admin/crm/tickets')
      .set(admin)
      .expect(200);
    expect(list.body.items).toHaveLength(1);
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/crm/tickets/tkt-1/replies')
      .set(admin)
      .send({ body: 'کد رهگیری امروز صادر می‌شود.' })
      .expect(200);
    const ticket: Ticket = TicketSchema.parse(res.body);
    expect(ticket.messages[1]?.author).toBe('AGENT');
  });

  it('valid transitions OPEN → IN_PROGRESS → WAITING_CUSTOMER; illegal jump is 400', async () => {
    await request(app.getHttpServer()).post('/api/v1/support/tickets').send(TICKET_INPUT).expect(201);
    const ok = await request(app.getHttpServer())
      .post('/api/v1/admin/crm/tickets/tkt-1/update')
      .set(admin)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);
    expect(TicketSchema.parse(ok.body).status).toBe('IN_PROGRESS');
    const waiting = await request(app.getHttpServer())
      .post('/api/v1/admin/crm/tickets/tkt-1/update')
      .set(admin)
      .send({ status: 'WAITING_CUSTOMER' })
      .expect(200);
    expect(TicketSchema.parse(waiting.body).status).toBe('WAITING_CUSTOMER');
    // WAITING_CUSTOMER → OPEN is not in the map → 400
    const bad = await request(app.getHttpServer())
      .post('/api/v1/admin/crm/tickets/tkt-1/update')
      .set(admin)
      .send({ status: 'OPEN' });
    expect(bad.status).toBe(400);
    expect(JSON.stringify(bad.body.message)).toContain('مجاز نیست');
  });

  it('RESOLVED can be closed; afterwards replies are rejected (customer + agent)', async () => {
    await request(app.getHttpServer()).post('/api/v1/support/tickets').send(TICKET_INPUT).expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/admin/crm/tickets/tkt-1/update')
      .set(admin)
      .send({ status: 'RESOLVED', priority: 'HIGH' })
      .expect(200);
    const closed = await request(app.getHttpServer())
      .post('/api/v1/admin/crm/tickets/tkt-1/update')
      .set(admin)
      .send({ status: 'CLOSED' })
      .expect(200);
    expect(TicketSchema.parse(closed.body).priority).toBe('HIGH');
    await request(app.getHttpServer())
      .post('/api/v1/support/tickets/tkt-1/replies')
      .send({ body: 'یکی دیگر' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/admin/crm/tickets/tkt-1/replies')
      .set(admin)
      .send({ body: 'پاسخ اپراتور' })
      .expect(400);
    // closed ticket update is also rejected by the state machine
    const reopen = await request(app.getHttpServer())
      .post('/api/v1/admin/crm/tickets/tkt-1/update')
      .set(admin)
      .send({ status: 'OPEN' });
    expect(reopen.status).toBe(400);
  });

  it('K3 lead: contact form creates NEW lead; admin updates its status', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/support/leads')
      .send({
        contactName: 'سرنخ تازه',
        contactPhone: '09122221111',
        message: 'برای فروشگاه خودم درخواست مشاوره دارم.',
      })
      .expect(201);
    const lead: Lead = LeadSchema.parse(created.body);
    expect(lead.status).toBe('NEW');
    expect(lead.source).toBe('CONTACT_FORM');
    const updated = await request(app.getHttpServer())
      .post('/api/v1/admin/crm/leads/lead-1/update')
      .set(admin)
      .send({ status: 'CONTACTED' })
      .expect(200);
    expect(LeadSchema.parse(updated.body).status).toBe('CONTACTED');
    await request(app.getHttpServer())
      .post('/api/v1/admin/crm/leads/lead-x/update')
      .set(admin)
      .send({ status: 'DISCARDED' })
      .expect(404);
  });

  it('customer 360-lite aggregates orders (paid only), tickets, applications, org', async () => {
    state.orders = [
      { phone: '09123456789', status: 'PAID', subtotalMinor: 3_950_000, createdAt: new Date('2026-01-01T00:00:00.000Z') },
      { phone: '09123456789', status: 'AWAITING_PAYMENT', subtotalMinor: 2_000_000, createdAt: new Date('2026-01-02T00:00:00.000Z') },
      { phone: '09120000000', status: 'PAID', subtotalMinor: 9_999_999, createdAt: new Date('2026-01-03T00:00:00.000Z') },
    ];
    state.tickets = [
      {
        id: 'tkt-seed',
        subject: 'seeded',
        status: 'OPEN',
        priority: 'NORMAL',
        category: 'SUPPORT',
        contactName: 'آرزو کریمی',
        contactPhone: '09123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    state.applications = [{ contactPhone: '09123456789' }];
    state.memberships = [{ contactPhone: '09123456789', organization: { name: 'پخش سلامت پویا' } }];

    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/crm/customers/09123456789')
      .set(admin)
      .expect(200);
    const profile: CustomerProfile = CustomerProfileSchema.parse(res.body);
    expect(profile.ordersCount).toBe(2);
    expect(profile.paidTotalMinor).toBe(3_950_000); // only PAID
    expect(profile.lastOrderStatus).toBe('AWAITING_PAYMENT');
    expect(profile.ticketsCount).toBe(1);
    expect(profile.applicationsCount).toBe(1);
    expect(profile.organizationName).toBe('پخش سلامت پویا');

    const empty = await request(app.getHttpServer())
      .get('/api/v1/admin/crm/customers/09100000000')
      .set(admin)
      .expect(200);
    const blank: CustomerProfile = CustomerProfileSchema.parse(empty.body);
    expect(blank.ordersCount).toBe(0);
    expect(blank.paidTotalMinor).toBe(0);
    expect(blank.organizationName).toBeNull();
  });

  it('lists tickets by phone number for guest customer portal (GAP-012)', async () => {
    state.tickets = [
      {
        id: 'tkt-guest-1',
        subject: 'پیگیری ارسال',
        status: 'OPEN',
        priority: 'NORMAL',
        category: 'SUPPORT',
        contactName: 'سارا نوری',
        contactPhone: '09129876543',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const res = await request(app.getHttpServer())
      .get('/api/v1/support/tickets/by-phone/09129876543')
      .expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe('tkt-guest-1');
    expect(res.body.items[0].contactPhone).toBe('09129876543');

    const empty = await request(app.getHttpServer())
      .get('/api/v1/support/tickets/by-phone/09111111111')
      .expect(200);
    expect(empty.body.items).toHaveLength(0);
  });
});
