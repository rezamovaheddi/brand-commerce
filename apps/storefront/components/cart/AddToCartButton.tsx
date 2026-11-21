"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { CartApiError } from "../../lib/cart-client";

type AddToCartButtonProps = {
  /** Id of the DEFAULT variant, resolved server-side on the PDP. */
  variantId: string;
  /** Persian title used in the accessible label of the button. */
  titleFa: string;
};

type AddFeedback =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/** How long the inline success message stays visible. */
const SUCCESS_RESET_MS = 2600;

/**
 * PDP add-to-cart island. Wired to the cart provider (which creates the cart
 * on first use); shows optimistic busy text, a brief inline success message,
 * or an honest error message (server Persian copy or service-unavailable).
 */
export default function AddToCartButton({ variantId, titleFa }: AddToCartButtonProps) {
  const { add } = useCart();
  const [feedback, setFeedback] = useState<AddFeedback>({ kind: "idle" });
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending success-message timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleClick = async (): Promise<void> => {
    if (feedback.kind === "busy") {
      return;
    }
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setFeedback({ kind: "busy" });
    try {
      await add(variantId, 1);
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

  return (
    <div className="dv-add-to-cart">
      <button
        type="button"
        className="dv-btn dv-btn-block"
        onClick={handleClick}
        disabled={busy}
        aria-busy={busy}
        aria-label={`افزودن ${titleFa} به سبد خرید`}
      >
        {busy ? "در حال افزودن…" : "افزودن به سبد خرید"}
      </button>
      {/* Live region: announces success/error feedback without stealing focus. */}
      <p className="dv-cart-feedback" role="status" aria-live="polite">
        {feedback.kind === "success" ? "به سبد اضافه شد ✓" : null}
        {feedback.kind === "error" ? (
          <span className="dv-cart-feedback-error">{feedback.message}</span>
        ) : null}
      </p>
    </div>
  );
}
