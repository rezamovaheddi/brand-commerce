"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Rfq } from "@bc/contracts";
import {
  CartApiError,
  acceptQuote,
  fileToAttachmentPayload,
  getRfq,
  rfqAttachmentDownloadUrl,
  submitRfq,
  uploadRfqAttachment,
  validateAttachmentFile,
} from "../../../lib/b2b-client";
import { formatPrice } from "../../../lib/format";

/**
 * Public RFQ page: submit a quote request (CATALOG or OEM line) → track
 * status → attach files (PDF/PNG/JPEG ≤512KB, ≤3) → view quote revisions
 * (SAMPLE-marked prices) → accept with a shipping address, which converts
 * the quote into a real order.
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
  SUBMITTED: "ثبت‌شده و در انتظار بررسی",
  PRICED: "در حال بررسی و قیمت‌گذاری",
  QUOTED: "پیش‌فاکتور صادر شد ✓",
  ACCEPTED: "پذیرفته‌شده و سفارش ساخته شد",
  REJECTED: "عدم امکان تأمین",
  CLOSED: "بسته شده",
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  SENT: "ارسال‌شده و آماده پذیرش",
  ACCEPTED: "پذیرفته‌شده",
  REJECTED: "رد‌شده",
  EXPIRED: "منقضی شده",
};

export default function RfqPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [trackId, setTrackId] = useState("");
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [accepting, setAccepting] = useState(false);
  const [acceptedOrder, setAcceptedOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const isOem = form.itemKind === "OEM";
      const created = await submitRfq({
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
      setRfq(created);
      setTrackId(created.id);
      setForm(EMPTY_FORM);
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در ثبت RFQ.");
    } finally {
      setBusy(false);
    }
  };

  const handleAttach = async (file: File): Promise<void> => {
    if (rfq === null || attaching) {
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
      await uploadRfqAttachment(rfq.id, payload);
      setRfq(await getRfq(rfq.id));
      if (fileInput.current !== null) {
        fileInput.current.value = "";
      }
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در بارگذاری پیوست.");
    } finally {
      setAttaching(false);
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
      setRfq(await getRfq(idToFetch));
      setTrackId(idToFetch);
    } catch (cause) {
      const message = cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در پیگیری.";
      setError(message === "پاسخ نامعتبر بود." ? "درخواستی با این شناسه یافت نشد." : message);
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async (): Promise<void> => {
    const quoteToAccept = rfq?.quote ?? null;
    if (quoteToAccept === null || accepting) {
      return;
    }
    setAccepting(true);
    setError(null);
    try {
      const result = await acceptQuote(quoteToAccept.id, address);
      setAcceptedOrder(result.order.id);
      const rfqId = rfq?.id ?? "";
      setRfq(await getRfq(rfqId));
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در پذیرش پیش‌فاکتور.");
    } finally {
      setAccepting(false);
    }
  };

  const quote = rfq?.quote ?? null;
  const latestRevision = quote?.revisions[quote.revisions.length - 1] ?? null;
  const canAccept = quote !== null && quote.status === "SENT";

  return (
    <div className="dv-b2b-container">
      {/* Hero */}
      <div className="dv-b2b-hero">
        <h1 className="dv-b2b-header-title">استعلام قیمت سازمانی و سفارشی (RFQ)</h1>
        <p className="dv-b2b-header-desc">
          برای استعلام سفارش‌های تیراژ بالا از محصولات استاندارد کاتالوگ یا ثبت سفارش تولید اختصاصی (OEM / Private Label)،
          فرم زیر را ارسال فرمایید تا کارشناسان بازرگانی پیش‌فاکتور رسمی را در کوتاه‌ترین زمان ممکن صادر کنند.
        </p>
      </div>

      {acceptedOrder !== null ? (
        <div className="dv-b2b-card" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", textAlign: "center", padding: 32 }} role="status">
          <h2 style={{ color: "#065f46", margin: "0 0 10px" }}>✓ پیش‌فاکتور با موفقیت تأیید شد و سفارش ثبت گردید</h2>
          <p style={{ fontSize: "1.05rem", margin: "0 0 16px" }}>
            کد رهگیری سفارش: <strong dir="ltr">{acceptedOrder}</strong>
          </p>
          <Link href={`/orders/${acceptedOrder}`} className="dv-btn dv-btn-gold">
            مشاهده سفارش و تسویه سندباکس
          </Link>
        </div>
      ) : (
        <div className="dv-b2b-card">
          <h2>ثبت مشخصات استعلام جدید</h2>
          <form onSubmit={handleSubmit}>
            <div className="dv-b2b-field-grid">
              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="rfq-contact">نام و نام خانوادگی نماینده</label>
                <input
                  id="rfq-contact"
                  className="dv-checkout-input"
                  placeholder="مثال: مهندس رادمهر"
                  value={form.contactName}
                  onChange={(event) => setForm({ ...form, contactName: event.target.value })}
                  required
                  minLength={2}
                />
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="rfq-phone">شماره تماس همراه</label>
                <input
                  id="rfq-phone"
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
              <label className="dv-checkout-label">نوع خط محصول مورد درخواست</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div
                  className={`dv-b2b-choice-card ${form.itemKind === "CATALOG" ? "is-active" : ""}`}
                  onClick={() => setForm({ ...form, itemKind: "CATALOG" })}
                >
                  <input
                    type="radio"
                    name="rfq-item-kind"
                    checked={form.itemKind === "CATALOG"}
                    onChange={() => setForm({ ...form, itemKind: "CATALOG" })}
                  />
                  <div>
                    <strong style={{ display: "block" }}>محصول کاتالوگ موجود</strong>
                    <span className="dv-muted" style={{ fontSize: "0.8rem" }}>سفارش عمده محصولات دارای پروانه ساخت</span>
                  </div>
                </div>

                <div
                  className={`dv-b2b-choice-card ${form.itemKind === "OEM" ? "is-active" : ""}`}
                  onClick={() => setForm({ ...form, itemKind: "OEM" })}
                >
                  <input
                    type="radio"
                    name="rfq-item-kind"
                    checked={form.itemKind === "OEM"}
                    onChange={() => setForm({ ...form, itemKind: "OEM" })}
                  />
                  <div>
                    <strong style={{ display: "block" }}>سفارشی / Private Label (OEM)</strong>
                    <span className="dv-muted" style={{ fontSize: "0.8rem" }}>تولید با بسته و فرمول اختصاصی برند شما</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dv-b2b-field-grid">
              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="rfq-product">نام یا فرمولاسیون مدنظر</label>
                <input
                  id="rfq-product"
                  className="dv-checkout-input"
                  placeholder="مثال: لوسیون سد دفاعی پوست یا سرم نیاسینامید ۱۰٪"
                  value={form.productName}
                  onChange={(event) => setForm({ ...form, productName: event.target.value })}
                  required
                  minLength={2}
                />
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="rfq-qty">تیراژ درخواستی (عدد)</label>
                <input
                  id="rfq-qty"
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
                <label className="dv-checkout-label" htmlFor="rfq-spec">
                  مشخصات فنی، درصد ماده اکتیو و استانداردهای موردنیاز (حداقل ۱۰ نویسه)
                </label>
                <textarea
                  id="rfq-spec"
                  className="dv-checkout-input dv-checkout-textarea"
                  value={form.specNote}
                  onChange={(event) => setForm({ ...form, specNote: event.target.value })}
                  rows={3}
                  minLength={10}
                  required
                />
              </div>
            ) : null}

            <div className="dv-b2b-field-grid">
              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="rfq-market">کانال توزیع / بازار هدف (اختیاری)</label>
                <input
                  id="rfq-market"
                  className="dv-checkout-input"
                  value={form.targetMarket}
                  onChange={(event) => setForm({ ...form, targetMarket: event.target.value })}
                />
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="rfq-packaging">الزامات بسته‌بندی (اختیاری)</label>
                <input
                  id="rfq-packaging"
                  className="dv-checkout-input"
                  value={form.packaging}
                  onChange={(event) => setForm({ ...form, packaging: event.target.value })}
                />
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="rfq-delivery">مهلت تحویل مورد انتظار</label>
                <input
                  id="rfq-delivery"
                  dir="ltr"
                  className="dv-checkout-input"
                  placeholder="2026-06-01"
                  value={form.requestedDeliveryDate}
                  onChange={(event) => setForm({ ...form, requestedDeliveryDate: event.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBlock: 12 }}>
              <label className="dv-choice-option" htmlFor="rfq-conf" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  id="rfq-conf"
                  type="checkbox"
                  checked={form.confidentiality}
                  onChange={(event) => setForm({ ...form, confidentiality: event.target.checked })}
                />
                <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>اطلاعات فنی این درخواست کاملاً محرمانه تلقی گردد</span>
              </label>
            </div>

            <button type="submit" className="dv-btn dv-btn-gold" disabled={busy} aria-busy={busy} style={{ minWidth: 220 }}>
              {busy ? "در حال ثبت استعلام…" : "ارسال درخواست استعلام قیمت"}
            </button>

            {error !== null ? (
              <p className="dv-cart-feedback dv-cart-feedback-error" role="alert" style={{ marginTop: 12 }}>
                {error}
              </p>
            ) : null}
          </form>
        </div>
      )}

      {/* Tracking Section */}
      <div className="dv-b2b-card">
        <h3>پیگیری و بررسی پیش‌فاکتور صادر شده</h3>
        <p className="dv-muted" style={{ fontSize: "0.85rem", marginBottom: 14 }}>
          شناسه پیگیری استعلام قیمت خود را وارد کنید تا وضعیت بررسی فنی یا پیش‌فاکتور رسمی را ملاحظه نمایید.
        </p>

        <div style={{ display: "flex", gap: 10, maxWidth: 500, marginBottom: 12 }}>
          <input
            type="text"
            dir="ltr"
            className="dv-checkout-input"
            aria-label="شناسه درخواست قیمت"
            placeholder="شناسه استعلام (مثال: cmw...)"
            value={trackId}
            onChange={(event) => setTrackId(event.target.value)}
          />
          <button type="button" className="dv-btn dv-btn-gold" onClick={() => void handleTrack()} disabled={busy}>
            استعلام
          </button>
        </div>

        {/* Quick Sample Tracking Button */}
        <div style={{ marginBottom: 18 }}>
          <button
            type="button"
            className="dv-link"
            onClick={() => void handleTrack("cmwqw4ee80000ezas3lktqwp0")}
            style={{ fontSize: "0.82rem", color: "var(--dv-gold)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            ✧ مشاهده نمونه استعلام فرمولاسیون اختصاصی و پیش‌فاکتور OEM (شناسه تستی cmwqw4ee8...)
          </button>
        </div>

        {rfq !== null ? (
          <div style={{ background: "#fcf9f2", border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: 14, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={`dv-status-pill dv-status-${rfq.status}`}>
                  {STATUS_LABELS[rfq.status] ?? rfq.status}
                </span>
                <strong dir="ltr">{rfq.id}</strong>
              </div>
              <span className="dv-muted" style={{ fontSize: "0.85rem" }}>
                متقاضی: {rfq.contactName} ({rfq.contactPhone})
              </span>
            </div>

            <div style={{ background: "#fff", padding: 14, borderRadius: 10, border: "1px solid var(--dv-line)", marginBottom: 16 }}>
              <p style={{ margin: "0 0 6px", fontWeight: 700 }}>شرح اقلام استعلام:</p>
              <ul style={{ margin: 0, paddingRight: 20 }}>
                {rfq.items.map((item, idx) => (
                  <li key={idx} style={{ fontSize: "0.9rem", color: "var(--dv-ink-soft)", marginBlock: 4 }}>
                    <strong>{item.productName}</strong> — تیراژ: {item.quantity} عدد
                    <span className="dv-badge" style={{ marginRight: 8, background: item.itemKind === "OEM" ? "#ede9fe" : "#e0f2fe", color: item.itemKind === "OEM" ? "#6d28d9" : "#0369a1" }}>
                      {item.itemKind === "OEM" ? "سفارشی / OEM" : "کاتالوگ جاری"}
                    </span>
                    {item.specNote ? <p style={{ fontSize: "0.82rem", margin: "4px 0 0", color: "var(--dv-muted)" }}>مشخصات: {item.specNote}</p> : null}
                  </li>
                ))}
              </ul>
            </div>

            {/* Attachments */}
            <div style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: "0.92rem", margin: "0 0 8px", color: "var(--dv-navy)" }}>
                فایل‌ها و ضمائم ({rfq.attachments.length}/3)
              </h4>
              {rfq.attachments.length === 0 ? (
                <p className="dv-muted" style={{ fontSize: "0.85rem" }}>فایلی پیوست نشده است.</p>
              ) : (
                <ul className="dv-attach-list" style={{ marginBottom: 10 }}>
                  {rfq.attachments.map((att) => (
                    <li key={att.id} className="dv-attach-item">
                      <a
                        href={rfqAttachmentDownloadUrl(rfq.id, att.id)}
                        className="dv-link"
                        download={att.filename}
                        style={{ fontWeight: 600 }}
                      >
                        📄 {att.filename}
                      </a>
                      <span className="dv-attach-size" style={{ fontSize: "0.8rem", color: "var(--dv-muted)" }}>
                        {Math.max(1, Math.round(att.sizeBytes / 1024))} کیلوبایت
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {rfq.attachments.length < 3 ? (
                <div>
                  <label style={{ fontSize: "0.82rem", color: "var(--dv-ink-soft)", display: "block", marginBottom: 4 }}>
                    افزودن فرمولاسیون یا مستندات برچسب (حداکثر ۵۱۲ کیلوبایت):
                  </label>
                  <input
                    ref={fileInput}
                    type="file"
                    className="dv-file-input"
                    accept="application/pdf,image/png,image/jpeg"
                    disabled={attaching}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleAttach(file);
                      }
                    }}
                  />
                </div>
              ) : null}
            </div>

            {/* Official Quote */}
            {quote !== null ? (
              <div style={{ background: "#ffffff", border: "1px solid rgba(212, 175, 55, 0.4)", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="dv-badge" style={{ background: "var(--dv-gold)", color: "#1c1913", fontWeight: 800 }}>
                      {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--dv-muted)" }}>
                      اعتبار قیمت تا: <strong dir="ltr">{new Date(quote.validUntil).toLocaleDateString("fa-IR")}</strong>
                    </span>
                  </div>
                </div>

                {latestRevision !== null ? (
                  <div className="dv-quote-revision-item" style={{ background: "#fdfbf7" }}>
                    <div className="dv-quote-revision-header">
                      <span style={{ fontWeight: 700 }}>نسخه شماره {latestRevision.revisionNo}</span>
                      <span className="dv-badge" style={{ background: "#ecfdf5", color: "#065f46" }}>تأییدیه واحد مالی</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBlock: 10 }}>
                      {latestRevision.lines.map((line, index) => (
                        <div key={index} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                          <span>{line.productName} × {line.quantity}</span>
                          <strong>{formatPrice(line.lineTotalMinor, quote.currency)}</strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: "1px solid rgba(212, 175, 55, 0.2)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800 }}>مبلغ کل سفارش:</span>
                      <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--dv-navy)" }}>
                        {formatPrice(latestRevision.subtotalMinor, latestRevision.currency)}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: "0.85rem", color: "var(--dv-muted)" }}>
                      {latestRevision.leadTimeDays ? <span>⏱ زمان تحویل: {latestRevision.leadTimeDays} روز کاری</span> : null}
                      {latestRevision.paymentTerms ? <span>💳 نحوه پرداخت: {latestRevision.paymentTerms}</span> : null}
                    </div>
                  </div>
                ) : null}

                {/* Accept Quote Form */}
                {canAccept ? (
                  <div style={{ marginTop: 20, background: "#fcf9f2", padding: 18, borderRadius: 10, border: "1px solid var(--dv-line)" }}>
                    <h4 style={{ margin: "0 0 12px", color: "var(--dv-navy)" }}>تکمیل آدرس تحویل و پذیرش قطعی</h4>
                    <div className="dv-b2b-field-grid">
                      <input
                        type="text"
                        className="dv-checkout-input"
                        placeholder="نام تحویل‌گیرنده"
                        value={address.fullName}
                        onChange={(event) => setAddress({ ...address, fullName: event.target.value })}
                      />
                      <input
                        type="text"
                        dir="ltr"
                        className="dv-checkout-input"
                        placeholder="موبایل (0912...)"
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
                        placeholder="نشانی دقیق تحویل سفارش"
                        value={address.addressLine}
                        onChange={(event) => setAddress({ ...address, addressLine: event.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      className="dv-btn dv-btn-gold dv-btn-block"
                      style={{ marginTop: 14 }}
                      disabled={accepting}
                      onClick={() => void handleAccept()}
                      aria-busy={accepting}
                    >
                      {accepting ? "در حال صدور سفارش…" : "✓ پذیرش پیش‌فاکتور و ثبت سفارش نهایی"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div style={{ background: "#fff", padding: 12, borderRadius: 8, color: "var(--dv-muted)", fontSize: "0.88rem" }}>
                ⏳ استعلام در حال بررسی واحد فنی و فروش است — پیش‌فاکتور رسمی به زودی صادر خواهد شد.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
