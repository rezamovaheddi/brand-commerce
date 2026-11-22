"use client";

import { useRef, useState } from "react";
import type { Ticket } from "@bc/contracts";
import {
  CartApiError,
  createLead,
  createTicket,
  getTicket,
  replyToTicket,
} from "../../lib/support-client";

/**
 * Public support page (TASK-099 + K3): open a support ticket, reply to an
 * open conversation, or leave a consultation/demo contact (CRM lead). All
 * guest-authored and tracked by id — honest bootstrap trust until Identity.
 */

const EMPTY_TICKET = {
  contactName: "",
  contactPhone: "",
  subject: "",
  body: "",
};

const EMPTY_LEAD = {
  contactName: "",
  contactPhone: "",
  message: "",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "باز",
  IN_PROGRESS: "در حال بررسی",
  WAITING_CUSTOMER: "در انتظار پاسخ شما",
  RESOLVED: "حل‌شده",
  CLOSED: "بسته",
};

const CATEGORY_LABELS: Record<string, string> = {
  SUPPORT: "پشتیبانی",
  SALES: "فروش",
  COMPLAINT: "شکایت",
  ADVERSE_EVENT: "عوارض محصول",
};

export default function SupportPage() {
  const [tab, setTab] = useState<"ticket" | "lead" | "track">("ticket");
  const [ticketForm, setTicketForm] = useState(EMPTY_TICKET);
  const [leadForm, setLeadForm] = useState(EMPTY_LEAD);
  const [trackId, setTrackId] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [createdLead, setCreatedLead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const replyFocus = useRef<HTMLTextAreaElement>(null);

  const handleCreateTicket = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await createTicket({
        contactName: ticketForm.contactName,
        contactPhone: ticketForm.contactPhone,
        subject: ticketForm.subject,
        body: ticketForm.body,
        category: "SUPPORT",
      });
      setTicket(created);
      setTrackId(created.id);
      setTicketForm(EMPTY_TICKET);
      setTab("track");
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در ثبت تیکت.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateLead = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createLead({
        contactName: leadForm.contactName,
        contactPhone: leadForm.contactPhone,
        message: leadForm.message,
        source: "CONTACT_FORM",
      });
      setCreatedLead(true);
      setLeadForm(EMPTY_LEAD);
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در ثبت تماس.");
    } finally {
      setBusy(false);
    }
  };

  const handleTrack = async (): Promise<void> => {
    if (trackId.trim() === "" || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setTicket(await getTicket(trackId.trim()));
      setReply("");
    } catch (cause) {
      const message = cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره.";
      setError(message === "پاسخ نامعتبر بود." ? "تیکتی با این شناسه یافت نشد." : message);
    } finally {
      setBusy(false);
    }
  };

  const handleReply = async (): Promise<void> => {
    if (ticket === null || reply.trim() === "" || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setTicket(await replyToTicket(ticket.id, { body: reply }));
      setReply("");
      if (replyFocus.current !== null) {
        replyFocus.current.value = "";
      }
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در پاسخ.");
    } finally {
      setBusy(false);
    }
  };

  const canReply = ticket !== null && ticket.status !== "CLOSED";

  return (
    <div className="container dv-page dv-b2b-apply">
      <h1>پشتیبانی و تماس</h1>
      <p className="dv-about-lede">
        پرسش فروش، شکایت سفارش یا درخواست مشاوره — همه از همین صفحه. شناسه هر
        تیکت را نگه دارید تا با آن گفت‌وگو را ادامه دهید.
      </p>

      <div className="dv-admin-tabs" role="tablist" aria-label="بخش‌های پشتیبانی">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ticket"}
          className={tab === "ticket" ? "dv-admin-tab dv-admin-tab-active" : "dv-admin-tab"}
          onClick={() => setTab("ticket")}
        >
          تیکت پشتیبانی
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "lead"}
          className={tab === "lead" ? "dv-admin-tab dv-admin-tab-active" : "dv-admin-tab"}
          onClick={() => setTab("lead")}
        >
          درخواست مشاوره
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "track"}
          className={tab === "track" ? "dv-admin-tab dv-admin-tab-active" : "dv-admin-tab"}
          onClick={() => setTab("track")}
        >
          پیگیری تیکت
        </button>
      </div>

      {error !== null ? (
        <p className="dv-cart-feedback-error" role="alert">
          {error}
        </p>
      ) : null}

      {tab === "ticket" ? (
        <form className="dv-checkout-form" onSubmit={handleCreateTicket}>
          <label htmlFor="sup-name">نام و نام خانوادگی</label>
          <input
            id="sup-name"
            value={ticketForm.contactName}
            onChange={(event) => setTicketForm({ ...ticketForm, contactName: event.target.value })}
            required
            minLength={2}
          />
          <label htmlFor="sup-phone">شماره موبایل</label>
          <input
            id="sup-phone"
            dir="ltr"
            inputMode="numeric"
            placeholder="09123456789"
            value={ticketForm.contactPhone}
            onChange={(event) => setTicketForm({ ...ticketForm, contactPhone: event.target.value })}
            required
          />
          <label htmlFor="sup-subject">موضوع</label>
          <input
            id="sup-subject"
            value={ticketForm.subject}
            onChange={(event) => setTicketForm({ ...ticketForm, subject: event.target.value })}
            required
            minLength={5}
          />
          <label htmlFor="sup-body">شرح درخواست</label>
          <textarea
            id="sup-body"
            className="dv-checkout-textarea"
            value={ticketForm.body}
            onChange={(event) => setTicketForm({ ...ticketForm, body: event.target.value })}
            rows={4}
            minLength={10}
            required
          />
          <button type="submit" className="dv-btn dv-btn-block" disabled={busy} aria-busy={busy}>
            {busy ? "در حال ارسال…" : "باز کردن تیکت"}
          </button>
        </form>
      ) : null}

      {tab === "lead" ? (
        createdLead ? (
          <div className="dv-empty dv-cart-empty" role="status">
            <p>درخواست شما ثبت شد ✓ — کارشناس فروش تماس می‌گیرد.</p>
            <button
              type="button"
              className="dv-btn dv-btn-gold"
              onClick={() => {
                setCreatedLead(false);
                setTab("ticket");
              }}
            >
              ثبت درخواست جدید
            </button>
          </div>
        ) : (
          <form className="dv-checkout-form" onSubmit={handleCreateLead}>
            <label htmlFor="lead-name">نام و نام خانوادگی</label>
            <input
              id="lead-name"
              value={leadForm.contactName}
              onChange={(event) => setLeadForm({ ...leadForm, contactName: event.target.value })}
              required
              minLength={2}
            />
            <label htmlFor="lead-phone">شماره موبایل</label>
            <input
              id="lead-phone"
              dir="ltr"
              inputMode="numeric"
              placeholder="09123456789"
              value={leadForm.contactPhone}
              onChange={(event) => setLeadForm({ ...leadForm, contactPhone: event.target.value })}
              required
            />
            <label htmlFor="lead-msg">درخواست شما (مشاوره / دمو / همکاری)</label>
            <textarea
              id="lead-msg"
              className="dv-checkout-textarea"
              value={leadForm.message}
              onChange={(event) => setLeadForm({ ...leadForm, message: event.target.value })}
              rows={4}
              minLength={5}
              required
            />
            <button type="submit" className="dv-btn dv-btn-block" disabled={busy} aria-busy={busy}>
              {busy ? "در حال ارسال…" : "ثبت درخواست تماس"}
            </button>
          </form>
        )
      ) : null}

      {tab === "track" ? (
        <section className="dv-b2b-track" aria-label="پیگیری تیکت">
          <div className="dv-admin-filter">
            <input
              type="text"
              dir="ltr"
              aria-label="شناسه تیکت"
              placeholder="tkt-…"
              value={trackId}
              onChange={(event) => setTrackId(event.target.value)}
            />
            <button type="button" className="dv-btn dv-btn-gold" onClick={() => void handleTrack()} disabled={busy}>
              استعلام
            </button>
          </div>
          {ticket !== null ? (
            <div className="dv-card dv-b2b-app">
              <h3>
                <span dir="ltr">{ticket.id.slice(-8)}</span> — {ticket.subject || "تیکت"} |{" "}
                {STATUS_LABELS[ticket.status] ?? ticket.status} | {CATEGORY_LABELS[ticket.category] ?? ticket.category}
              </h3>
              <ul className="dv-attach-list">
                {ticket.messages.map((msg) => (
                  <li key={msg.id} className="dv-attach-item">
                    <strong>{msg.author === "AGENT" ? "پشتیبانی:" : "شما:"}</strong>
                    <span>{msg.body}</span>
                  </li>
                ))}
              </ul>
              {canReply ? (
                <div className="dv-checkout-form" style={{ padding: "12px" }}>
                  <label htmlFor="sup-reply">پاسخ شما</label>
                  <textarea
                    id="sup-reply"
                    ref={replyFocus}
                    className="dv-checkout-textarea"
                    onChange={(event) => setReply(event.target.value)}
                    rows={3}
                    minLength={2}
                    required
                  />
                  <button type="button" className="dv-btn dv-btn-gold" disabled={busy} onClick={() => void handleReply()}>
                    {busy ? "در حال ارسال…" : "ارسال پاسخ"}
                  </button>
                </div>
              ) : (
                <p className="dv-muted">این تیکت بسته شده است — برای پیگیری جدید، تیکت تازه‌ای باز کنید.</p>
              )}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
