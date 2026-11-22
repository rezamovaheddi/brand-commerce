"use client";

import Link from "next/link";
import { useState } from "react";
import type { CartItem } from "@bc/contracts";
import PriceTag from "../../components/PriceTag";
import { useCart } from "../../components/cart/CartProvider";
import { CartApiError } from "../../lib/cart-client";
import { formatFaNumber, formatPrice } from "../../lib/format";

/** Maximum quantity the contract allows per line (AddCartItemSchema max). */
const MAX_LINE_QUANTITY = 99;

/** Honest default copy for the global cart failure card. */
const SERVICE_UNAVAILABLE_MESSAGE =
  "سرویس سبد خرید در دسترس نیست. اتصال API (پورت ۳۰۰۱) را بررسی کنید.";

/** Maps any thrown value to an honest Persian message for inline feedback. */
function describeActionError(cause: unknown): string {
  return cause instanceof CartApiError
    ? cause.message
    : "خطای غیرمنتظره در سرویس سبد خرید رخ داد.";
}

/**
 * Cart page (client): restores the persisted cart via CartProvider, lists
 * lines with a keyboard-reachable quantity stepper, computes nothing locally
 * (all totals are server-authoritative), and renders an honest disabled
 * checkout that is activated in phase P3.
 */
export default function CartPage() {
  const { cart, status, error, update, remove, refresh, clearError } = useCart();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingVariantId, setPendingVariantId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async (): Promise<void> => {
    setRetrying(true);
    try {
      clearError();
      await refresh();
    } finally {
      setRetrying(false);
    }
  };

  /** Serializes stepper/remove actions and surfaces failures inline. */
  const runAction = async (
    variantId: string,
    action: () => Promise<void>,
  ): Promise<void> => {
    if (pendingVariantId !== null) {
      return;
    }
    setPendingVariantId(variantId);
    setActionError(null);
    try {
      await action();
    } catch (cause) {
      setActionError(describeActionError(cause));
    } finally {
      setPendingVariantId(null);
    }
  };

  const changeQuantity = (item: CartItem, quantity: number): Promise<void> =>
    runAction(item.variantId, () => update(item.variantId, quantity));

  const removeLine = (item: CartItem): Promise<void> =>
    runAction(item.variantId, () => remove(item.variantId));

  return (
    <div className="container dv-page">
      <h1>سبد خرید</h1>

      <div className="dv-cart-layout">
        {status === "error" ? (
          <div className="dv-empty dv-cart-error" role="alert">
            <p>{error ?? SERVICE_UNAVAILABLE_MESSAGE}</p>
            <button
              type="button"
              className="dv-btn"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? "در حال تلاش…" : "تلاش دوباره"}
            </button>
          </div>
        ) : status === "loading" && cart === null ? (
          <div className="dv-empty">در حال بازیابی سبد خرید…</div>
        ) : cart === null || cart.items.length === 0 ? (
          <div className="dv-empty dv-cart-empty">
            <p>سبد خرید شما خالی است</p>
            <Link href="/products" className="dv-btn dv-btn-gold">
              مشاهده محصولات
            </Link>
          </div>
        ) : (
          <>
            {/* Inline feedback for failed stepper/remove actions. */}
            <p
              className="dv-cart-feedback dv-cart-feedback-error"
              role="status"
              aria-live="polite"
            >
              {actionError}
            </p>

            <ul className="dv-cart-list" aria-label="اقلام سبد خرید">
              {cart.items.map((item) => {
                const pending = pendingVariantId === item.variantId;
                return (
                  <li key={item.variantId} className="dv-cart-line">
                    <div className="dv-cart-line-info">
                      <span className="dv-cart-line-title">{item.productNameFa}</span>
                      <span className="dv-cart-line-sku" dir="ltr">
                        SKU: {item.sku}
                      </span>
                      <span className="dv-cart-line-unit dv-muted">
                        {item.titleFa} — قیمت واحد:{" "}
                        <PriceTag
                          priceMinor={item.unitPriceMinor}
                          currency={item.currency}
                        />
                      </span>
                    </div>

                    <div className="dv-cart-line-side">
                      <div
                        className="dv-qty-stepper"
                        role="group"
                        aria-label={`تعداد ${item.productNameFa}`}
                      >
                        <button
                          type="button"
                          className="dv-qty-btn"
                          onClick={() => changeQuantity(item, item.quantity - 1)}
                          disabled={pending || item.quantity <= 1}
                          aria-label={`کاهش تعداد ${item.productNameFa}`}
                        >
                          −
                        </button>
                        {/* Live region: announces quantity changes politely. */}
                        <span className="dv-qty-value" aria-live="polite">
                          {formatFaNumber(item.quantity)}
                        </span>
                        <button
                          type="button"
                          className="dv-qty-btn"
                          onClick={() => changeQuantity(item, item.quantity + 1)}
                          disabled={pending || item.quantity >= MAX_LINE_QUANTITY}
                          aria-label={`افزایش تعداد ${item.productNameFa}`}
                        >
                          +
                        </button>
                      </div>

                      <span className="dv-cart-line-total">
                        {formatPrice(item.lineTotalMinor, item.currency)}
                      </span>

                      <button
                        type="button"
                        className="dv-cart-remove"
                        onClick={() => removeLine(item)}
                        disabled={pending}
                        aria-label={`حذف ${item.productNameFa} از سبد خرید`}
                      >
                        حذف
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="dv-cart-totals">
              <div className="dv-cart-totals-row">
                <span>تعداد اقلام</span>
                <span aria-live="polite">{formatFaNumber(cart.itemCount)}</span>
              </div>
              <div className="dv-cart-totals-row dv-cart-grand">
                <span>جمع کل</span>
                <span>{formatPrice(cart.subtotalMinor, cart.currency)}</span>
              </div>
              <Link
                href="/checkout"
                className="dv-btn dv-btn-gold dv-btn-block"
                style={{ textAlign: "center", textDecoration: "none", display: "block" }}
              >
                ادامه و ثبت سفارش
              </Link>
              <p className="dv-cart-note">
                ثبت سفارش امن با نشانی پستی و شبیه‌ساز پرداخت سندباکس
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
