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
 * Public support page: open a support ticket, reply to an
 * open conversation, or request a consultation/demo (CRM lead).
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
  OPEN: "در انتظار بررسی",
  IN_PROGRESS: "در حال پیگیری کارشناس",
  WAITING_CUSTOMER: "پاسخ داده شد — منتظر بازخورد شما",
  RESOLVED: "حل‌شده و تکمیل",
  CLOSED: "بسته شده",
};

const CATEGORY_LABELS: Record<string, string> = {
  SUPPORT: "پشتیبانی سفارش و ارسال",
  SALES: "مشاوره خرید و سفارش عمده",
  COMPLAINT: "رسیدگی به شکایات",
  ADVERSE_EVENT: "گزارش حساسیت و عوارض محصول",
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
    <div className="dv-b2b-container">
      {/* Hero */}
      <div className="dv-b2b-hero">
        <h1 className="dv-b2b-header-title">مرکز پشتیبانی و ارتباط با مشتریان DERMAVIA</h1>
        <p className="dv-b2b-header-desc">
          پاسخگویی انسانی، بدون ربات‌های خودکار. برای پیگیری سفارش، مشاوره اختصاصی پوست، گزارش عوارض یا سؤالات فروش تیکت ثبت نمایید؛ کارشناسان بالینی در اسرع وقت پاسخگوی شما خواهند بود.
        </p>
      </div>

      {/* Tabs */}
      <div className="dv-admin-tabs-nav" role="tablist" style={{ justifyContent: "center", marginBottom: 30 }}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ticket"}
          className={`dv-admin-tab-btn ${tab === "ticket" ? "is-active" : ""}`}
          onClick={() => setTab("ticket")}
        >
          ثبت تیکت جدید
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "lead"}
          className={`dv-admin-tab-btn ${tab === "lead" ? "is-active" : ""}`}
          onClick={() => setTab("lead")}
        >
          درخواست مشاوره تخصصی
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "track"}
          className={`dv-admin-tab-btn ${tab === "track" ? "is-active" : ""}`}
          onClick={() => setTab("track")}
        >
          پیگیری تیکت و گفت‌وگو
        </button>
      </div>

      {error !== null ? (
        <p className="dv-cart-feedback dv-cart-feedback-error" role="alert" style={{ textAlign: "center", marginBottom: 20 }}>
          {error}
        </p>
      ) : null}

      {/* Tab 1: Ticket Creation */}
      {tab === "ticket" ? (
        <div className="dv-b2b-card" style={{ maxWidth: 650, margin: "0 auto" }}>
          <h2>ثبت تیکت پشتیبانی</h2>
          <form onSubmit={handleCreateTicket}>
            <div className="dv-b2b-field-grid">
              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="sup-name">نام و نام خانوادگی</label>
                <input
                  id="sup-name"
                  className="dv-checkout-input"
                  value={ticketForm.contactName}
                  onChange={(event) => setTicketForm({ ...ticketForm, contactName: event.target.value })}
                  required
                  minLength={2}
                />
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="sup-phone">شماره موبایل</label>
                <input
                  id="sup-phone"
                  dir="ltr"
                  inputMode="numeric"
                  className="dv-checkout-input"
                  placeholder="09123456789"
                  value={ticketForm.contactPhone}
                  onChange={(event) => setTicketForm({ ...ticketForm, contactPhone: event.target.value })}
                  required
                />
              </div>
            </div>

            <div className="dv-checkout-field">
              <label className="dv-checkout-label" htmlFor="sup-subject">موضوع درخواست</label>
              <input
                id="sup-subject"
                className="dv-checkout-input"
                placeholder="مثال: پیگیری ارسال بسته یا سؤال در مورد سرم ویتامین C"
                value={ticketForm.subject}
                onChange={(event) => setTicketForm({ ...ticketForm, subject: event.target.value })}
                required
                minLength={5}
              />
            </div>

            <div className="dv-checkout-field">
              <label className="dv-checkout-label" htmlFor="sup-body">شرح کامل پیام</label>
              <textarea
                id="sup-body"
                className="dv-checkout-input dv-checkout-textarea"
                value={ticketForm.body}
                onChange={(event) => setTicketForm({ ...ticketForm, body: event.target.value })}
                rows={4}
                placeholder="لطفاً شماره سفارش یا جزئیات درخواست را بنویسید..."
                minLength={10}
                required
              />
            </div>

            <button type="submit" className="dv-btn dv-btn-gold dv-btn-block" disabled={busy} aria-busy={busy} style={{ marginTop: 14 }}>
              {busy ? "در حال ثبت تیکت…" : "ارسال تیکت پشتیبانی"}
            </button>
          </form>
        </div>
      ) : null}

      {/* Tab 2: Lead / Consultation */}
      {tab === "lead" ? (
        <div className="dv-b2b-card" style={{ maxWidth: 650, margin: "0 auto" }}>
          <h2>درخواست مشاوره رایگان با کارشناس پوست</h2>
          <p className="dv-muted" style={{ fontSize: "0.88rem", marginBottom: 20 }}>
            اگر برای انتخاب روتین مناسب نوع پوست خود مردد هستید، شماره تماس خود را ثبت کنید تا مشاوران درماویا ظرف ۲۴ ساعت با شما تماس بگیرند.
          </p>

          {createdLead ? (
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: 24, textAlign: "center" }}>
              <h3 style={{ color: "#065f46", margin: "0 0 10px" }}>✓ درخواست مشاوره شما با موفقیت ثبت شد</h3>
              <p className="dv-muted" style={{ fontSize: "0.9rem" }}>
                کارشناسان پوست در اولین فرصت با شماره اعلامی تماس خواهند گرفت.
              </p>
              <button
                type="button"
                className="dv-btn dv-btn-gold"
                style={{ marginTop: 14 }}
                onClick={() => {
                  setCreatedLead(false);
                  setTab("ticket");
                }}
              >
                ثبت درخواست دیگر
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateLead}>
              <div className="dv-b2b-field-grid">
                <div className="dv-checkout-field">
                  <label className="dv-checkout-label" htmlFor="lead-name">نام و نام خانوادگی</label>
                  <input
                    id="lead-name"
                    className="dv-checkout-input"
                    value={leadForm.contactName}
                    onChange={(event) => setLeadForm({ ...leadForm, contactName: event.target.value })}
                    required
                    minLength={2}
                  />
                </div>

                <div className="dv-checkout-field">
                  <label className="dv-checkout-label" htmlFor="lead-phone">شماره تماس همراه</label>
                  <input
                    id="lead-phone"
                    dir="ltr"
                    inputMode="numeric"
                    className="dv-checkout-input"
                    placeholder="09123456789"
                    value={leadForm.contactPhone}
                    onChange={(event) => setLeadForm({ ...leadForm, contactPhone: event.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="lead-msg">نوع دغدغه پوستی یا درخواست مشاوره</label>
                <textarea
                  id="lead-msg"
                  className="dv-checkout-input dv-checkout-textarea"
                  value={leadForm.message}
                  onChange={(event) => setLeadForm({ ...leadForm, message: event.target.value })}
                  rows={4}
                  placeholder="مثال: پوست حساس همراه با رزاسه دارم و برای شست‌وشو و آبرسان مشاوره می‌خواهم..."
                  minLength={5}
                  required
                />
              </div>

              <button type="submit" className="dv-btn dv-btn-gold dv-btn-block" disabled={busy} aria-busy={busy} style={{ marginTop: 14 }}>
                {busy ? "در حال ثبت…" : "ارسال درخواست مشاوره"}
              </button>
            </form>
          )}
        </div>
      ) : null}

      {/* Tab 3: Track Ticket */}
      {tab === "track" ? (
        <div className="dv-b2b-card" style={{ maxWidth: 750, margin: "0 auto" }}>
          <h2>پیگیری گفت‌وگو و وضعیت تیکت</h2>
          <p className="dv-muted" style={{ fontSize: "0.88rem", marginBottom: 16 }}>
            کد رهگیری تیکت خود (شروع با tkt-...) را وارد کنید تا پاسخ کارشناس را مشاهده و در صورت نیاز پیام جدید ارسال کنید.
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <input
              type="text"
              dir="ltr"
              className="dv-checkout-input"
              aria-label="شناسه تیکت"
              placeholder="tkt-..."
              value={trackId}
              onChange={(event) => setTrackId(event.target.value)}
            />
            <button type="button" className="dv-btn dv-btn-gold" onClick={() => void handleTrack()} disabled={busy}>
              استعلام
            </button>
          </div>

          {ticket !== null ? (
            <div style={{ background: "#fcf9f2", border: "1px solid rgba(212, 175, 55, 0.35)", borderRadius: 14, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: "0 0 6px", color: "var(--dv-navy)", fontSize: "1.1rem" }}>
                    {ticket.subject || "تیکت پشتیبانی"}
                  </h3>
                  <span className="dv-muted" style={{ fontSize: "0.85rem" }}>
                    دسته‌بندی: {CATEGORY_LABELS[ticket.category] ?? ticket.category} | شناسه: <strong dir="ltr">{ticket.id}</strong>
                  </span>
                </div>
                <span className="dv-badge" style={{ background: "var(--dv-navy)", color: "#fffaf0" }}>
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </span>
              </div>

              {/* Chat Timeline */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBlock: 18 }}>
                {ticket.messages.map((msg) => {
                  const isAgent = msg.author === "AGENT";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isAgent ? "flex-start" : "flex-end",
                        maxWidth: "80%",
                        background: isAgent ? "#ffffff" : "var(--dv-cream)",
                        border: isAgent ? "1px solid var(--dv-line)" : "1px solid rgba(212, 175, 55, 0.3)",
                        borderRadius: 14,
                        padding: "12px 16px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 4, fontSize: "0.78rem" }}>
                        <strong style={{ color: isAgent ? "#047857" : "var(--dv-navy)" }}>
                          {isAgent ? "👨‍🔬 کارشناس پشتیبانی Dermavia" : "شما (کاربر)"}
                        </strong>
                        <span className="dv-muted">
                          {new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--dv-ink)", lineHeight: 1.7 }}>
                        {msg.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              {canReply ? (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(212, 175, 55, 0.25)" }}>
                  <label htmlFor="sup-reply" style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", marginBottom: 6 }}>
                    ارسال پاسخ به کارشناس:
                  </label>
                  <textarea
                    id="sup-reply"
                    ref={replyFocus}
                    className="dv-checkout-input dv-checkout-textarea"
                    placeholder="پیام یا توضیحات تکمیلی خود را وارد فرمایید..."
                    onChange={(event) => setReply(event.target.value)}
                    rows={3}
                    minLength={2}
                    required
                  />
                  <button
                    type="button"
                    className="dv-btn dv-btn-gold"
                    style={{ marginTop: 10 }}
                    disabled={busy}
                    onClick={() => void handleReply()}
                  >
                    {busy ? "در حال ارسال…" : "ثبت پاسخ"}
                  </button>
                </div>
              ) : (
                <p className="dv-muted" style={{ margin: "16px 0 0", textAlign: "center", fontSize: "0.88rem" }}>
                  این تیکت با موفقیت بسته شده است. در صورت نیاز می‌توانید تیکت جدیدی ایجاد کنید.
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
