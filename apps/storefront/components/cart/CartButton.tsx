"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatFaNumber } from "../../lib/format";

/**
 * Header cart entry point — a client island rendered by the server Header.
 * Shows the live item count in Persian digits (۰ when empty), '…' while a
 * cart request is in flight, and links to the real /cart page.
 */
export default function CartButton() {
  const { status, count } = useCart();
  const countLabel = status === "loading" ? "…" : formatFaNumber(count);

  return (
    <Link
      href="/cart"
      className="dv-btn dv-cart-btn"
      aria-label={`سبد خرید — ${formatFaNumber(count)} مورد`}
    >
      سبد خرید (
      {/* Live region: politely announces count changes to screen readers. */}
      <span aria-live="polite">{countLabel}</span>
      )
    </Link>
  );
}
