"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import type { Order, OrderStatus } from "@bc/contracts";
import {
  CartApiError,
  OrderNotFoundSignal,
  cancelOrder,
  getOrder,
} from "../../../lib/order-client";
import { formatFaNumber, formatPrice } from "../../../lib/format";

/**
 * Order detail page (client): fetches one order by id, renders lines, totals,
 * address and (for DRAFT orders) a cancel action. HONEST PAYMENT RULE: the
 * page states plainly that the order is recorded but unpaid — payment lands
 * in phase P3. NotFound is an honest card, never fake 404 content.
 */

/** Prominent honest copy shown on every order state. */
const PAYMENT_BANNER =
  "پرداخت در فاز P3 فعال می‌شود — این سفارش ثبت شده اما پرداخت نشده است.";

/** Persian labels for the two statuses the contract allows today. */
const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "پیش‌نویس",
  CANCELLED: "لغو شده",
};

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
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  /** Polite live announcement for cancel/state changes. */
  const [announcement, setAnnouncement] = useState("");

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
  // `order` is non-null whenever loadState === "ready".
  if (order === null) {
    return null;
  }

  const cancelled = order.status === "CANCELLED";

  return (
    <div className="container dv-page">
      <div className="dv-order-head">
        <h1>سفارش شما</h1>
        <span
          className={
            cancelled ? "dv-order-status dv-order-status-cancelled" : "dv-order-status"
          }
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>
      <p className="dv-order-code dv-muted">
        کد سفارش: <span dir="ltr">{order.id}</span>
      </p>

      {/* Polite announcements: cancel success lands here without stealing focus. */}
      <p className="dv-order-announce" role="status" aria-live="polite">
        {announcement}
      </p>

      {/* Prominent honest payment banner — shown in every order state. */}
      <div className="dv-order-banner" role="note">
        {PAYMENT_BANNER}
      </div>

      {cancelError !== null ? (
        <div className="dv-checkout-error-card" role="alert">
          {cancelError}
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
