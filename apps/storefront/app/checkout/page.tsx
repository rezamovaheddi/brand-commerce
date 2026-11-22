"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { CheckoutRequestSchema } from "@bc/contracts";
import { useCart } from "../../components/cart/CartProvider";
import { CartApiError, checkout } from "../../lib/order-client";
import { formatFaNumber, formatPrice } from "../../lib/format";

/**
 * Checkout page (client): address form validated client-side with the shared
 * CheckoutRequestSchema, then POST /backend/checkout through lib/order-client.
 * HONEST PAYMENT RULE: this step records a DRAFT order only — no payment is
 * taken anywhere in this phase (banner copy below states it plainly).
 */

/** Honest copy shown above the form — describes the checkout & sandbox payment step. */
const PAYMENT_NOTE =
  "ثبت سفارش رسمی و امن: پس از ثبت اطلاعات پستی، پیش‌فاکتور شما صادر شده و به صفحه پرداخت امن هدایت خواهید شد.";

/** Field keys of CheckoutAddressSchema we render inputs for. */
type CheckoutField =
  | "fullName"
  | "phone"
  | "province"
  | "city"
  | "postalCode"
  | "addressLine";

const CHECKOUT_FIELDS: readonly CheckoutField[] = [
  "fullName",
  "phone",
  "province",
  "city",
  "postalCode",
  "addressLine",
];

function isCheckoutField(value: unknown): value is CheckoutField {
  return (
    typeof value === "string" &&
    (CHECKOUT_FIELDS as readonly string[]).includes(value)
  );
}

/** Persian copy for fields whose zod messages default to English. */
const FIELD_FALLBACK_MESSAGES: Record<CheckoutField, string> = {
  fullName: "نام و نام خانوادگی باید بین ۲ تا ۸۰ نویسه باشد.",
  phone: "شماره موبایل معتبر نیست — باید ۱۱ رقم و با ۰۹ شروع شود.",
  province: "استان باید بین ۲ تا ۴۰ نویسه باشد.",
  city: "شهر باید بین ۲ تا ۴۰ نویسه باشد.",
  postalCode: "کد پستی باید دقیقاً ۱۰ رقم باشد.",
  addressLine: "نشانی کامل باید بین ۵ تا ۲۰۰ نویسه باشد.",
};

/** Structural shape of a zod issue — avoids importing zod into the page. */
type FieldIssue = { path: ReadonlyArray<PropertyKey>; message: string };

/**
 * Maps CheckoutRequestSchema issues to per-field Persian errors. Phone and
 * postal codes already carry precise Persian messages in the contract schemas;
 * other fields fall back to our own copy.
 */
function collectFieldErrors(
  issues: readonly FieldIssue[],
): Partial<Record<CheckoutField, string>> {
  const errors: Partial<Record<CheckoutField, string>> = {};
  for (const issue of issues) {
    // Issues live at ["address", fieldName]; anything else (e.g. cartId) is
    // not a form-field problem and is handled by the generic submit error.
    if (issue.path.length === 2 && issue.path[0] === "address") {
      const field = issue.path[1];
      if (isCheckoutField(field) && errors[field] === undefined) {
        const isPersian = /[\u0600-\u06FF]/.test(issue.message);
        errors[field] = isPersian ? issue.message : FIELD_FALLBACK_MESSAGES[field];
      }
    }
  }
  return errors;
}

type CheckoutFormState = Record<CheckoutField, string>;

const EMPTY_FORM: CheckoutFormState = {
  fullName: "",
  phone: "",
  province: "",
  city: "",
  postalCode: "",
  addressLine: "",
};

/** Static per-field presentation config (labels, input hints). */
const FIELD_LABELS: Record<CheckoutField, string> = {
  fullName: "نام و نام خانوادگی",
  phone: "شماره موبایل",
  province: "استان",
  city: "شهر",
  postalCode: "کد پستی",
  addressLine: "نشانی کامل",
};

const SERVICE_UNAVAILABLE_MESSAGE =
  "سرویس سبد خرید در دسترس نیست. اتصال API (پورت ۳۰۰۱) را بررسی کنید.";

export default function CheckoutPage() {
  const { cart, status, error, refresh } = useCart();
  const router = useRouter();

  const [form, setForm] = useState<CheckoutFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CheckoutField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleFieldChange =
    (field: CheckoutField) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      const { value } = event.target;
      setForm((previous) => ({ ...previous, [field]: value }));
      // Clear this field's error as soon as the user edits it again.
      setFieldErrors((previous) => {
        if (previous[field] === undefined) {
          return previous;
        }
        const next = { ...previous };
        delete next[field];
        return next;
      });
    };

  const handleRetry = async (): Promise<void> => {
    setRetrying(true);
    try {
      await refresh();
    } finally {
      setRetrying(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (submitting || cart === null) {
      return;
    }

    setSubmitError(null);

    // Client-side validation reuses the shared contract directly, so the
    // browser and API enforce the exact same rules (incl. Persian-digit
    // normalization for phone/postal code).
    const parsed = CheckoutRequestSchema.safeParse({
      cartId: cart.id,
      address: { ...form },
    });

    if (!parsed.success) {
      const errors = collectFieldErrors(parsed.error.issues);
      setFieldErrors(errors);
      if (Object.keys(errors).length === 0) {
        // Only cartId failed (should not happen) — surface it honestly.
        setSubmitError("درخواست ثبت سفارش معتبر نیست. سبد را بازبینی کنید.");
      }
      return;
    }

    setSubmitting(true);
    try {
      const order = await checkout(parsed.data);
      // The server has converted the cart; refresh so provider/header counts
      // reflect the empty cart, then navigate to the order page.
      await refresh();
      router.push(`/orders/${encodeURIComponent(order.id)}`);
    } catch (cause) {
      // Keep every form value; show the server's Persian message (or the
      // transport-layer copy) inline above the form.
      setSubmitError(
        cause instanceof CartApiError
          ? cause.message
          : "خطای غیرمنتظره در ثبت سفارش رخ داد.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---- global cart states -------------------------------------------------
  if (status === "error") {
    return (
      <div className="container dv-page">
        <h1>تسویه حساب</h1>
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
      </div>
    );
  }

  if (status === "loading" && cart === null) {
    return (
      <div className="container dv-page">
        <h1>تسویه حساب</h1>
        <div className="dv-empty">در حال بازیابی سبد خرید…</div>
      </div>
    );
  }

  if (cart === null || cart.items.length === 0 || cart.lineCount === 0) {
    return (
      <div className="container dv-page">
        <h1>تسویه حساب</h1>
        <div className="dv-empty dv-cart-empty">
          <p>سبد خرید خالی است</p>
          <Link href="/products" className="dv-btn dv-btn-gold">
            مشاهده محصولات
          </Link>
        </div>
      </div>
    );
  }

  // ---- checkout form ------------------------------------------------------
  const currency = cart.currency;

  return (
    <div className="container dv-page">
      <h1>تسویه حساب</h1>

      <div className="dv-checkout-layout">
        <section className="dv-checkout-form" aria-label="اطلاعات ارسال">
          {/* Honest payment note — always visible above the form. */}
          <div className="dv-checkout-banner" role="note">
            {PAYMENT_NOTE}
          </div>

          {/* Inline submit failure: server Persian message or transport copy. */}
          {submitError !== null ? (
            <div className="dv-checkout-error-card" role="alert">
              {submitError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate>
            <div className="dv-checkout-field">
              <label className="dv-checkout-label" htmlFor="checkout-fullName">
                {FIELD_LABELS.fullName}
              </label>
              <input
                id="checkout-fullName"
                name="fullName"
                type="text"
                className="dv-checkout-input"
                value={form.fullName}
                onChange={handleFieldChange("fullName")}
                autoComplete="name"
                maxLength={80}
                aria-invalid={fieldErrors.fullName !== undefined}
                aria-describedby={
                  fieldErrors.fullName !== undefined ? "checkout-fullName-error" : undefined
                }
              />
              {fieldErrors.fullName !== undefined ? (
                <p id="checkout-fullName-error" className="dv-checkout-error" role="alert">
                  {fieldErrors.fullName}
                </p>
              ) : null}
            </div>

            <div className="dv-checkout-field">
              <label className="dv-checkout-label" htmlFor="checkout-phone">
                {FIELD_LABELS.phone}
              </label>
              <input
                id="checkout-phone"
                name="phone"
                type="tel"
                dir="ltr"
                inputMode="numeric"
                className="dv-checkout-input"
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                value={form.phone}
                onChange={handleFieldChange("phone")}
                autoComplete="tel"
                maxLength={11}
                aria-invalid={fieldErrors.phone !== undefined}
                aria-describedby={
                  fieldErrors.phone !== undefined ? "checkout-phone-error" : undefined
                }
              />
              {fieldErrors.phone !== undefined ? (
                <p id="checkout-phone-error" className="dv-checkout-error" role="alert">
                  {fieldErrors.phone}
                </p>
              ) : null}
            </div>

            <div className="dv-checkout-field-row">
              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="checkout-province">
                  {FIELD_LABELS.province}
                </label>
                <input
                  id="checkout-province"
                  name="province"
                  type="text"
                  className="dv-checkout-input"
                  value={form.province}
                  onChange={handleFieldChange("province")}
                  maxLength={40}
                  aria-invalid={fieldErrors.province !== undefined}
                  aria-describedby={
                    fieldErrors.province !== undefined ? "checkout-province-error" : undefined
                  }
                />
                {fieldErrors.province !== undefined ? (
                  <p id="checkout-province-error" className="dv-checkout-error" role="alert">
                    {fieldErrors.province}
                  </p>
                ) : null}
              </div>

              <div className="dv-checkout-field">
                <label className="dv-checkout-label" htmlFor="checkout-city">
                  {FIELD_LABELS.city}
                </label>
                <input
                  id="checkout-city"
                  name="city"
                  type="text"
                  className="dv-checkout-input"
                  value={form.city}
                  onChange={handleFieldChange("city")}
                  maxLength={40}
                  aria-invalid={fieldErrors.city !== undefined}
                  aria-describedby={
                    fieldErrors.city !== undefined ? "checkout-city-error" : undefined
                  }
                />
                {fieldErrors.city !== undefined ? (
                  <p id="checkout-city-error" className="dv-checkout-error" role="alert">
                    {fieldErrors.city}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="dv-checkout-field">
              <label className="dv-checkout-label" htmlFor="checkout-postalCode">
                {FIELD_LABELS.postalCode}
              </label>
              <input
                id="checkout-postalCode"
                name="postalCode"
                type="text"
                dir="ltr"
                inputMode="numeric"
                className="dv-checkout-input"
                placeholder="۱۰ رقم"
                value={form.postalCode}
                onChange={handleFieldChange("postalCode")}
                autoComplete="postal-code"
                maxLength={10}
                aria-invalid={fieldErrors.postalCode !== undefined}
                aria-describedby={
                  fieldErrors.postalCode !== undefined
                    ? "checkout-postalCode-error"
                    : undefined
                }
              />
              {fieldErrors.postalCode !== undefined ? (
                <p id="checkout-postalCode-error" className="dv-checkout-error" role="alert">
                  {fieldErrors.postalCode}
                </p>
              ) : null}
            </div>

            <div className="dv-checkout-field">
              <label className="dv-checkout-label" htmlFor="checkout-addressLine">
                {FIELD_LABELS.addressLine}
              </label>
              <textarea
                id="checkout-addressLine"
                name="addressLine"
                className="dv-checkout-input dv-checkout-textarea"
                value={form.addressLine}
                onChange={handleFieldChange("addressLine")}
                maxLength={200}
                rows={3}
                aria-invalid={fieldErrors.addressLine !== undefined}
                aria-describedby={
                  fieldErrors.addressLine !== undefined
                    ? "checkout-addressLine-error"
                    : undefined
                }
              />
              {fieldErrors.addressLine !== undefined ? (
                <p id="checkout-addressLine-error" className="dv-checkout-error" role="alert">
                  {fieldErrors.addressLine}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className="dv-btn dv-btn-block dv-checkout-submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "در حال ثبت سفارش…" : "ثبت سفارش"}
            </button>
          </form>
        </section>

        {/* Order summary — server data only, nothing computed locally. */}
        <aside className="dv-checkout-summary" aria-label="خلاصه سفارش">
          <h2>خلاصه سفارش</h2>
          <ul className="dv-checkout-summary-lines">
            {cart.items.map((item) => (
              <li key={item.variantId} className="dv-checkout-summary-line">
                <span className="dv-checkout-summary-name">
                  {item.productNameFa}
                  <span className="dv-checkout-summary-qty dv-muted">
                    × {formatFaNumber(item.quantity)}
                  </span>
                </span>
                <span className="dv-checkout-summary-total">
                  {formatPrice(item.lineTotalMinor, item.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="dv-checkout-summary-footer">
            <div className="dv-cart-totals-row">
              <span>تعداد اقلام</span>
              <span>{formatFaNumber(cart.itemCount)}</span>
            </div>
            <div className="dv-cart-totals-row dv-cart-grand">
              <span>جمع کل</span>
              <span>{formatPrice(cart.subtotalMinor, currency)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
