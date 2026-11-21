"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useCart } from "./CartProvider";
import { CartApiError } from "../../lib/cart-client";
import { formatPrice } from "../../lib/format";

/** Shape the PDP passes down: only ACTIVE variants, presentation fields only. */
export type VariantOption = {
  id: string;
  titleFa: string;
  priceMinor: number;
  currency: string;
  isDefault: boolean;
  /** P5-lite: server-computed onHand - reserved. 0 ⇒ ناموجود. */
  availableToSell: number;
};

type VariantAddToCartProps = {
  variants: VariantOption[];
};

type AddFeedback =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/** How long the inline success message stays visible. */
const SUCCESS_RESET_MS = 2600;

/**
 * PDP variant selector + add-to-cart island. Renders a keyboard-navigable
 * radio group (native radios, arrow keys move between options) and wires the
 * add-to-cart button to the SELECTED variant. Feedback (busy/success/error)
 * mirrors AddToCartButton exactly.
 */
export default function VariantAddToCart({ variants }: VariantAddToCartProps) {
  const { add } = useCart();
  const [feedback, setFeedback] = useState<AddFeedback>({ kind: "idle" });
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preselect the default variant (fallback: the first listed option).
  const [selectedId, setSelectedId] = useState<string>(
    () => variants.find((variant) => variant.isDefault)?.id ?? variants[0]?.id ?? "",
  );

  // Clear any pending success-message timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const clearFeedbackTimer = (): void => {
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  const handleSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    setSelectedId(event.target.value);
    // A stale "به سبد اضافه شد" would refer to the previous variant — reset it.
    clearFeedbackTimer();
    setFeedback({ kind: "idle" });
  };

  const selectedVariant = variants.find((variant) => variant.id === selectedId) ?? null;
  const selectedAvailable = (selectedVariant?.availableToSell ?? 0) > 0;

  const handleClick = async (): Promise<void> => {
    if (feedback.kind === "busy" || selectedVariant === null) {
      return;
    }
    clearFeedbackTimer();
    setFeedback({ kind: "busy" });
    try {
      await add(selectedVariant.id, 1);
      setFeedback({ kind: "success" });
      resetTimerRef.current = setTimeout(() => {
        setFeedback({ kind: "idle" });
      }, SUCCESS_RESET_MS);
    } catch (cause) {
      // CartApiError carries an honest Persian message (server copy for HTTP
      // failures, service-unavailable copy for network failures).
      setFeedback({
        kind: "error",
        message:
          cause instanceof CartApiError
            ? cause.message
            : "خطای غیرمنتظره در افزودن به سبد خرید.",
      });
    }
  };

  const busy = feedback.kind === "busy";

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="dv-add-to-cart">
      <div className="dv-variant-picker" role="radiogroup" aria-label="انتخاب نسخه محصول">
        {variants.map((variant) => {
          const selected = variant.id === selectedId;
          return (
            <label
              key={variant.id}
              className={
                selected
                  ? "dv-variant-picker-option dv-variant-picker-option-selected"
                  : "dv-variant-picker-option"
              }
            >
              {/* Native radio keeps arrow-key navigation and screen-reader
                  semantics; the visible target is the styled label itself. */}
              <input
                type="radio"
                name="dv-variant-picker"
                value={variant.id}
                checked={selected}
                onChange={handleSelect}
                className="dv-variant-picker-input"
                aria-label={`${variant.titleFa} — ${formatPrice(variant.priceMinor, variant.currency)}`}
              />
              <span className="dv-variant-picker-title">{variant.titleFa}</span>
              {variant.availableToSell === 0 ? (
                <span className="dv-badge dv-badge-oos">ناموجود</span>
              ) : null}
              {variant.isDefault ? (
                <span className="dv-default-tag">پیش‌فرض</span>
              ) : null}
              <span className="dv-variant-picker-price">
                {formatPrice(variant.priceMinor, variant.currency)}
              </span>
            </label>
          );
        })}
      </div>

      <button
        type="button"
        className="dv-btn dv-btn-block"
        onClick={handleClick}
        disabled={busy || selectedVariant === null || !selectedAvailable}
        aria-busy={busy}
        aria-label={
          selectedVariant !== null
            ? `افزودن ${selectedVariant.titleFa} به سبد خرید`
            : "افزودن به سبد خرید"
        }
      >
        {busy ? "در حال افزودن…" : "افزودن به سبد خرید"}
      </button>
      {/* Live region: announces success/error feedback without stealing focus. */}
      {!selectedAvailable ? (
        <p className="dv-cart-feedback" role="status">
          این نسخه در حال حاضر موجود نیست.
        </p>
      ) : null}
      <p className="dv-cart-feedback" role="status" aria-live="polite">
        {feedback.kind === "success" ? "به سبد اضافه شد ✓" : null}
        {feedback.kind === "error" ? (
          <span className="dv-cart-feedback-error">{feedback.message}</span>
        ) : null}
      </p>
    </div>
  );
}
