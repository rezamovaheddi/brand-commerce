import {
  CreateLeadSchema,
  CreateTicketSchema,
  LeadSchema,
  TicketReplySchema,
  TicketSchema,
  type CreateLead,
  type CreateTicket,
  type Lead,
  type Ticket,
  type TicketReply,
} from "@bc/contracts";
import { z } from "zod";
import { CartApiError } from "./cart-client";

/**
 * CRM-lite transport (TASK-099 + K3): guest tickets + leads tracked by id —
 * same unified error design as the other storefront clients.
 */

export { CartApiError };

const BASE = "/backend";

async function requestJson<T>(
  url: string,
  init: RequestInit,
  parse: (body: unknown) => T | null,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new CartApiError("network", "سرویس در دسترس نیست.");
  }
  const raw: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new CartApiError("http", extractApiMessage(raw), response.status);
  }
  const parsed = parse(raw);
  if (parsed === null) {
    throw new CartApiError("parse", "پاسخ نامعتبر بود.", response.status);
  }
  return parsed;
}

function extractApiMessage(raw: unknown): string {
  const obj = raw as { message?: string | string[] } | null;
  if (obj?.message) {
    return Array.isArray(obj.message) ? obj.message.join(" — ") : obj.message;
  }
  return "خطای پردازش درخواست رخ داد.";
}

export async function createTicket(input: CreateTicket): Promise<Ticket> {
  const check = CreateTicketSchema.safeParse(input);
  if (!check.success) {
    const first = check.error.issues[0];
    throw new CartApiError("parse", first ? first.message : "مقادیر نامعتبر است.");
  }
  return requestJson<Ticket>(
    `${BASE}/support/tickets`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    (body) => (TicketSchema.safeParse(body).success ? (body as Ticket) : null),
  );
}

export async function getTicket(id: string): Promise<Ticket> {
  return requestJson<Ticket>(
    `${BASE}/support/tickets/${encodeURIComponent(id)}`,
    { method: "GET" },
    (body) => (TicketSchema.safeParse(body).success ? (body as Ticket) : null),
  );
}

export async function replyToTicket(id: string, input: TicketReply): Promise<Ticket> {
  const check = TicketReplySchema.safeParse(input);
  if (!check.success) {
    const first = check.error.issues[0];
    throw new CartApiError("parse", first ? first.message : "متن پاسخ نامعتبر است.");
  }
  return requestJson<Ticket>(
    `${BASE}/support/tickets/${encodeURIComponent(id)}/replies`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    (body) => (TicketSchema.safeParse(body).success ? (body as Ticket) : null),
  );
}

export async function createLead(input: CreateLead): Promise<Lead> {
  const check = CreateLeadSchema.safeParse(input);
  if (!check.success) {
    const first = check.error.issues[0];
    throw new CartApiError("parse", first ? first.message : "مقادیر نامعتبر است.");
  }
  return requestJson<Lead>(
    `${BASE}/support/leads`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    (body) => (LeadSchema.safeParse(body).success ? (body as Lead) : null),
  );
}

/* ---- admin CRM (keyed console) ---------------------------------------------- */

const AdminTicket = z.object({
  id: z.string(),
  status: z.string(),
  priority: z.string(),
  category: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  messages: z.array(
    z.object({
      id: z.string(),
      author: z.string(),
      body: z.string(),
      createdAt: z.string(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AdminTicketRow = z.infer<typeof AdminTicket>;

const AdminLead = z.object({
  id: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  message: z.string(),
  source: z.string(),
  status: z.string(),
  createdAt: z.string(),
});
export type AdminLeadRow = z.infer<typeof AdminLead>;

const AdminCustomerProfile = z.object({
  phone: z.string(),
  ordersCount: z.number(),
  paidTotalMinor: z.number(),
  lastOrderAt: z.string().nullable(),
  lastOrderStatus: z.string().nullable(),
  ticketsCount: z.number(),
  applicationsCount: z.number(),
  organizationName: z.string().nullable(),
});
export type AdminCustomerProfile = z.infer<typeof AdminCustomerProfile>;

function adminHeaders(key: string): HeadersInit {
  return { "x-admin-key": key };
}

export async function adminListTickets(key: string, status?: string): Promise<AdminTicketRow[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return requestJson<AdminTicketRow[]>(
    `${BASE}/admin/crm/tickets${query}`,
    { method: "GET", headers: adminHeaders(key) },
    (body) => {
      const parsed = z.object({ items: z.array(AdminTicket) }).safeParse(body);
      return parsed.success ? parsed.data.items : null;
    },
  );
}

export async function adminReplyTicket(key: string, id: string, body: string): Promise<Ticket> {
  return requestJson<Ticket>(
    `${BASE}/admin/crm/tickets/${encodeURIComponent(id)}/replies`,
    { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ body }) },
    (raw) => (TicketSchema.safeParse(raw).success ? (raw as Ticket) : null),
  );
}

export async function adminUpdateTicket(
  key: string,
  id: string,
  input: { status?: string; priority?: string },
): Promise<Ticket> {
  return requestJson<Ticket>(
    `${BASE}/admin/crm/tickets/${encodeURIComponent(id)}/update`,
    { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(input) },
    (raw) => (TicketSchema.safeParse(raw).success ? (raw as Ticket) : null),
  );
}

export async function adminListLeads(key: string, status?: string): Promise<AdminLeadRow[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return requestJson<AdminLeadRow[]>(
    `${BASE}/admin/crm/leads${query}`,
    { method: "GET", headers: adminHeaders(key) },
    (body) => {
      const parsed = z.object({ items: z.array(AdminLead) }).safeParse(body);
      return parsed.success ? parsed.data.items : null;
    },
  );
}

export async function adminUpdateLead(key: string, id: string, status: string): Promise<Lead> {
  return requestJson<Lead>(
    `${BASE}/admin/crm/leads/${encodeURIComponent(id)}/update`,
    { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ status }) },
    (raw) => (LeadSchema.safeParse(raw).success ? (raw as Lead) : null),
  );
}

export async function adminCustomerProfile(key: string, phone: string): Promise<AdminCustomerProfile> {
  return requestJson<AdminCustomerProfile>(
    `${BASE}/admin/crm/customers/${encodeURIComponent(phone)}`,
    { method: "GET", headers: adminHeaders(key) },
    (body) => (AdminCustomerProfile.safeParse(body).success ? (body as AdminCustomerProfile) : null),
  );
}
