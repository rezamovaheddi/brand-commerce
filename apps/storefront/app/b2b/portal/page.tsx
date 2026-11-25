"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Rfq } from "@bc/contracts";
import {
  CartApiError,
  clearOrgKey,
  fileToAttachmentPayload,
  getOrgKey,
  orgAcceptQuote,
  orgDownloadAttachment,
  orgListRfqs,
  orgMe,
  orgSubmitRfq,
  orgUploadAttachment,
  setOrgKey,
  validateAttachmentFile,
  type OrgMe,
} from "../../../lib/b2b-client";
import { formatPrice } from "../../../lib/format";

/**
 * Organization portal (N16): the member enters the operator-issued access key
 * (kept in sessionStorage only), sees their organization identity, raises
 * org-bound RFQs (CATALOG or OEM), attaches files and accepts org quotes.
 * Honest gates: ACCOUNTANT role cannot purchase; SAMPLE pricing banners stay
 * until D-11 lands.
 */

const EMPTY_FORM = {
  contactName: "",
  contactPhone: "",
  productName: "",
  quantity: "",
  note: "",
  itemKind: "CATALOG" as "CATALOG" | "OEM",
  specNote: "",
  targetMarket: "",
  packaging: "",
  requestedDeliveryDate: "",
  confidentiality: false,
};

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  province: "",
  city: "",
  postalCode: "",
  addressLine: "",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "ثبت‌شده",
  PRICED: "در حال قیمت‌گذاری",
  QUOTED: "پیش‌فاکتور صادر شد",
  ACCEPTED: "پذیرفته‌شده",
  REJECTED: "رد شده",
  CLOSED: "بسته",
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  SENT: "ارسال‌شده",
  ACCEPTED: "پذیرفته‌شده",
  REJECTED: "رد‌شده",
  EXPIRED: "منقضی",
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "مالک سازمان",
  BUYER: "کارشناس خرید",
  ACCOUNTANT: "حساب‌دار",
};

export default function OrgPortalPage() {
  const [key, setKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [me, setMe] = useState<OrgMe | null>(null);
  const [rfqs, setRfqs] = useState<Rfq[] | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [acceptedOrder, setAcceptedOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(true);
  const [attaching, setAttaching] = useState(false);
  const attachTarget = useRef<string | null>(null);

  const loadPortal = useCallback(async (activeKey: string): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      setMe(await orgMe(activeKey));
      setRfqs(await orgListRfqs(activeKey));
    } catch (cause) {
      if (cause instanceof CartApiError && (cause.status === 401 || cause.status === 403)) {
        clearOrgKey();
        setKey(null);
        setMe(null);
        setRfqs(null);
        setError(cause.message);
      } else {
        setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در بارگذاری پورتال.");
      }
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const stored = getOrgKey();
    if (stored !== null) {
      setKey(stored);
      void loadPortal(stored).finally(() => setBooting(false));
    } else {
      setBooting(false);
    }
  }, [loadPortal]);

  const handleKeySubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy || keyInput.trim() === "") {
      return;
    }
    setBusy(true);
    setError(null);
    const candidate = keyInput.trim();
    try {
      await orgMe(candidate);
      setOrgKey(candidate);
      setKey(candidate);
      setKeyInput("");
      await loadPortal(candidate);
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "کلید نامعتبر است.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = (): void => {
    clearOrgKey();
    setKey(null);
    setMe(null);
    setRfqs(null);
    setAcceptedOrder(null);
    setForm(EMPTY_FORM);
    setAddress(EMPTY_ADDRESS);
  };

  const handleRfqSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy || key === null) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const isOem = form.itemKind === "OEM";
      await orgSubmitRfq(key, {
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        items: [
          {
            productName: form.productName,
            quantity: Number(form.quantity),
            itemKind: form.itemKind,
            ...(isOem && form.specNote.trim() !== "" ? { specNote: form.specNote } : {}),
          },
        ],
        note: form.note.trim() === "" ? undefined : form.note,
        targetMarket: form.targetMarket.trim() === "" ? undefined : form.targetMarket,
        packaging: form.packaging.trim() === "" ? undefined : form.packaging,
        requestedDeliveryDate:
          form.requestedDeliveryDate.trim() === "" ? undefined : form.requestedDeliveryDate,
        confidentiality: form.confidentiality,
      });
      setForm(EMPTY_FORM);
      setRfqs(await orgListRfqs(key));
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در ثبت درخواست.");
    } finally {
      setBusy(false);
    }
  };

  const handleOrgAttach = async (file: File, rfqId: string): Promise<void> => {
    if (key === null || attaching) {
      return;
    }
    const invalid = validateAttachmentFile(file);
    if (invalid !== null) {
      setError(invalid);
      return;
    }
    setAttaching(true);
    setError(null);
    try {
      const payload = await fileToAttachmentPayload(file);
      await orgUploadAttachment(key, rfqId, payload);
      setRfqs(await orgListRfqs(key));
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در بارگذاری پیوست.");
    } finally {
      setAttaching(false);
      attachTarget.current = null;
    }
  };

  const handleOrgDownload = async (rfqId: string, attachmentId: string, filename: string): Promise<void> => {
    if (key === null) {
      return;
    }
    try {
      await orgDownloadAttachment(key, rfqId, attachmentId, filename);
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در دانلود پیوست.");
    }
  };

  const handleAccept = async (quoteId: string): Promise<void> => {
    if (key === null || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await orgAcceptQuote(key, quoteId, address);
      setAcceptedOrder(result.order.id);
      setRfqs(await orgListRfqs(key));
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در پذیرش پیش‌فاکتور.");
    } finally {
      setBusy(false);
    }
  };

  const isBuyer = me !== null && (me.role === "OWNER" || me.role === "BUYER");

  if (booting) {
    return (
      <div className="container dv-page">
        <h1>پورتال سازمانی</h1>
        <p className="dv-muted">در حال بررسی نشست…</p>
      </div>
    );
  }

  if (key === null || me === null) {
    return (
      <div className="dv-b2b-container">
        <div className="dv-b2b-hero">
          <h1 className="dv-b2b-header-title">پورتال تجاری و سازمانی DERMAVIA</h1>
          <p className="dv-b2b-header-desc">
            درگاه یکپارچه تأمین عمده، فرمولاسیون اختصاصی (OEM) و استعلام قیمت سازمانی.
            اگر مجموعه شما توسط واحد فروش تأیید شده است، کلید دسترسی سازمان را وارد کنید.
          </p>
        </div>

        <div className="dv-b2b-card" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h2>ورود با کلید دسترسی سازمان</h2>
          <form className="dv-checkout-form" onSubmit={handleKeySubmit}>
            <label htmlFor="org-key" style={{ fontWeight: 600 }}>کلید دسترسی سازمانی (Access Key)</label>
            <input
              id="org-key"
              dir="ltr"
              className="dv-checkout-input"
              placeholder="dvorg_..."
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              required
            />
            <button type="submit" className="dv-btn dv-btn-gold dv-btn-block" disabled={busy} aria-busy={busy} style={{ marginTop: 12 }}>
              {busy ? "در حال بررسی…" : "ورود به پیشخوان سازمان"}
            </button>
            {error !== null ? (
              <p className="dv-cart-feedback dv-cart-feedback-error" role="alert" style={{ marginTop: 10 }}>
                {error}
              </p>
            ) : null}
          </form>

          {/* Quick Demo Test Button */}
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <button
              type="button"
              className="dv-link"
              onClick={() => {
                setKeyInput("dvorg_fa16962f6d0d398f3c00207c4026f4db");
              }}
              style={{ fontSize: "0.82rem", color: "var(--dv-gold)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              ✧ ورود نمونه با کلید سازمانی تستی (شرکت پخش سلامت پویا)
            </button>
          </div>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--dv-line)", textAlign: "center" }}>
            <p className="dv-muted" style={{ fontSize: "0.88rem" }}>
              هنوز عضو شبکه سازمانی نشده‌اید؟{" "}
              <Link href="/b2b/apply" className="dv-link" style={{ fontWeight: 700 }}>
                ثبت درخواست همکاری
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate quick metrics
  const totalRfqs = rfqs?.length ?? 0;
  const activeQuotesCount = rfqs?.filter((r) => r.quote !== null && r.quote.status === "SENT").length ?? 0;
  const acceptedQuotesCount = rfqs?.filter((r) => r.status === "ACCEPTED").length ?? 0;

  return (
    <div className="dv-b2b-container">
      {/* Enterprise Organization Header */}
      <div className="dv-b2b-hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="dv-b2b-header-title">
              {me.organizationName}
              {me.isSample ? <span className="dv-badge" style={{ fontSize: "0.75rem", background: "#fef3c7", color: "#92400e" }}>حساب نمونه</span> : null}
            </h1>
            <p className="dv-b2b-header-desc">
              نماینده: <strong>{me.memberName}</strong> | سمت و دسترسی:{" "}
              <span className="dv-badge" style={{ background: "#ecfdf5", color: "#065f46", fontWeight: 700 }}>
                {ROLE_LABELS[me.role] ?? me.role}
              </span>
            </p>
          </div>
          <button type="button" className="dv-btn" onClick={handleLogout} style={{ background: "#fff", border: "1px solid var(--dv-line)" }}>
            خروج از حساب
          </button>
        </div>
      </div>

      {/* Organization KPIs */}
      <div className="dv-b2b-stats">
        <div className="dv-b2b-stat-card">
          <div className="dv-b2b-stat-num">{totalRfqs}</div>
          <div className="dv-b2b-stat-label">کل درخواست‌های استعلام (RFQ)</div>
        </div>
        <div className="dv-b2b-stat-card">
          <div className="dv-b2b-stat-num" style={{ color: "#047857" }}>{activeQuotesCount}</div>
          <div className="dv-b2b-stat-label">پیش‌فاکتورهای آماده پذیرش</div>
        </div>
        <div className="dv-b2b-stat-card">
          <div className="dv-b2b-stat-num" style={{ color: "var(--dv-gold)" }}>{acceptedQuotesCount}</div>
          <div className="dv-b2b-stat-label">سفارش‌های نهایی شده</div>
        </div>
        <div className="dv-b2b-stat-card">
          <div className="dv-b2b-stat-num" style={{ fontSize: "1.2rem", color: "var(--dv-navy)" }}>سطح طلایی B2B</div>
          <div className="dv-b2b-stat-label">تخفیف حجمی سازمانی فعال</div>
        </div>
      </div>

      {acceptedOrder !== null ? (
        <div className="dv-b2b-card" style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }} role="status">
          <h3 style={{ color: "#065f46", margin: 0 }}>✓ پیش‌فاکتور با موفقیت پذیرفته شد و سفارش ثبت گردید</h3>
          <p style={{ margin: "8px 0 16px", color: "#047857" }}>
            کد رهگیری سفارش: <strong dir="ltr">{acceptedOrder}</strong>
          </p>
          <Link href={`/orders/${acceptedOrder}`} className="dv-btn dv-btn-gold">
            مشاهده جزئیات سفارش و پرداخت
          </Link>
        </div>
      ) : null}

      {/* RFQ Creation Wizard */}
      {isBuyer ? (
        <section className="dv-b2b-card" aria-label="ثبت درخواست قیمت سازمانی">
          <h2>ثبت استعلام قیمت جدید (RFQ)</h2>
          <form onSubmit={handleRfqSubmit}>
            <div className="dv-b2b-field-grid">
              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="portal-contact">نام و نام خانوادگی رابط</label>
                <input
                  id="portal-contact"
                  className="dv-checkout-input"
                  value={form.contactName}
                  onChange={(event) => setForm({ ...form, contactName: event.target.value })}
                  required
                  minLength={2}
                />
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="portal-phone">شماره همراه</label>
                <input
                  id="portal-phone"
                  dir="ltr"
                  inputMode="numeric"
                  className="dv-checkout-input"
                  placeholder="09123456789"
                  value={form.contactPhone}
                  onChange={(event) => setForm({ ...form, contactPhone: event.target.value })}
                  required
                />
              </div>
            </div>

            <div className="dv-checkout-field">
              <label className="dv-checkout-label">دسته‌بندی تأمین کالا</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div
                  className={`dv-b2b-choice-card ${form.itemKind === "CATALOG" ? "is-active" : ""}`}
                  onClick={() => setForm({ ...form, itemKind: "CATALOG" })}
                >
                  <input
                    type="radio"
                    name="portal-item-kind"
                    aria-label="محصولات کاتالوگ جاری"
                    checked={form.itemKind === "CATALOG"}
                    onChange={() => setForm({ ...form, itemKind: "CATALOG" })}
                  />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem" }}>محصولات کاتالوگ جاری</strong>
                    <span className="dv-muted" style={{ fontSize: "0.8rem" }}>سفارش عمده سرم‌ها و کرم‌های استاندارد Dermavia</span>
                  </div>
                </div>

                <div
                  className={`dv-b2b-choice-card ${form.itemKind === "OEM" ? "is-active" : ""}`}
                  onClick={() => setForm({ ...form, itemKind: "OEM" })}
                >
                  <input
                    type="radio"
                    name="portal-item-kind"
                    aria-label="تولید اختصاصی و سفارشی OEM"
                    checked={form.itemKind === "OEM"}
                    onChange={() => setForm({ ...form, itemKind: "OEM" })}
                  />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem" }}>تولید اختصاصی و سفارشی (OEM)</strong>
                    <span className="dv-muted" style={{ fontSize: "0.8rem" }}>فرمولاسیون اختصاصی، حجم ویژه یا برچسب اختصاصی کلینیک</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dv-b2b-field-grid">
              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="portal-product">شرح کالا یا فرمول مدنظر</label>
                <input
                  id="portal-product"
                  className="dv-checkout-input"
                  value={form.productName}
                  onChange={(event) => setForm({ ...form, productName: event.target.value })}
                  required
                  minLength={2}
                />
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="portal-qty">تیراژ درخواستی (عدد)</label>
                <input
                  id="portal-qty"
                  dir="ltr"
                  inputMode="numeric"
                  className="dv-checkout-input"
                  placeholder="حداقل ۱۰۰ عدد"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                  required
                />
              </div>
            </div>

            {form.itemKind === "OEM" ? (
              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="portal-spec">
                  مشخصات فنی و مواد مؤثره درخواستی (حداقل ۱۰ نویسه)
                </label>
                <textarea
                  id="portal-spec"
                  className="dv-checkout-input dv-checkout-textarea"
                  value={form.specNote}
                  onChange={(event) => setForm({ ...form, specNote: event.target.value })}
                  rows={3}
                  placeholder="مثال: سرم هیالورونیک اسید ۲٪ با عصاره سنتلا آسیاتیکا، فاقد عطر، در ویال‌های شیشه‌ای ۳۰ میل..."
                  minLength={10}
                  required
                />
              </div>
            ) : null}

            <div className="dv-b2b-field-grid">
              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="portal-market">بازار هدف و کانال توزیع (اختیاری)</label>
                <input
                  id="portal-market"
                  className="dv-checkout-input"
                  placeholder="مثال: کلینیک‌های پوست، داروخانه‌های تهران"
                  value={form.targetMarket}
                  onChange={(event) => setForm({ ...form, targetMarket: event.target.value })}
                />
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="portal-packaging">نوع بسته‌بندی درخواستی (اختیاری)</label>
                <input
                  id="portal-packaging"
                  className="dv-checkout-input"
                  placeholder="مثال: پمپ ایرلس، قطره‌چکان طلایی"
                  value={form.packaging}
                  onChange={(event) => setForm({ ...form, packaging: event.target.value })}
                />
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="portal-delivery">موعد تحویل مورد نیاز</label>
                <input
                  id="portal-delivery"
                  dir="ltr"
                  className="dv-checkout-input"
                  placeholder="1405-06-01 یا 2026-08-20"
                  value={form.requestedDeliveryDate}
                  onChange={(event) => setForm({ ...form, requestedDeliveryDate: event.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBlock: 12 }}>
              <label className="dv-choice-option" htmlFor="portal-conf" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  id="portal-conf"
                  type="checkbox"
                  checked={form.confidentiality}
                  onChange={(event) => setForm({ ...form, confidentiality: event.target.checked })}
                />
                <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>این درخواست تحت توافق‌نامه محرمانگی (NDA) بررسی شود</span>
              </label>
            </div>

            <button type="submit" className="dv-btn dv-btn-gold" disabled={busy} aria-busy={busy} style={{ minWidth: 220 }}>
              {busy ? "در حال ثبت…" : "ارسال استعلام قیمت برای کارشناس"}
            </button>
          </form>
        </section>
      ) : (
        <div className="dv-b2b-card" style={{ background: "#fef3c7", borderColor: "#fde68a" }}>
          <p style={{ margin: 0, color: "#92400e", fontSize: "0.9rem" }}>
            دسترسی شما در وضعیت «حساب‌دار» قرار دارد. شما می‌توانید پیش‌فاکتورها، گزارش‌های مالی و فاکتورها را مشاهده کنید، اما ثبت سفارش توسط خریدار سازمان انجام می‌شود.
          </p>
        </div>
      )}

      {/* RFQ and Quote History */}
      <section aria-label="درخواست‌های سازمان">
        <h2 style={{ fontSize: "1.4rem", color: "var(--dv-navy)", marginBottom: 16 }}>
          فهرست استعلام‌ها و پیش‌فاکتورهای صادر شده
        </h2>

        {rfqs !== null && rfqs.length === 0 ? (
          <div className="dv-b2b-card" style={{ textAlign: "center", padding: 48 }}>
            <p className="dv-muted">تاکنون درخواستی برای این مجموعه ثبت نشده است.</p>
          </div>
        ) : null}

        {rfqs !== null
          ? rfqs.map((rfq) => {
              const quote = rfq.quote;
              const latest = quote?.revisions[quote.revisions.length - 1] ?? null;
              const canAccept = isBuyer && quote !== null && quote.status === "SENT" && latest !== null;

              return (
                <article key={rfq.id} className="dv-b2b-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className={`dv-status-pill dv-status-${rfq.status}`}>
                        {STATUS_LABELS[rfq.status] ?? rfq.status}
                      </span>
                      <strong style={{ fontSize: "1.05rem" }} dir="ltr">
                        RFQ-{rfq.id.slice(-8).toUpperCase()}
                      </strong>
                    </div>
                    <span className="dv-muted" style={{ fontSize: "0.85rem" }}>
                      ثبت: {new Date(rfq.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>

                  <div style={{ background: "#fdfbf7", padding: "14px 18px", borderRadius: 10, border: "1px solid var(--dv-line)", marginBottom: 16 }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 600 }}>اقلام مورد استعلام:</p>
                    <ul style={{ margin: 0, paddingRight: 20 }}>
                      {rfq.items.map((item, idx) => (
                        <li key={idx} style={{ fontSize: "0.9rem", color: "var(--dv-ink-soft)", marginBlock: 4 }}>
                          <strong>{item.productName}</strong> — تیراژ: {item.quantity} عدد
                          {item.itemKind === "OEM" ? (
                            <span className="dv-badge" style={{ marginRight: 8, background: "#ede9fe", color: "#6d28d9" }}>
                              فرمولاسیون اختصاصی (OEM)
                            </span>
                          ) : (
                            <span className="dv-badge" style={{ marginRight: 8, background: "#e0f2fe", color: "#0369a1" }}>
                              کاتالوگ رسمی
                            </span>
                          )}
                          {item.specNote ? <p style={{ fontSize: "0.82rem", margin: "4px 0 0", color: "var(--dv-muted)" }}>مشخصات: {item.specNote}</p> : null}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Attachments Panel */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: "0.92rem", margin: "0 0 8px", color: "var(--dv-navy)" }}>
                      مستندات و ضمیمه‌ها ({rfq.attachments.length}/3)
                    </h4>
                    {rfq.attachments.length === 0 ? (
                      <p className="dv-muted" style={{ fontSize: "0.85rem" }}>ضمیمه‌ای بارگذاری نشده است.</p>
                    ) : (
                      <ul className="dv-attach-list" style={{ marginBottom: 10 }}>
                        {rfq.attachments.map((att) => (
                          <li key={att.id} className="dv-attach-item">
                            <button
                              type="button"
                              className="dv-link"
                              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 600 }}
                              onClick={() => void handleOrgDownload(rfq.id, att.id, att.filename)}
                            >
                              📄 {att.filename}
                            </button>
                            <span className="dv-attach-size" style={{ fontSize: "0.8rem", color: "var(--dv-muted)" }}>
                              {Math.max(1, Math.round(att.sizeBytes / 1024))} کیلوبایت
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {isBuyer && rfq.attachments.length < 3 ? (
                      <div style={{ marginTop: 8 }}>
                        <label style={{ fontSize: "0.82rem", color: "var(--dv-ink-soft)", display: "block", marginBottom: 4 }}>
                          افزودن مدرک جدید (PDF, PNG, JPG - حداکثر ۵۱۲ کیلوبایت):
                        </label>
                        <input
                          type="file"
                          className="dv-file-input"
                          accept="application/pdf,image/png,image/jpeg"
                          aria-label={`بارگذاری پیوست برای ${rfq.id}`}
                          disabled={attaching}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              attachTarget.current = rfq.id;
                              void handleOrgAttach(file, rfq.id);
                            }
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* Quote Details & Revision Timeline */}
                  {quote !== null ? (
                    <div style={{ background: "#fcf9f2", border: "1px solid rgba(212, 175, 55, 0.35)", borderRadius: 12, padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className="dv-badge" style={{ background: "var(--dv-gold)", color: "#1c1913", fontWeight: 800 }}>
                            پیش‌فاکتور رسمی {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
                          </span>
                          <span style={{ fontSize: "0.85rem", color: "var(--dv-muted)" }}>
                            مهلت اعتبار: <strong dir="ltr">{new Date(quote.validUntil).toLocaleDateString("fa-IR")}</strong>
                          </span>
                        </div>
                      </div>

                      {latest !== null ? (
                        <div className="dv-quote-revision-item">
                          <div className="dv-quote-revision-header">
                            <span style={{ fontWeight: 700, color: "var(--dv-navy)" }}>
                              نسخه شماره {latest.revisionNo}
                            </span>
                            <span className="dv-badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>قیمت‌گذاری شرکتی</span>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                            {latest.lines.map((line, index) => (
                              <div key={index} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                                <span>{line.productName} × {line.quantity}</span>
                                <strong>{formatPrice(line.lineTotalMinor, quote.currency)}</strong>
                              </div>
                            ))}
                          </div>

                          <div style={{ borderTop: "1px solid rgba(212, 175, 55, 0.2)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 800 }}>مبلغ کل پیش‌فاکتور:</span>
                            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--dv-navy)" }}>
                              {formatPrice(latest.subtotalMinor, latest.currency)}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: "0.85rem", color: "var(--dv-muted)" }}>
                            {latest.leadTimeDays ? <span>⏱ زمان تحویل: {latest.leadTimeDays} روز کاری</span> : null}
                            {latest.paymentTerms ? <span>💳 نحوه تسویه: {latest.paymentTerms}</span> : null}
                          </div>
                        </div>
                      ) : null}

                      {/* Quote Acceptance Form */}
                      {canAccept ? (
                        <div style={{ marginTop: 20, background: "#ffffff", padding: 18, borderRadius: 10, border: "1px solid var(--dv-line)" }}>
                          <h4 style={{ margin: "0 0 12px", color: "var(--dv-navy)" }}>
                            تأیید پیش‌فاکتور و ثبت آدرس تحویل محموله
                          </h4>
                          <div className="dv-b2b-field-grid">
                            <input
                              type="text"
                              className="dv-checkout-input"
                              placeholder="نام گیرنده و تحویل‌گیرنده"
                              value={address.fullName}
                              onChange={(event) => setAddress({ ...address, fullName: event.target.value })}
                            />
                            <input
                              type="text"
                              dir="ltr"
                              className="dv-checkout-input"
                              placeholder="موبایل تحویل‌گیرنده (0912...)"
                              value={address.phone}
                              onChange={(event) => setAddress({ ...address, phone: event.target.value })}
                            />
                            <input
                              type="text"
                              className="dv-checkout-input"
                              placeholder="استان"
                              value={address.province}
                              onChange={(event) => setAddress({ ...address, province: event.target.value })}
                            />
                            <input
                              type="text"
                              className="dv-checkout-input"
                              placeholder="شهر"
                              value={address.city}
                              onChange={(event) => setAddress({ ...address, city: event.target.value })}
                            />
                            <input
                              type="text"
                              dir="ltr"
                              className="dv-checkout-input"
                              placeholder="کد پستی ۱۰ رقمی"
                              value={address.postalCode}
                              onChange={(event) => setAddress({ ...address, postalCode: event.target.value })}
                            />
                          </div>
                          <div style={{ marginTop: 10 }}>
                            <input
                              type="text"
                              className="dv-checkout-input"
                              placeholder="نشانی دقیق پستی انبار / دفتر سازمان"
                              value={address.addressLine}
                              onChange={(event) => setAddress({ ...address, addressLine: event.target.value })}
                            />
                          </div>
                          <button
                            type="button"
                            className="dv-btn dv-btn-gold dv-btn-block"
                            style={{ marginTop: 14 }}
                            disabled={busy}
                            onClick={() => void handleAccept(quote.id)}
                            aria-busy={busy}
                          >
                            {busy ? "در حال ایجاد سفارش…" : "✓ پذیرش پیش‌فاکتور و تبدیل به سفارش قطعی"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, color: "var(--dv-muted)", fontSize: "0.88rem" }}>
                      ⏳ استعلام در حال بررسی واحد فنی و بازرگانی است — پیش‌فاکتور قیمت پس از تعیین تخفیف سازمانی صادر خواهد شد.
                    </div>
                  )}
                </article>
              );
            })
          : null}
      </section>

      {error !== null ? (
        <p className="dv-cart-feedback dv-cart-feedback-error" role="alert" style={{ marginTop: 20 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
