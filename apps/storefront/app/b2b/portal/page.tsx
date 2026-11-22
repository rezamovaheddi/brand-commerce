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
      <div className="container dv-page dv-b2b-apply">
        <h1>پورتال سازمانی</h1>
        <p className="dv-about-lede">
          اگر سازمان شما توسط فروش تأیید شده است، کلید دسترسی سازمانی خود را از
          اپراتور دریافت و وارد کنید. شناسایی واقعی کاربران (ورود با رمز) در فاز
          Identity فعال می‌شود و این کلید جانشین می‌شود.
        </p>
        <form className="dv-checkout-form" onSubmit={handleKeySubmit}>
          <label htmlFor="org-key">کلید دسترسی سازمانی</label>
          <input
            id="org-key"
            dir="ltr"
            placeholder="dvorg_…"
            value={keyInput}
            onChange={(event) => setKeyInput(event.target.value)}
            required
          />
          <button type="submit" className="dv-btn dv-btn-block" disabled={busy} aria-busy={busy}>
            {busy ? "در حال بررسی…" : "ورود به پورتال"}
          </button>
          {error !== null ? (
            <p className="dv-cart-feedback-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
        <p className="dv-muted">
          هنوز سازمان ندارید؟{" "}
          <Link href="/b2b/apply" className="dv-link">
            درخواست همکاری بدهید
          </Link>{" "}
          یا{" "}
          <Link href="/b2b/rfq" className="dv-link">
            درخواست قیمت عمومی
          </Link>{" "}
          ثبت کنید.
        </p>
      </div>
    );
  }

  return (
    <div className="container dv-page dv-b2b-apply">
      <h1>پورتال سازمانی</h1>

      <div className="dv-order-banner" role="status">
        <strong>{me.organizationName}</strong> {me.isSample ? "(نمونه — در انتظار تأیید کسب‌وکار)" : ""} —
        عضو: {me.memberName} | نقش: {ROLE_LABELS[me.role] ?? me.role}{" "}
        <button type="button" className="dv-admin-tab" onClick={handleLogout}>
          خروج
        </button>
      </div>

      {acceptedOrder !== null ? (
        <div className="dv-empty dv-cart-empty" role="status">
          <p>
            پیش‌فاکتور پذیرفته شد و سفارش ساخته شد ✓ — کد سفارش:{" "}
            <span dir="ltr">{acceptedOrder}</span>
          </p>
          <Link href="/orders" className="dv-btn dv-btn-gold">
            مشاهده سفارش
          </Link>
        </div>
      ) : null}

      {isBuyer ? (
        <section aria-label="ثبت درخواست قیمت سازمانی">
          <h2>درخواست قیمت سازمانی</h2>
          <form className="dv-checkout-form" onSubmit={handleRfqSubmit}>
            <label htmlFor="portal-contact">نام و نام خانوادگی</label>
            <input
              id="portal-contact"
              value={form.contactName}
              onChange={(event) => setForm({ ...form, contactName: event.target.value })}
              required
              minLength={2}
            />
            <label htmlFor="portal-phone">شماره موبایل</label>
            <input
              id="portal-phone"
              dir="ltr"
              inputMode="numeric"
              placeholder="09123456789"
              value={form.contactPhone}
              onChange={(event) => setForm({ ...form, contactPhone: event.target.value })}
              required
            />
            <label htmlFor="portal-product">نام محصول / شرح کالا</label>
            <input
              id="portal-product"
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
                  name="portal-item-kind"
                  checked={form.itemKind === "CATALOG"}
                  onChange={() => setForm({ ...form, itemKind: "CATALOG" })}
                />
                کاتالوگ موجود
              </label>
              <label className="dv-choice-option">
                <input
                  type="radio"
                  name="portal-item-kind"
                  checked={form.itemKind === "OEM"}
                  onChange={() => setForm({ ...form, itemKind: "OEM" })}
                />
                سفارشی / OEM
              </label>
            </fieldset>
            {form.itemKind === "OEM" ? (
              <>
                <label htmlFor="portal-spec">شرح فنی سفارش (حداقل ۱۰ نویسه)</label>
                <textarea
                  id="portal-spec"
                  className="dv-checkout-textarea"
                  value={form.specNote}
                  onChange={(event) => setForm({ ...form, specNote: event.target.value })}
                  rows={3}
                  minLength={10}
                  required
                />
              </>
            ) : null}
            <label htmlFor="portal-qty">تعداد</label>
            <input
              id="portal-qty"
              dir="ltr"
              inputMode="numeric"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
              required
            />
            <label htmlFor="portal-note">توضیحات (اختیاری)</label>
            <input
              id="portal-note"
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
            <fieldset className="dv-brief-grid">
              <legend className="dv-muted">بریف سفارشی (N10 — اختیاری)</legend>
              <label htmlFor="portal-market">بازار هدف</label>
              <input
                id="portal-market"
                value={form.targetMarket}
                onChange={(event) => setForm({ ...form, targetMarket: event.target.value })}
              />
              <label htmlFor="portal-packaging">بسته‌بندی</label>
              <input
                id="portal-packaging"
                value={form.packaging}
                onChange={(event) => setForm({ ...form, packaging: event.target.value })}
              />
              <label htmlFor="portal-delivery">تحویل درخواستی (YYYY-MM-DD)</label>
              <input
                id="portal-delivery"
                dir="ltr"
                placeholder="2026-03-15"
                value={form.requestedDeliveryDate}
                onChange={(event) => setForm({ ...form, requestedDeliveryDate: event.target.value })}
              />
              <label className="dv-choice-option" htmlFor="portal-conf">
                <input
                  id="portal-conf"
                  type="checkbox"
                  checked={form.confidentiality}
                  onChange={(event) => setForm({ ...form, confidentiality: event.target.checked })}
                />
                این درخواست محرمانه است
              </label>
            </fieldset>
            <button type="submit" className="dv-btn dv-btn-block" disabled={busy} aria-busy={busy}>
              {busy ? "در حال ارسال…" : "ثبت درخواست سازمانی"}
            </button>
          </form>
        </section>
      ) : (
        <div className="dv-order-banner" role="note">
          نقش شما (حساب‌دار) اجازه ثبت درخواست قیمت یا پذیرش پیش‌فاکتور ندارد —
          فقط مشاهده داده‌های سازمان ممکن است.
        </div>
      )}

      <section className="dv-b2b-track" aria-label="درخواست‌های سازمان">
        <h2>درخواست‌های سازمان</h2>
        {rfqs !== null && rfqs.length === 0 ? (
          <div className="dv-empty">هنوز درخواستی برای این سازمان ثبت نشده است.</div>
        ) : null}
        {rfqs !== null
          ? rfqs.map((rfq) => {
              const quote = rfq.quote;
              const latest = quote?.revisions[quote.revisions.length - 1] ?? null;
              const canAccept = isBuyer && quote !== null && quote.status === "SENT" && latest !== null;
              return (
                <article key={rfq.id} className="dv-card dv-b2b-app">
                  <h3>
                    <span dir="ltr">{rfq.id.slice(-8)}</span> — {STATUS_LABELS[rfq.status] ?? rfq.status}
                  </h3>
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
                  <div className="dv-sandbox-panel">
                    <h4 className="dv-sandbox-title">پیوست‌ها ({rfq.attachments.length}/3)</h4>
                    {rfq.attachments.length === 0 ? (
                      <p className="dv-muted">پیوستی ثبت نشده است.</p>
                    ) : (
                      <ul className="dv-attach-list">
                        {rfq.attachments.map((att) => (
                          <li key={att.id} className="dv-attach-item">
                            <button
                              type="button"
                              className="dv-link"
                              style={{ background: "none", border: "none", padding: 0 }}
                              onClick={() => void handleOrgDownload(rfq.id, att.id, att.filename)}
                            >
                              {att.filename}
                            </button>
                            <span className="dv-attach-size">
                              {Math.max(1, Math.round(att.sizeBytes / 1024))} کیلوبایت
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {isBuyer && rfq.attachments.length < 3 ? (
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
                    ) : null}
                  </div>
                  {quote !== null ? (
                    <>
                      <p className="dv-muted">
                        پیش‌فاکتور: {QUOTE_STATUS_LABELS[quote.status] ?? quote.status} — اعتبار تا{" "}
                        <span dir="ltr">{new Date(quote.validUntil).toISOString().slice(0, 10)}</span>
                      </p>
                      {latest !== null ? (
                        <div className="dv-sandbox-panel">
                          <h4 className="dv-sandbox-title">
                            Revision {latest.revisionNo}
                            <span className="dv-sandbox-chip">SAMPLE</span>
                          </h4>
                          {latest.lines.map((line, index) => (
                            <p key={index}>
                              {line.productName} × {line.quantity} ={" "}
                              {formatPrice(line.lineTotalMinor, quote.currency)}
                            </p>
                          ))}
                          <p className="dv-cart-grand">جمع: {formatPrice(latest.subtotalMinor, latest.currency)}</p>
                          {latest.leadTimeDays !== null ? (
                            <p className="dv-muted">زمان تحویل: {latest.leadTimeDays} روز</p>
                          ) : null}
                          {latest.paymentTerms !== null ? (
                            <p className="dv-muted">شرایط پرداخت: {latest.paymentTerms}</p>
                          ) : null}
                        </div>
                      ) : null}
                      {canAccept ? (
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
                            disabled={busy}
                            onClick={() => void handleAccept(quote.id)}
                            aria-busy={busy}
                          >
                            {busy ? "در حال تبدیل…" : "پذیرش پیش‌فاکتور و ساخت سفارش"}
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="dv-muted">در انتظار قیمت‌گذاری توسط فروش.</p>
                  )}
                </article>
              );
            })
          : null}
      </section>

      {error !== null ? (
        <p className="dv-cart-feedback-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
