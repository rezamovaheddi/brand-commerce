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
 * B2B portal stays locked until then.
 */

const TRACK_HINT = "شناسه پیگیری را نزد خود نگه دارید — برای استعلام وضعیت و بارگذاری مدارک لازم است.";

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
    SUBMITTED: "ثبت‌شده و در انتظار بررسی",
    UNDER_REVIEW: "در حال بررسی توسط کارشناس بازرگانی",
    APPROVED: "تأیید شده و عضویت صادر شد ✓",
    REJECTED: "عدم احراز شرایط",
    NEEDS_INFO: "نیازمند مدارک تکمیلی",
  };

  const renderDocPanel = (application: B2BApplication): React.ReactNode => (
    <div style={{ background: "#fdfbf7", border: "1px solid var(--dv-line)", borderRadius: 12, padding: 18, marginBlock: 16 }}>
      <h4 style={{ margin: "0 0 10px", color: "var(--dv-navy)", fontSize: "0.95rem" }}>
        مدارک و پروانه‌های بارگذاری‌شده ({application.attachments.length}/3)
      </h4>
      {application.attachments.length === 0 ? (
        <p className="dv-muted" style={{ fontSize: "0.85rem", margin: "0 0 12px" }}>
          تصویر جواز کسب، روزنامه رسمی، یا پروانه مطب/داروخانه را پیوست کنید (PDF، PNG یا JPEG — حداکثر ۵۱۲ کیلوبایت).
        </p>
      ) : (
        <ul className="dv-attach-list" style={{ marginBottom: 12 }}>
          {application.attachments.map((doc) => (
            <li key={doc.id} className="dv-attach-item">
              <a
                href={applicationAttachmentDownloadUrl(application.id, doc.id)}
                className="dv-link"
                download={doc.filename}
                style={{ fontWeight: 600 }}
              >
                📄 {doc.filename}
              </a>
              <span className="dv-attach-size" style={{ fontSize: "0.8rem", color: "var(--dv-muted)" }}>
                {Math.max(1, Math.round(doc.sizeBytes / 1024))} کیلوبایت
              </span>
            </li>
          ))}
        </ul>
      )}
      {application.attachments.length < 3 ? (
        <div>
          <label style={{ display: "block", fontSize: "0.82rem", color: "var(--dv-ink-soft)", marginBottom: 4 }}>
            بارگذاری مدرک تکمیلی:
          </label>
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
        </div>
      ) : (
        <p className="dv-muted" style={{ fontSize: "0.85rem", margin: 0 }}>سقف مجاز ۳ مدرک تکمیل شده است.</p>
      )}
    </div>
  );

  return (
    <div className="dv-b2b-container">
      {/* Header Banner */}
      <div className="dv-b2b-hero">
        <h1 className="dv-b2b-header-title">پیوستن به شبکه توزیع و نمایندگی DERMAVIA</h1>
        <p className="dv-b2b-header-desc">
          همکاری تخصصی با داروخانه‌ها، کلینیک‌های پوست، گالری‌های بهداشتی لوکس و هتل‌های پنج‌ستاره.
          از شرایط ویژه قیمت‌گذاری عمده، سهمیه تخصیص منظم و مشاوره فرمولاسیون بالینی بهره‌مند شوید.
        </p>
      </div>

      {/* Advantage Cards */}
      <div className="dv-b2b-stats">
        <div className="dv-b2b-stat-card">
          <div className="dv-b2b-stat-num" style={{ fontSize: "1.2rem", color: "var(--dv-gold)" }}>حاشیه سود رقابتی</div>
          <div className="dv-b2b-stat-label">تخفیف پلکانی بر اساس حجم سفارش ماهانه و فصلی</div>
        </div>
        <div className="dv-b2b-stat-card">
          <div className="dv-b2b-stat-num" style={{ fontSize: "1.2rem", color: "var(--dv-navy)" }}>اصالت با بچ اختصاصی</div>
          <div className="dv-b2b-stat-label">ارسال همراه با سرتیفیکیت آنالیز و داسیه بهداشتی</div>
        </div>
        <div className="dv-b2b-stat-card">
          <div className="dv-b2b-stat-num" style={{ fontSize: "1.2rem", color: "#047857" }}>پکیج تستر و آموزش</div>
          <div className="dv-b2b-stat-label">ارسال استندهای لوکس فروشگاهی و نمونه‌های بالینی</div>
        </div>
      </div>

      {/* Application Form */}
      <div className="dv-b2b-card">
        <h2>فرم درخواست پذیرش نمایندگی و همکاری تجاری</h2>
        <p className="dv-muted" style={{ fontSize: "0.88rem", marginBottom: 20 }}>
          پس از تکمیل فرم، کد رهگیری اختصاصی صادر می‌شود و کارشناسان بازرگانی ظرف حداکثر ۲۴ ساعت کاری با شما تماس خواهند گرفت.
        </p>

        {created !== null ? (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: 24, textAlign: "center" }}>
            <h3 style={{ color: "#065f46", margin: "0 0 10px" }}>✓ درخواست همکاری با موفقیت ثبت شد</h3>
            <p style={{ fontSize: "1.05rem", margin: "0 0 8px" }}>
              شناسه پیگیری اختصاصی: <strong dir="ltr" style={{ color: "var(--dv-navy)" }}>{created.id}</strong>
            </p>
            <p className="dv-muted" style={{ fontSize: "0.85rem", margin: "0 0 16px" }}>{TRACK_HINT}</p>
            {renderDocPanel(created)}
            <div style={{ marginTop: 20 }}>
              <Link href="/" className="dv-btn dv-btn-gold">
                بازگشت به صفحه اصلی فروشگاه
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="dv-b2b-field-grid">
              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="b2b-contact">نام و نام خانوادگی نماینده / متقاضی</label>
                <input
                  id="b2b-contact"
                  className="dv-checkout-input"
                  placeholder="مثال: دکتر علیرضا راد"
                  value={form.contactName}
                  onChange={(event) => setForm({ ...form, contactName: event.target.value })}
                  required
                  minLength={2}
                />
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="b2b-phone">شماره تماس همراه</label>
                <input
                  id="b2b-phone"
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

            <div className="dv-b2b-field-grid">
              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="b2b-org">نام شرکت / داروخانه / مجموعه درمانی</label>
                <input
                  id="b2b-org"
                  className="dv-checkout-input"
                  placeholder="مثال: داروخانه تخصصی کیمیا یا کلینیک درماپلاس"
                  value={form.orgName}
                  onChange={(event) => setForm({ ...form, orgName: event.target.value })}
                  required
                  minLength={2}
                />
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="b2b-code">شناسه ملی یا کد اقتصادی (اختیاری)</label>
                <input
                  id="b2b-code"
                  dir="ltr"
                  inputMode="numeric"
                  className="dv-checkout-input"
                  placeholder="۱۰ یا ۱۴ رقمی"
                  value={form.economicCode}
                  onChange={(event) => setForm({ ...form, economicCode: event.target.value })}
                />
              </div>
            </div>

            <div className="dv-checkout-field">
              <label className="dv-checkout-label" htmlFor="b2b-license">شماره پروانه بهره‌برداری / نظام پزشکی / جواز کسب (اختیاری)</label>
              <input
                id="b2b-license"
                className="dv-checkout-input"
                placeholder="شماره مجوز رسمی فعالیت"
                value={form.licenseRef}
                onChange={(event) => setForm({ ...form, licenseRef: event.target.value })}
              />
            </div>

            <button type="submit" className="dv-btn dv-btn-gold" disabled={busy} aria-busy={busy} style={{ minWidth: 220, marginTop: 10 }}>
              {busy ? "در حال ثبت درخواست…" : "ارسال فرم تقاضای نمایندگی"}
            </button>

            {error !== null ? (
              <p className="dv-cart-feedback dv-cart-feedback-error" role="alert" style={{ marginTop: 12 }}>
                {error}
              </p>
            ) : null}
          </form>
        )}
      </div>

      {/* Tracking Section */}
      <div className="dv-b2b-card">
        <h3>پیگیری درخواست نمایندگی</h3>
        <p className="dv-muted" style={{ fontSize: "0.85rem", marginBottom: 14 }}>
          شناسه پیگیری دریافتی (شروع با app-...) را وارد کنید تا وضعیت پرونده و پیام‌های کارشناس بازرگانی را مشاهده فرمایید.
        </p>

        <div style={{ display: "flex", gap: 10, maxWidth: 500, marginBottom: 16 }}>
          <input
            type="text"
            dir="ltr"
            className="dv-checkout-input"
            aria-label="شناسه پیگیری"
            placeholder="app-..."
            value={trackId}
            onChange={(event) => setTrackId(event.target.value)}
          />
          <button type="button" className="dv-btn dv-btn-gold" onClick={() => void handleTrack()} disabled={busy}>
            استعلام
          </button>
        </div>

        {tracked !== null ? (
          <div style={{ background: "#fcf9f2", border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <strong>متقاضی: {tracked.orgName} ({tracked.contactName})</strong>
              <span className="dv-badge" style={{ background: "var(--dv-navy)", color: "#fff" }}>
                {STATUS_LABELS[tracked.status] ?? tracked.status}
              </span>
            </div>
            {tracked.reviewNote ? (
              <p style={{ margin: "10px 0", color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                💬 یادداشت کارشناس: <em>{tracked.reviewNote}</em>
              </p>
            ) : null}
            {renderDocPanel(tracked)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
