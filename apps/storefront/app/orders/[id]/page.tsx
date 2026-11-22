"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import type { Order, Payment } from "@bc/contracts";
import {
  CartApiError,
  OrderNotFoundSignal,
  cancelOrder,
  getOrder,
} from "../../../lib/order-client";
import {
  payOrder,
  refundPayment,
  sandboxConfirm,
  type PayOrderResult,
} from "../../../lib/payment-client";
import { formatFaNumber, formatPrice } from "../../../lib/format";

/**
 * Order detail page (client): fetches one order by id, renders lines, totals,
 * address, and the SANDBOX payment flow (pay → gateway simulator → refund).
 * HONEST PAYMENT RULE: every payment element is labeled SANDBOX — the platform
 * never moves real money and never presents a simulated payment as real.
 * NotFound is an honest card, never fake 404 content.
 */

/** Persian labels for known statuses; unknown statuses render raw (defensive:
 * the API may ship a new state before the schema/UI catches up). */
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  AWAITING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  CANCELLED: "لغو شده",
  REFUNDED: "بازگشت وجه",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

type LoadState = "loading" | "ready" | "notfound" | "error";

const SERVICE_UNAVAILABLE_MESSAGE =
  "سرویس سفارش‌ها در دسترس نیست. اتصال API (پورت ۳۰۰۱) را بررسی کنید.";

type OrderPageProps = {
  /** Next 15 App Router: params is a Promise (resolved with React.use). */
  params: Promise<{ id: string }>;
};

export default function OrderPage({ params }: OrderPageProps) {
  const { id } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  /** Last known sandbox payment (kept from UI actions; may be null after reload). */
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"pay" | "confirm" | "refund" | null>(null);
  /** Polite live announcement for cancel/state changes. */
  const [announcement, setAnnouncement] = useState("");
  /** Idempotency key is created once per order visit and reused for retries. */
  const idempotencyKeyRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `idem-${Date.now()}`,
  );

  const load = useCallback(async (): Promise<void> => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const fetched = await getOrder(id);
      setOrder(fetched);
      setLoadState("ready");
    } catch (cause) {
      if (cause instanceof OrderNotFoundSignal) {
        setLoadState("notfound");
        return;
      }
      setLoadError(
        cause instanceof CartApiError
          ? cause.message
          : "خطای غیرمنتظره در دریافت سفارش رخ داد.",
      );
      setLoadState("error");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Confirms, then cancels the DRAFT order and re-renders with the result. */
  const handleCancel = async (): Promise<void> => {
    if (cancelling) {
      return;
    }
    if (!window.confirm("آیا از لغو این سفارش مطمئن هستید؟")) {
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await cancelOrder(id);
      setOrder(updated);
      setAnnouncement("سفارش لغو شد.");
    } catch (cause) {
      setCancelError(
        cause instanceof CartApiError
          ? cause.message
          : "خطای غیرمنتظره در لغو سفارش رخ داد.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const refreshOrder = useCallback(async (): Promise<void> => {
    try {
      setOrder(await getOrder(id));
    } catch {
      /* keep current state — the next manual refresh covers transient errors */
    }
  }, [id]);

  const applyPayResult = (result: PayOrderResult): void => {
    setPayment(result.payment);
    setOrder((prev) =>
      prev
        ? {
            ...prev,
            // The widened contract enum covers every status the API emits now.
            status: result.order.status as Order["status"],
          }
        : prev,
    );
  };

  const handlePay = async (): Promise<void> => {
    if (busy !== null || order === null) {
      return;
    }
    setBusy("pay");
    setActionError(null);
    try {
      applyPayResult(await payOrder(order.id, idempotencyKeyRef.current));
      setAnnouncement("پرداخت آزمایشی آغاز شد — سفارش در انتظار پرداخت است.");
    } catch (cause) {
      setActionError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در آغاز پرداخت.");
    } finally {
      setBusy(null);
    }
  };

  const handleConfirm = async (result: "succeeded" | "failed"): Promise<void> => {
    if (busy !== null || payment === null) {
      return;
    }
    setBusy("confirm");
    setActionError(null);
    try {
      const updated = await sandboxConfirm(payment.id, result);
      setPayment(updated);
      await refreshOrder();
      setAnnouncement(
        updated.status === "SUCCEEDED"
          ? "پرداخت آزمایشی موفق بود."
          : "پرداخت آزمایشی ناموفق بود.",
      );
    } catch (cause) {
      setActionError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در درگاه آزمایشی.");
    } finally {
      setBusy(null);
    }
  };

  const handleRefund = async (): Promise<void> => {
    if (busy !== null || payment === null) {
      return;
    }
    setBusy("refund");
    setActionError(null);
    try {
      applyPayResult(await refundPayment(payment.id));
      setAnnouncement("بازگشت وجه آزمایشی انجام شد.");
    } catch (cause) {
      setActionError(cause instanceof CartApiError ? cause.message : "خطای غیرمنتظره در بازگشت وجه.");
    } finally {
      setBusy(null);
    }
  };

  // ---- load states --------------------------------------------------------
  if (loadState === "loading") {
    return (
      <div className="container dv-page">
        <h1>سفارش شما</h1>
        <div className="dv-empty">در حال دریافت سفارش…</div>
      </div>
    );
  }

  if (loadState === "notfound") {
    return (
      <div className="container dv-page">
        <h1>سفارش شما</h1>
        <div className="dv-empty dv-cart-empty" role="alert">
          <p>سفارش یافت نشد</p>
          <p className="dv-muted">
            ممکن است کد سفارش اشتباه باشد یا سفارش از سمت فروشگاه حذف شده باشد.
          </p>
          <Link href="/products" className="dv-btn dv-btn-gold">
            مشاهده محصولات
          </Link>
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="container dv-page">
        <h1>سفارش شما</h1>
        <div className="dv-empty dv-cart-error" role="alert">
          <p>{loadError ?? SERVICE_UNAVAILABLE_MESSAGE}</p>
          <button type="button" className="dv-btn" onClick={() => void load()}>
            تلاش دوباره
          </button>
        </div>
      </div>
    );
  }

  // ---- ready --------------------------------------------------------------
  if (order === null) {
    return null;
  }

  const status = order.status;
  const statusTone =
    status === "CANCELLED" || status === "REFUNDED"
      ? "dv-order-status-cancelled"
      : status === "PAID"
        ? "dv-order-status-paid"
        : "dv-order-status";

  return (
    <div className="container dv-page">
      <div className="dv-order-head">
        <h1>سفارش شما</h1>
        <span className={`dv-order-status ${statusTone}`}>
          {statusLabel(status)}
          {status === "PAID" || status === "AWAITING_PAYMENT" || status === "REFUNDED" ? (
            <span className="dv-sandbox-chip">SANDBOX</span>
          ) : null}
        </span>
      </div>
      <p className="dv-order-code dv-muted">
        کد سفارش: <span dir="ltr">{order.id}</span>
      </p>

      {/* Visual Order Progress Stepper */}
      {status !== "CANCELLED" && status !== "REFUNDED" ? (
        <div className="dv-order-stepper" aria-label="مراحل وضعیت سفارش">
          <div className="dv-step is-done">
            <span className="dv-step-circle">✓</span>
            <span className="dv-step-label">ثبت سفارش</span>
          </div>
          <div className={`dv-step ${status === "PAID" || status === "SHIPPED" || status === "DELIVERED" ? "is-done" : status === "AWAITING_PAYMENT" ? "is-active" : ""}`}>
            <span className="dv-step-circle">{status === "PAID" || status === "SHIPPED" || status === "DELIVERED" ? "✓" : "۲"}</span>
            <span className="dv-step-label">پرداخت بانکی</span>
          </div>
          <div className={`dv-step ${status === "PAID" ? "is-active" : status === "SHIPPED" || status === "DELIVERED" ? "is-done" : ""}`}>
            <span className="dv-step-circle">{status === "SHIPPED" || status === "DELIVERED" ? "✓" : "۳"}</span>
            <span className="dv-step-label">آماده‌سازی انبار</span>
          </div>
          <div className={`dv-step ${status === "SHIPPED" ? "is-active" : status === "DELIVERED" ? "is-done" : ""}`}>
            <span className="dv-step-circle">{status === "DELIVERED" ? "✓" : "۴"}</span>
            <span className="dv-step-label">ارسال پستی</span>
          </div>
          <div className={`dv-step ${status === "DELIVERED" ? "is-done" : ""}`}>
            <span className="dv-step-circle">۵</span>
            <span className="dv-step-label">تحویل نهایی</span>
          </div>
        </div>
      ) : null}

      {/* Polite announcements: state changes land here without stealing focus. */}
      <p className="dv-order-announce" role="status" aria-live="polite">
        {announcement}
      </p>

      {/* Honest sandbox banner — only while nothing has been paid yet. */}
      {status === "DRAFT" || status === "AWAITING_PAYMENT" ? (
        <div className="dv-order-banner" role="note">
          این پلتفرم از درگاه پرداخت واقعی استفاده نمی‌کند — همه پرداخت‌ها SANDBOX
          هستند و پول واقعی جابجا نمی‌شود.
        </div>
      ) : null}

      {cancelError !== null ? (
        <div className="dv-checkout-error-card" role="alert">
          {cancelError}
        </div>
      ) : null}
      {actionError !== null ? (
        <div className="dv-checkout-error-card" role="alert">
          {actionError}
        </div>
      ) : null}

      <div className="dv-order-layout">
        <section className="dv-order-lines" aria-label="اقلام سفارش">
          <h2>اقلام سفارش</h2>
          <ul className="dv-order-line-list">
            {order.lines.map((line) => (
              <li key={line.variantId} className="dv-order-line">
                <div className="dv-order-line-info">
                  <span className="dv-order-line-name">{line.productNameFa}</span>
                  <span className="dv-order-line-title dv-muted">{line.titleFa}</span>
                  <span className="dv-order-line-sku" dir="ltr">
                    SKU: {line.sku}
                  </span>
                  <span className="dv-order-line-qty dv-muted">
                    تعداد: {formatFaNumber(line.quantity)}
                  </span>
                </div>
                <span className="dv-order-line-total">
                  {formatPrice(line.lineTotalMinor, line.currency)}
                </span>
              </li>
            ))}
          </ul>

          <div className="dv-order-totals">
            <div className="dv-cart-totals-row">
              <span>تعداد اقلام</span>
              <span>{formatFaNumber(order.itemCount)}</span>
            </div>
            <div className="dv-cart-totals-row dv-cart-grand">
              <span>جمع کل</span>
              <span>{formatPrice(order.subtotalMinor, order.currency)}</span>
            </div>
          </div>

          {/* ---- SANDBOX payment section --------------------------------- */}
          <section className="dv-pay-section" aria-label="پرداخت آزمایشی">
            <h3 className="dv-pay-title">
              پرداخت
              <span className="dv-sandbox-chip">SANDBOX</span>
            </h3>

            {status === "DRAFT" ? (
              <div className="dv-pay-actions">
                <button
                  type="button"
                  className="dv-btn dv-pay-start"
                  onClick={() => void handlePay()}
                  disabled={busy !== null}
                  aria-busy={busy === "pay"}
                >
                  {busy === "pay" ? "در حال آغاز…" : "پرداخت سفارش (آزمایشی)"}
                </button>
                <p className="dv-pay-note dv-muted">
                  با این کار سفارش به «در انتظار پرداخت» می‌رود و یک پرداخت آزمایشی
                  ساخته می‌شود.
                </p>
              </div>
            ) : null}

            {status === "AWAITING_PAYMENT" ? (
              <div className="dv-sandbox-panel">
                <h4 className="dv-sandbox-title">شبیه‌ساز درگاه پرداخت — SANDBOX</h4>
                {payment === null ? (
                  <p className="dv-muted">
                    برای شبیه‌سازی، ابتدا از دکمه «پرداخت سفارش» پرداخت را آغاز کنید
                    (یا صفحه را پس از پرداخت تازه‌سازی کنید).
                  </p>
                ) : (
                  <div className="dv-pay-actions">
                    <button
                      type="button"
                      className="dv-btn dv-pay-success"
                      onClick={() => void handleConfirm("succeeded")}
                      disabled={busy !== null}
                      aria-busy={busy === "confirm"}
                    >
                      تأیید پرداخت آزمایشی
                    </button>
                    <button
                      type="button"
                      className="dv-order-cancel dv-pay-fail"
                      onClick={() => void handleConfirm("failed")}
                      disabled={busy !== null}
                      aria-busy={busy === "confirm"}
                    >
                      شبیه‌سازی شکست پرداخت
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {status === "PAID" ? (
              <div className="dv-pay-actions">
                <p className="dv-pay-note">
                  پرداخت آزمایشی موفق
                  {payment !== null ? ` — مبلغ: ${formatPrice(payment.amountMinor, payment.currency)}` : ""}
                  . (برای مشاهده جزئیات پرداخت پس از تازه‌سازی صفحه، سابقه از سمت
                  API قابل دریافت است.)
                </p>
                {payment !== null ? (
                  <button
                    type="button"
                    className="dv-order-cancel dv-pay-fail dv-btn-outline-danger"
                    onClick={() => void handleRefund()}
                    disabled={busy !== null}
                    aria-busy={busy === "refund"}
                  >
                    {busy === "refund" ? "در حال بازگشت…" : "درخواست بازگشت وجه (SANDBOX)"}
                  </button>
                ) : null}
              </div>
            ) : null}

            {status === "REFUNDED" ? (
              <p className="dv-pay-note dv-muted">
                وجه این سفارش به‌صورت آزمایشی بازگشت داده شد (SANDBOX).
              </p>
            ) : null}
          </section>
        </section>

        <aside className="dv-order-address" aria-label="نشانی ارسال">
          <h2>نشانی ارسال</h2>
          <dl className="dv-order-address-list">
            <div className="dv-order-address-row">
              <dt>نام گیرنده</dt>
              <dd>{order.address.fullName}</dd>
            </div>
            <div className="dv-order-address-row">
              <dt>شماره موبایل</dt>
              <dd dir="ltr">{order.address.phone}</dd>
            </div>
            <div className="dv-order-address-row">
              <dt>استان / شهر</dt>
              <dd>
                {order.address.province} / {order.address.city}
              </dd>
            </div>
            <div className="dv-order-address-row">
              <dt>کد پستی</dt>
              <dd dir="ltr">{order.address.postalCode}</dd>
            </div>
            <div className="dv-order-address-row">
              <dt>نشانی</dt>
              <dd>{order.address.addressLine}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="dv-order-actions">
        {order.status === "DRAFT" ? (
          <button
            type="button"
            className="dv-order-cancel"
            onClick={() => void handleCancel()}
            disabled={cancelling}
            aria-busy={cancelling}
          >
            {cancelling ? "در حال لغو…" : "لغو سفارش"}
          </button>
        ) : null}
        <Link href="/products" className="dv-order-back">
          بازگشت به فروشگاه
        </Link>
      </div>
    </div>
  );
}
