"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { B2BApplication } from "@bc/contracts";
import {
  applicationAttachmentDownloadUrl,
  CartApiError,
  fileToAttachmentPayload,
  getB2BApplication,
  submitB2BApplication,
  uploadApplicationAttachment,
  validateAttachmentFile,
} from "../../../lib/b2b-client";

/**
 * Public B2B application page (B3): distributor/agency submit → attach
 * license/permit documents (PDF/PNG/JPEG ≤512KB, ≤3 files) → track.
 * Honest state: approval creates the organization scaffold only; contract
 * pricing (D-11) and credit (D-12) are pending business decisions and the
 * B2B portal stays locked until then. (Metadata lives in the root layout —
 * per-route metadata is not allowed on client pages.)
 */

const TRACK_HINT = "شناسه پیگیری را نزد خود نگه دارید — برای استعلام وضعیت لازم است.";

export default function B2BApplyPage() {
  const [form, setForm] = useState({
    contactName: "",
    contactPhone: "",
    orgName: "",
    economicCode: "",
    licenseRef: "",
  });
  const [created, setCreated] = useState<B2BApplication | null>(null);
  const [trackId, setTrackId] = useState("");
  const [tracked, setTracked] = useState<B2BApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const docInput = useRef<HTMLInputElement>(null);

  // B3: attach a license/permit document to a submitted application (public
  // upload by application id — same trust level as the tracking endpoint).
  const handleDocUpload = async (file: File, applicationId: string): Promise<void> => {
    if (uploading) {
      return;
    }
    const invalid = validateAttachmentFile(file);
    if (invalid !== null) {
      setError(invalid);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const payload = await fileToAttachmentPayload(file);
      await uploadApplicationAttachment(applicationId, payload);
      const fresh = await getB2BApplication(applicationId);
      if (created !== null && created.id === applicationId) {
        setCreated(fresh);
      }
      if (tracked !== null && tracked.id === applicationId) {
        setTracked(fresh);
      }
      if (docInput.current !== null) {
        docInput.current.value = "";
      }
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در بارگذاری مدرک.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const application = await submitB2BApplication({
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        orgName: form.orgName,
        economicCode: form.economicCode.trim() === "" ? undefined : form.economicCode,
        licenseRef: form.licenseRef.trim() === "" ? undefined : form.licenseRef,
      });
      setCreated(application);
    } catch (cause) {
      setError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در ثبت درخواست.");
    } finally {
      setBusy(false);
    }
  };

  const handleTrack = async (): Promise<void> => {
    if (trackId.trim() === "") {
      return;
    }
    setBusy(true);
    setError(null);
    setTracked(null);
    try {
      setTracked(await getB2BApplication(trackId.trim()));
    } catch (cause) {
      const message = cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در پیگیری.";
      setError(message === "پاسخ نامعتبر بود." ? "درخواستی با این شناسه یافت نشد." : message);
    } finally {
      setBusy(false);
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    SUBMITTED: "ثبت‌شده",
    UNDER_REVIEW: "در حال بررسی",
    APPROVED: "تأیید شده",
    REJECTED: "رد شده",
    NEEDS_INFO: "نیازمند اطلاعات تکمیلی",
  };

  // Shared documents panel (B3): list + upload slot for a known application.
  const renderDocPanel = (application: B2BApplication): React.ReactNode => (
    <div className="dv-sandbox-panel">
      <h4 className="dv-sandbox-title">
        مدارک بارگذاری‌شده ({application.attachments.length}/3)
      </h4>
      {application.attachments.length === 0 ? (
        <p className="dv-muted">
          جواز کسب / مجوز را پیوست کنید (PDF، PNG یا JPEG — حداکثر ۵۱۲ کیلوبایت).
        </p>
      ) : (
        <ul className="dv-attach-list">
          {application.attachments.map((doc) => (
            <li key={doc.id} className="dv-attach-item">
              <a
                href={applicationAttachmentDownloadUrl(application.id, doc.id)}
                className="dv-link"
                download={doc.filename}
              >
                {doc.filename}
              </a>
              <span className="dv-attach-size">
                {Math.max(1, Math.round(doc.sizeBytes / 1024))} کیلوبایت
              </span>
            </li>
          ))}
        </ul>
      )}
      {application.attachments.length < 3 ? (
        <input
          ref={docInput}
          type="file"
          className="dv-file-input"
          accept="application/pdf,image/png,image/jpeg"
          aria-label="بارگذاری مدرک"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleDocUpload(file, application.id);
            }
          }}
        />
      ) : (
        <p className="dv-muted">سقف ۳ مدرک پر شده است.</p>
      )}
    </div>
  );

  return (
    <div className="container dv-page dv-b2b-apply">
      <h1>درخواست همکاری توزیع</h1>
      <p className="dv-about-lede">
        برای همکاری توزیع/آژانس فرم زیر را کامل کنید. کارشناس فروش درخواست را
        بررسی می‌کند و نتیجه با همین شناسه پیگیری قابل مشاهده است.
      </p>

      <div className="dv-order-banner" role="note">
        در این فاز، تأیید فقط «ساختار سازمانی» شما را ایجاد می‌کند — قیمت‌گذاری
        قراردادی و اعتبار سازمانی (پس از تصمیم کسب‌وکار) در فاز بعد فعال می‌شود.
      </div>

      {created !== null ? (
        <div className="dv-empty dv-cart-empty" role="status">
          <p>
            درخواست شما ثبت شد ✓ — شناسه پیگیری:{" "}
            <span dir="ltr">{created.id}</span>
          </p>
          <p className="dv-muted">{TRACK_HINT}</p>
          {renderDocPanel(created)}
          <Link href="/" className="dv-btn dv-btn-gold">
            بازگشت به فروشگاه
          </Link>
        </div>
      ) : (
        <form className="dv-checkout-form" onSubmit={handleSubmit}>
          <label htmlFor="b2b-contact">نام و نام خانوادگی رابط</label>
          <input
            id="b2b-contact"
            value={form.contactName}
            onChange={(event) => setForm({ ...form, contactName: event.target.value })}
            required
            minLength={2}
          />
          <label htmlFor="b2b-phone">شماره موبایل</label>
          <input
            id="b2b-phone"
            dir="ltr"
            inputMode="numeric"
            placeholder="09123456789"
            value={form.contactPhone}
            onChange={(event) => setForm({ ...form, contactPhone: event.target.value })}
            required
          />
          <label htmlFor="b2b-org">نام شرکت / مجموعه</label>
          <input
            id="b2b-org"
            value={form.orgName}
            onChange={(event) => setForm({ ...form, orgName: event.target.value })}
            required
            minLength={2}
          />
          <label htmlFor="b2b-code">کد اقتصادی (اختیاری)</label>
          <input
            id="b2b-code"
            dir="ltr"
            inputMode="numeric"
            value={form.economicCode}
            onChange={(event) => setForm({ ...form, economicCode: event.target.value })}
          />
          <label htmlFor="b2b-license">شماره/مرجع مجوز (اختیاری)</label>
          <input
            id="b2b-license"
            value={form.licenseRef}
            onChange={(event) => setForm({ ...form, licenseRef: event.target.value })}
          />
          <button type="submit" className="dv-btn dv-btn-block" disabled={busy} aria-busy={busy}>
            {busy ? "در حال ارسال…" : "ثبت درخواست همکاری"}
          </button>
          {error !== null ? (
            <p className="dv-cart-feedback-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}

      <section className="dv-b2b-track" aria-label="پیگیری درخواست">
        <h2>پیگیری درخواست</h2>
        <div className="dv-admin-filter">
          <input
            type="text"
            dir="ltr"
            aria-label="شناسه پیگیری"
            placeholder="app-…"
            value={trackId}
            onChange={(event) => setTrackId(event.target.value)}
          />
          <button type="button" className="dv-btn dv-btn-gold" onClick={() => void handleTrack()} disabled={busy}>
            استعلام
          </button>
        </div>
        {tracked !== null ? (
          <div role="status">
            <p>
              وضعیت درخواست <span dir="ltr">{tracked.id}</span>:{" "}
              <strong>{STATUS_LABELS[tracked.status] ?? tracked.status}</strong>
              {tracked.reviewNote ? ` — ${tracked.reviewNote}` : ""}
            </p>
            {renderDocPanel(tracked)}
          </div>
        ) : null}
      </section>
    </div>
  );
}
