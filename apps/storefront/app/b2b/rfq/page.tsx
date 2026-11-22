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
 * the quote into a real order (honest: payment still follows the normal
 * locked path).
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

  const handleTrack = async (): Promise<void> => {
    if (trackId.trim() === "" || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setRfq(await getRfq(trackId.trim()));
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
    <div className="container dv-page dv-b2b-apply">
      <h1>درخواست قیمت (RFQ)</h1>
      <p className="dv-about-lede">
        محصول و تعداد موردنیاز خود را ثبت کنید. کارشناس فروش پس از بررسی،
        پیش‌فاکتور رسمی با اعتبار زمانی صادر می‌کند و می‌توانید از همین صفحه
        پذیرش دهید.
      </p>

      <div className="dv-order-banner" role="note">
        قیمت‌های پیش‌فاکتور در این فاز <strong>نمونه (SAMPLE)</strong> هستند —
        قیمت‌گذاری قراردادی نهایی پس از تصمیم کسب‌وکار فعال می‌شود.
      </div>

      {acceptedOrder !== null ? (
        <div className="dv-empty dv-cart-empty" role="status">
          <p>
            پیش‌فاکتور پذیرفته شد و سفارش ساخته شد ✓ — کد سفارش:{" "}
            <span dir="ltr">{acceptedOrder}</span>
          </p>
          <Link href="/cart" className="dv-btn dv-btn-gold">
            ادامه
          </Link>
        </div>
      ) : (
        <form className="dv-checkout-form" onSubmit={handleSubmit}>
          <label htmlFor="rfq-contact">نام و نام خانوادگی</label>
          <input
            id="rfq-contact"
            value={form.contactName}
            onChange={(event) => setForm({ ...form, contactName: event.target.value })}
            required
            minLength={2}
          />
          <label htmlFor="rfq-phone">شماره موبایل</label>
          <input
            id="rfq-phone"
            dir="ltr"
            inputMode="numeric"
            placeholder="09123456789"
            value={form.contactPhone}
            onChange={(event) => setForm({ ...form, contactPhone: event.target.value })}
            required
          />
          <label htmlFor="rfq-product">نام محصول / شرح کالا</label>
          <input
            id="rfq-product"
            value={form.productName}
            onChange={(event) => setForm({ ...form, productName: event.target.value })}
            required
            minLength={2}
          />
          <fieldset className="dv-choice-row">
            <legend>نوع خط:</legend>
            <label className="dv-choice-option">
              <input
                type="radio"
                name="rfq-item-kind"
                checked={form.itemKind === "CATALOG"}
                onChange={() => setForm({ ...form, itemKind: "CATALOG" })}
              />
              کاتالوگ موجود
            </label>
            <label className="dv-choice-option">
              <input
                type="radio"
                name="rfq-item-kind"
                checked={form.itemKind === "OEM"}
                onChange={() => setForm({ ...form, itemKind: "OEM" })}
              />
              سفارشی / OEM
            </label>
          </fieldset>
          {form.itemKind === "OEM" ? (
            <>
              <label htmlFor="rfq-spec">شرح فنی سفارش (حداقل ۱۰ نویسه)</label>
              <textarea
                id="rfq-spec"
                className="dv-checkout-textarea"
                value={form.specNote}
                onChange={(event) => setForm({ ...form, specNote: event.target.value })}
                rows={3}
                minLength={10}
                required
              />
            </>
          ) : null}
          <label htmlFor="rfq-qty">تعداد</label>
          <input
            id="rfq-qty"
            dir="ltr"
            inputMode="numeric"
            value={form.quantity}
            onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            required
          />
          <label htmlFor="rfq-note">توضیحات (اختیاری)</label>
          <input
            id="rfq-note"
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
          />
          <fieldset className="dv-brief-grid">
            <legend className="dv-muted">بریف سفارشی (N10 — اختیاری)</legend>
            <label htmlFor="rfq-market">بازار هدف</label>
            <input
              id="rfq-market"
              value={form.targetMarket}
              onChange={(event) => setForm({ ...form, targetMarket: event.target.value })}
            />
            <label htmlFor="rfq-packaging">بسته‌بندی</label>
            <input
              id="rfq-packaging"
              value={form.packaging}
              onChange={(event) => setForm({ ...form, packaging: event.target.value })}
            />
            <label htmlFor="rfq-delivery">تحویل درخواستی (YYYY-MM-DD)</label>
            <input
              id="rfq-delivery"
              dir="ltr"
              placeholder="2026-03-15"
              value={form.requestedDeliveryDate}
              onChange={(event) => setForm({ ...form, requestedDeliveryDate: event.target.value })}
            />
            <label className="dv-choice-option" htmlFor="rfq-conf">
              <input
                id="rfq-conf"
                type="checkbox"
                checked={form.confidentiality}
                onChange={(event) => setForm({ ...form, confidentiality: event.target.checked })}
              />
              این درخواست محرمانه است
            </label>
          </fieldset>
          <button type="submit" className="dv-btn dv-btn-block" disabled={busy} aria-busy={busy}>
            {busy ? "در حال ارسال…" : "ثبت درخواست قیمت"}
          </button>
          {error !== null ? (
            <p className="dv-cart-feedback-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}

      <section className="dv-b2b-track" aria-label="پیگیری و پیش‌فاکتور">
        <h2>پیگیری و پذیرش</h2>
        <div className="dv-admin-filter">
          <input
            type="text"
            dir="ltr"
            aria-label="شناسه درخواست قیمت"
            placeholder="rfq-…"
            value={trackId}
            onChange={(event) => setTrackId(event.target.value)}
          />
          <button type="button" className="dv-btn dv-btn-gold" onClick={() => void handleTrack()} disabled={busy}>
            استعلام
          </button>
        </div>

        {rfq !== null ? (
          <div className="dv-card dv-b2b-app">
            <p>
              وضعیت: <strong>{STATUS_LABELS[rfq.status] ?? rfq.status}</strong>
            </p>
            {rfq.items.length > 0 ? (
              <p className="dv-muted">
                اقلام:{" "}
                {rfq.items
                  .map((item) =>
                    item.itemKind === "OEM"
                      ? `${item.productName}×${item.quantity} (سفارشی/OEM)`
                      : `${item.productName}×${item.quantity}`,
                  )
                  .join("، ")}
              </p>
            ) : null}
            <div className="dv-sandbox-panel">
              <h4 className="dv-sandbox-title">
                پیوست‌ها ({rfq.attachments.length}/3)
              </h4>
              {rfq.attachments.length === 0 ? (
                <p className="dv-muted">پیوستی بارگذاری نشده است — برای مشخصات فنی می‌توانید فایل بچسبانید.</p>
              ) : (
                <ul className="dv-attach-list">
                  {rfq.attachments.map((att) => (
                    <li key={att.id} className="dv-attach-item">
                      <a
                        href={rfqAttachmentDownloadUrl(rfq.id, att.id)}
                        className="dv-link"
                        download={att.filename}
                      >
                        {att.filename}
                      </a>
                      <span className="dv-attach-size">
                        {Math.max(1, Math.round(att.sizeBytes / 1024))} کیلوبایت
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {rfq.attachments.length < 3 ? (
                <input
                  ref={fileInput}
                  type="file"
                  className="dv-file-input"
                  accept="application/pdf,image/png,image/jpeg"
                  aria-label="بارگذاری پیوست"
                  disabled={attaching}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleAttach(file);
                    }
                  }}
                />
              ) : (
                <p className="dv-muted">سقف ۳ پیوست پر شده است.</p>
              )}
            </div>
            {quote !== null ? (
              <>
                <p>
                  پیش‌فاکتور: <span dir="ltr">{quote.id}</span> —{" "}
                  {QUOTE_STATUS_LABELS[quote.status] ?? quote.status} — اعتبار تا{" "}
                  <span dir="ltr">{new Date(quote.validUntil).toISOString().slice(0, 10)}</span>
                </p>
                {quote.revisions.map((revision) => (
                  <div key={revision.id} className="dv-sandbox-panel">
                    <h4 className="dv-sandbox-title">
                      Revision {revision.revisionNo}
                      <span className="dv-sandbox-chip">SAMPLE</span>
                    </h4>
                    {revision.lines.map((line, index) => (
                      <p key={index}>
                        {line.productName} × {line.quantity} ={" "}
                        {formatPrice(line.lineTotalMinor, quote.currency)}
                      </p>
                    ))}
                    <p className="dv-cart-grand">جمع: {formatPrice(revision.subtotalMinor, revision.currency)}</p>
                    {revision.leadTimeDays !== null ? (
                      <p className="dv-muted">زمان تحویل: {revision.leadTimeDays} روز</p>
                    ) : null}
                    {revision.paymentTerms !== null ? (
                      <p className="dv-muted">شرایط پرداخت: {revision.paymentTerms}</p>
                    ) : null}
                  </div>
                ))}
                {canAccept && latestRevision !== null ? (
                  <div className="dv-pay-actions dv-admin-adjust">
                    <input
                      type="text"
                      aria-label="نام گیرنده"
                      placeholder="نام گیرنده"
                      value={address.fullName}
                      onChange={(event) => setAddress({ ...address, fullName: event.target.value })}
                    />
                    <input
                      type="text"
                      dir="ltr"
                      aria-label="موبایل"
                      placeholder="0912…"
                      value={address.phone}
                      onChange={(event) => setAddress({ ...address, phone: event.target.value })}
                    />
                    <input
                      type="text"
                      aria-label="استان"
                      placeholder="استان"
                      value={address.province}
                      onChange={(event) => setAddress({ ...address, province: event.target.value })}
                    />
                    <input
                      type="text"
                      aria-label="شهر"
                      placeholder="شهر"
                      value={address.city}
                      onChange={(event) => setAddress({ ...address, city: event.target.value })}
                    />
                    <input
                      type="text"
                      dir="ltr"
                      aria-label="کد پستی"
                      placeholder="کد پستی ۱۰ رقمی"
                      value={address.postalCode}
                      onChange={(event) => setAddress({ ...address, postalCode: event.target.value })}
                    />
                    <input
                      type="text"
                      aria-label="نشانی"
                      placeholder="نشانی کامل"
                      value={address.addressLine}
                      onChange={(event) => setAddress({ ...address, addressLine: event.target.value })}
                    />
                    <button
                      type="button"
                      className="dv-btn dv-btn-block"
                      disabled={accepting}
                      onClick={() => void handleAccept()}
                      aria-busy={accepting}
                    >
                      {accepting ? "در حال تبدیل…" : "پذیرش پیش‌فاکتور و ساخت سفارش"}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="dv-muted">هنوز پیش‌فاکتوری برای این درخواست صادر نشده است.</p>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
