"use client";

import { useRef, useState } from "react";
import type { Ticket, TicketCategory } from "@bc/contracts";
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
  category: "SUPPORT" as TicketCategory,
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

const CATEGORY_LABELS: Record<string, { label: string; desc: string }> = {
  SUPPORT: {
    label: "پشتیبانی سفارش و ارسال",
    desc: "رهگیری بسته پستی، تغییر آدرس، وضعیت پرداخت یا فاکتور",
  },
  SALES: {
    label: "مشاوره خرید و سفارش عمده",
    desc: "انتخاب روتین، بررسی ترکیبات، تخفیف‌های ویژه یا خرید تعدادی",
  },
  COMPLAINT: {
    label: "رسیدگی به شکایات و انتقادات",
    desc: "بررسی نارضایتی از بسته ارسالی، نحوه تحویل یا تاخیر",
  },
  ADVERSE_EVENT: {
    label: "گزارش حساسیت و عوارض محصول",
    desc: "ارجاع مستقیم به مسئول ایمنی بالینی (Regulatory & Safety)",
  },
};

const FAQS = [
  {
    q: "ارسال سفارش‌ها چقدر زمان می‌برد و هزینه آن چگونه محاسبه می‌شود؟",
    a: "سفارش‌های تهران از طریق پیک ویژه همان روز یا روز کاری بعد و سفارش‌های شهرستان از طریق پست پیشتاز ظرف ۲ الی ۳ روز کاری تحویل می‌گردند. برای خریدهای بالای ۲۵۰ هزار تومان (۲,۵۰۰,۰۰۰ ریال)، ارسال کاملاً رایگان خواهد بود.",
  },
  {
    q: "چگونه می‌توانم از اصالت و کیفیت محصولات اطمینان حاصل کنم؟",
    a: "تمامی محصولات درماویا در اتاق‌های تمیز استاندارد ISO 22716 و تحت فرآیند پرس سرد تولید می‌شوند. هر محصول دارای بچ‌نامبر یکتا و شناسه اصالت بوده و مستقیماً از انبار مرکزی با کنترل دما ارسال می‌گردد.",
  },
  {
    q: "آیا در صورت عدم سازگاری پوستی امکان عودت وجود دارد؟",
    a: "بله، درماویا متعهد به رضایت کامل شماست. در صورت بروز هرگونه حساسیت پوستی، کافی است تیکتی در دسته‌بندی «گزارش حساسیت» ثبت نمایید تا مشاوران بالینی پرونده شما را ارزیابی و فرآیند تعویض یا استرداد وجه را اجرا نمایند.",
  },
  {
    q: "آیا برای ثبت تیکت نیاز به ورود یا ثبت‌نام در سایت دارم؟",
    a: "خیر، جهت سهولت و دسترسی سریع، ثبت تیکت صرفاً با نام و شماره موبایل انجام شده و با کد رهگیری اختصاصی (CUID) بدون نیاز به رمز عبور قابل پیگیری در لحظه است.",
  },
];

export default function SupportPage() {
  const [tab, setTab] = useState<"ticket" | "lead" | "track">("ticket");
  const [ticketForm, setTicketForm] = useState(EMPTY_TICKET);
  const [leadForm, setLeadForm] = useState(EMPTY_LEAD);
  const [trackId, setTrackId] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [createdLead, setCreatedLead] = useState(false);
  const [newTicketCreated, setNewTicketCreated] = useState<Ticket | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
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
        category: ticketForm.category,
      });
      setTicket(created);
      setTrackId(created.id);
      setNewTicketCreated(created);
      setTicketForm(EMPTY_TICKET);
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

  const handleTrack = async (targetId?: string): Promise<void> => {
    const idToFetch = (targetId ?? trackId).trim();
    if (idToFetch === "" || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await getTicket(idToFetch);
      setTicket(res);
      setTrackId(res.id);
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

  const handleCopyTicketId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const canReply = ticket !== null && ticket.status !== "CLOSED";

  return (
    <div className="dv-b2b-container">
      {/* Hero */}
      <div className="dv-b2b-hero" style={{ textAlign: "center", padding: "44px 24px" }}>
        <span className="dv-badge" style={{ background: "rgba(197, 160, 89, 0.2)", color: "var(--gold-deep)", fontWeight: 700, marginBottom: 12 }}>
          HUMAN CLINICAL SUPPORT
        </span>
        <h1 className="dv-b2b-header-title" style={{ fontSize: "2.2rem", margin: "0 0 14px", fontWeight: 800 }}>
          مرکز پشتیبانی و ارتباط با مشتریان DERMAVIA
        </h1>
        <p className="dv-b2b-header-desc" style={{ maxWidth: 780, margin: "0 auto 24px", lineHeight: 1.8 }}>
          پاسخگویی انسانی، بدون ربات‌های خودکار. برای پیگیری سفارش، مشاوره اختصاصی پوست، گزارش عوارض یا سؤالات فروش تیکت ثبت نمایید؛ کارشناسان بالینی در اسرع وقت پاسخگوی شما خواهند بود.
        </p>

        {/* Quick Trust Badges */}
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", padding: "8px 14px", borderRadius: 9999, border: "1px solid var(--dv-line)", fontSize: "0.82rem", color: "var(--dv-ink)" }}>
            <span>⚡</span>
            <span>پاسخگویی تضمینی کمتر از ۲۴ ساعت</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", padding: "8px 14px", borderRadius: 9999, border: "1px solid var(--dv-line)", fontSize: "0.82rem", color: "var(--dv-ink)" }}>
            <span>🔬</span>
            <span>مشاوران رسمی درماتولوژی</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", padding: "8px 14px", borderRadius: 9999, border: "1px solid var(--dv-line)", fontSize: "0.82rem", color: "var(--dv-ink)" }}>
            <span>🛡️</span>
            <span>پیگیری سریع بدون نیاز به لاگین</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dv-admin-tabs-nav" role="tablist" style={{ justifyContent: "center", marginBottom: 30 }}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ticket"}
          className={`dv-admin-tab-btn ${tab === "ticket" ? "is-active" : ""}`}
          onClick={() => {
            setTab("ticket");
            setNewTicketCreated(null);
          }}
        >
          ثبت تیکت جدید
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "lead"}
          className={`dv-admin-tab-btn ${tab === "lead" ? "is-active" : ""}`}
          onClick={() => {
            setTab("lead");
            setNewTicketCreated(null);
          }}
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
        <div className="dv-b2b-card" style={{ maxWidth: 700, margin: "0 auto" }}>
          {newTicketCreated ? (
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 16, padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: 8 }}>✓</div>
              <h2 style={{ color: "#065f46", margin: "0 0 10px", fontSize: "1.5rem" }}>تیکت شما با موفقیت ثبت شد</h2>
              <p style={{ color: "#047857", fontSize: "0.95rem", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 20px" }}>
                شناسه پیگیری زیر به درخواست شما تخصیص یافت. لطفاً این شناسه را یادداشت فرمایید تا در هر زمان بتوانید پاسخ کارشناسان را در بخش «پیگیری تیکت» مشاهده نمایید.
              </p>
              
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #10b981", borderRadius: 12, padding: "10px 18px", marginBottom: 24 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--dv-muted)" }}>شناسه پیگیری:</span>
                <code dir="ltr" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--dv-navy)" }}>{newTicketCreated.id}</code>
                <button
                  type="button"
                  className="dv-btn"
                  onClick={() => handleCopyTicketId(newTicketCreated.id)}
                  style={{ background: "#f0fdf4", border: "1px solid #10b981", padding: "4px 10px", fontSize: "0.8rem", color: "#047857" }}
                >
                  {copiedId ? "کپی شد! ✓" : "کپی شناسه"}
                </button>
              </div>

              <div>
                <button
                  type="button"
                  className="dv-btn dv-btn-gold"
                  onClick={() => {
                    setTab("track");
                    setTrackId(newTicketCreated.id);
                  }}
                  style={{ padding: "10px 24px" }}
                >
                  مشاهده وضعیت و شروع گفت‌وگو →
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2>ثبت تیکت پشتیبانی</h2>
              <p className="dv-muted" style={{ fontSize: "0.88rem", marginBottom: 20 }}>
                لطفاً اطلاعات خود را تکمیل فرمایید تا کارشناسان دپارتمان مربوطه رسیدگی نمایند.
              </p>

              <form onSubmit={handleCreateTicket}>
                {/* Category Selection */}
                <div style={{ marginBottom: 20 }}>
                  <label className="dv-checkout-label" htmlFor="sup-cat">دسته‌بندی درخواست</label>
                  <select
                    id="sup-cat"
                    className="dv-checkout-input"
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as TicketCategory })}
                    style={{ background: "#fff", fontWeight: 600, color: "var(--dv-navy)" }}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catVal]) => (
                      <option key={catKey} value={catKey}>
                        {catVal.label} — ({catVal.desc})
                      </option>
                    ))}
                  </select>
                </div>

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
                      placeholder="مثال: سارا محمدی"
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
            </>
          )}
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
                    placeholder="مثال: علی رضایی"
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
            شناسه تیکت خود را وارد کنید تا پاسخ کارشناس را مشاهده و در صورت نیاز پیام جدید ارسال کنید.
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input
              type="text"
              dir="ltr"
              className="dv-checkout-input"
              aria-label="شناسه تیکت"
              placeholder="شناسه تیکت (مثال: cmwrg2dba...)"
              value={trackId}
              onChange={(event) => setTrackId(event.target.value)}
            />
            <button type="button" className="dv-btn dv-btn-gold" onClick={() => void handleTrack()} disabled={busy}>
              {busy ? "در حال جستجو…" : "استعلام"}
            </button>
          </div>

          {/* Quick Sample Button for Testing */}
          <div style={{ marginBottom: 24 }}>
            <button
              type="button"
              className="dv-link"
              onClick={() => void handleTrack("cmwrg2dba0007ezwkvzzaxmj1")}
              style={{ fontSize: "0.82rem", color: "var(--dv-gold)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              ✧ مشاهده نمونه گفت‌وگوی فعال (شناسه تستی cmwrg2dba0007ezwkvzzaxmj1)
            </button>
          </div>

          {ticket !== null ? (
            <div style={{ background: "#fcf9f2", border: "1px solid rgba(212, 175, 55, 0.35)", borderRadius: 14, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: "0 0 6px", color: "var(--dv-navy)", fontSize: "1.15rem", fontWeight: 800 }}>
                    {ticket.subject || "تیکت پشتیبانی"}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.84rem", color: "var(--dv-muted)" }}>
                    <span>دسته‌بندی: <strong>{CATEGORY_LABELS[ticket.category]?.label ?? ticket.category}</strong></span>
                    <span>•</span>
                    <span>شناسه: <code dir="ltr" style={{ color: "var(--dv-navy)" }}>{ticket.id}</code></span>
                  </div>
                </div>
                <span className="dv-badge" style={{ background: "var(--dv-navy)", color: "#fffaf0", padding: "6px 12px", fontSize: "0.85rem", fontWeight: 700 }}>
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </span>
              </div>

              {/* Chat Timeline */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBlock: 20 }}>
                {ticket.messages.map((msg) => {
                  const isAgent = msg.author === "AGENT";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isAgent ? "flex-start" : "flex-end",
                        maxWidth: "85%",
                        background: isAgent ? "#ffffff" : "linear-gradient(135deg, #fbf7ee 0%, #f6efe0 100%)",
                        border: isAgent ? "1px solid var(--dv-line)" : "1px solid rgba(197, 160, 89, 0.4)",
                        borderRadius: 16,
                        padding: "14px 18px",
                        boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 6, fontSize: "0.8rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{isAgent ? "🔬" : "👤"}</span>
                          <strong style={{ color: isAgent ? "#047857" : "var(--dv-navy)" }}>
                            {isAgent ? "کارشناس بالینی Dermavia" : "شما (کاربر)"}
                          </strong>
                        </div>
                        <span className="dv-muted" style={{ fontSize: "0.75rem" }}>
                          {new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--dv-ink)", lineHeight: 1.8 }}>
                        {msg.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              {canReply ? (
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(212, 175, 55, 0.25)" }}>
                  <label htmlFor="sup-reply" style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", marginBottom: 8, color: "var(--dv-navy)" }}>
                    ارسال پاسخ تکمیلی به کارشناس:
                  </label>
                  <textarea
                    id="sup-reply"
                    ref={replyFocus}
                    className="dv-checkout-input dv-checkout-textarea"
                    placeholder="پیام یا توضیحات تکمیلی خود را وارد فرمایید..."
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={3}
                    minLength={2}
                    required
                  />
                  <button
                    type="button"
                    className="dv-btn dv-btn-gold"
                    style={{ marginTop: 12, padding: "10px 22px" }}
                    disabled={busy}
                    onClick={() => void handleReply()}
                  >
                    {busy ? "در حال ارسال…" : "ثبت پاسخ به گفت‌وگو"}
                  </button>
                </div>
              ) : (
                <p className="dv-muted" style={{ margin: "16px 0 0", textAlign: "center", fontSize: "0.88rem" }}>
                  این تیکت با موفقیت بسته شده است. در صورت نیاز به پیگیری‌های بیشتر، می‌توانید تیکت جدیدی ایجاد کنید.
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Common FAQ Accordion Section */}
      <div style={{ maxWidth: 750, margin: "48px auto 0", background: "#fff", border: "1px solid var(--dv-line)", borderRadius: 20, padding: 32 }}>
        <h2 style={{ fontSize: "1.35rem", color: "var(--dv-navy)", margin: "0 0 8px", fontWeight: 800 }}>
          پرسش‌های متداول مشتریان (FAQ)
        </h2>
        <p style={{ fontSize: "0.88rem", color: "var(--dv-muted)", margin: "0 0 24px" }}>
          پاسخ سریع به سؤالات پرتکرار پیرامون سفارشات، اصالت و شرایط بازگشت کالا
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQS.map((faq, index) => {
            const isOpen = expandedFaq === index;
            return (
              <div
                key={faq.q}
                style={{
                  border: "1px solid var(--dv-line)",
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "border-color 0.2s ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : index)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 18px",
                    background: isOpen ? "rgba(246, 241, 232, 0.4)" : "#fff",
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "var(--dv-navy)",
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: "1.2rem", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}>
                    ▾
                  </span>
                </button>
                {isOpen ? (
                  <div style={{ padding: "14px 18px", fontSize: "0.9rem", color: "var(--dv-ink-soft)", lineHeight: 1.8, background: "#faf8f4", borderTop: "1px solid var(--dv-line)" }}>
                    {faq.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
