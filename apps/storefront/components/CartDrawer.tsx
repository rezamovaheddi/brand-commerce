"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./cart/CartProvider";
import { formatFaNumber, formatPriceMinor } from "../lib/format";

// Business thresholds from Dermavia specification (values in IRR minor units)
const FREE_SHIPPING_THRESHOLD_IRR = 25_000_000; // 2,500,000 Toman
const FREE_GIFT_THRESHOLD_IRR = 45_000_000;     // 4,500,000 Toman

export default function CartDrawer() {
  const { cart, status, error, isDrawerOpen, closeDrawer, update, remove } = useCart();
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const totalMinor = cart?.subtotalMinor ?? 0;
  const shippingProgress = Math.min(100, Math.round((totalMinor / FREE_SHIPPING_THRESHOLD_IRR) * 100));
  const remainingForShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_IRR - totalMinor);

  const giftProgress = Math.min(100, Math.round((totalMinor / FREE_GIFT_THRESHOLD_IRR) * 100));
  const remainingForGift = Math.max(0, FREE_GIFT_THRESHOLD_IRR - totalMinor);

  // Coupon application logic
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = coupon.trim().toUpperCase();
    if (clean === "DERMAVIA10" || clean === "GOLDVIP15") {
      setAppliedCoupon(clean);
      setCouponError(null);
    } else {
      setCouponError("کد تخفیف واردشده نامعتبر است. کدهای معتبر: DERMAVIA10 یا GOLDVIP15");
    }
  };

  const discountPercent = appliedCoupon === "GOLDVIP15" ? 15 : appliedCoupon === "DERMAVIA10" ? 10 : 0;
  const discountMinor = Math.round((totalMinor * discountPercent) / 100);
  const finalTotalMinor = totalMinor - discountMinor;

  return (
    <div className="cart-drawer-backdrop" onClick={closeDrawer} role="dialog" aria-modal="true" aria-labelledby="cartDrawerTitle">
      <div className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-header-title">
            <h2 id="cartDrawerTitle">سبد خرید لوکس</h2>
            <span className="cart-drawer-count">
              {cart?.itemCount ? `${formatFaNumber(cart.itemCount)} محصول انتخابی` : "سبد خالی است"}
            </span>
          </div>
          <button
            type="button"
            className="cart-drawer-close"
            onClick={closeDrawer}
            aria-label="بستن سبد خرید"
          >
            ✕
          </button>
        </div>

        {/* Threshold Milestone Bars */}
        <div className="cart-milestones">
          {/* Free Shipping Milestone */}
          <div className="milestone-box">
            <div className="milestone-label">
              <span>ارسال رایگان اکسپرس</span>
              <span>{shippingProgress}%</span>
            </div>
            <div className="milestone-bar-bg">
              <div className="milestone-bar-fill" style={{ width: `${shippingProgress}%` }} />
            </div>
            <p className="milestone-sub">
              {remainingForShipping === 0 ? (
                <span className="milestone-done">✓ تبریک! سفارش شما مشمول ارسال رایگان اکسپرس شد.</span>
              ) : (
                <>فقط <strong className="dv-num">{formatPriceMinor(remainingForShipping)}</strong> تا ارسال رایگان</>
              )}
            </p>
          </div>

          {/* Deluxe Gift Milestone */}
          <div className="milestone-box milestone-gift">
            <div className="milestone-label">
              <span>هدیه اکسیر نمونه لوکس</span>
              <span>{giftProgress}%</span>
            </div>
            <div className="milestone-bar-bg">
              <div className="milestone-bar-fill gold-fill" style={{ width: `${giftProgress}%` }} />
            </div>
            <p className="milestone-sub">
              {remainingForGift === 0 ? (
                <span className="milestone-done gold-text">✨ هدیه اکسیر سلولی ۵۰ml به سفارش شما افزوده شد!</span>
              ) : (
                <>فقط <strong className="dv-num">{formatPriceMinor(remainingForGift)}</strong> تا دریافت هدیه</>
              )}
            </p>
          </div>
        </div>

        {/* Cart Body */}
        <div className="cart-drawer-body">
          {error && <div className="cart-drawer-error">{error}</div>}

          {!cart || cart.items.length === 0 ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon">✧</div>
              <p>هنوز محصولی به سبد خرید خود اضافه نکرده‌اید.</p>
              <Link href="/products" className="dv-btn" onClick={closeDrawer}>
                مشاهده کلکسیون محصولات
              </Link>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.items.map((item) => (
                <div key={item.variantId} className="cart-item-card">
                  <div className="cart-item-info">
                    <h4 className="cart-item-title">{item.productNameFa}</h4>
                    <span className="cart-item-variant">{item.titleFa}</span>
                    <span className="cart-item-price dv-num">{formatPriceMinor(item.unitPriceMinor)}</span>
                  </div>

                  <div className="cart-item-actions">
                    <div className="cart-stepper">
                      <button
                        type="button"
                        onClick={() => update(item.variantId, item.quantity - 1)}
                        disabled={status === "loading" || item.quantity <= 1}
                        aria-label="کاهش تعداد"
                      >
                        -
                      </button>
                      <span className="dv-num">{formatFaNumber(item.quantity)}</span>
                      <button
                        type="button"
                        onClick={() => update(item.variantId, item.quantity + 1)}
                        disabled={status === "loading" || item.quantity >= 99}
                        aria-label="افزایش تعداد"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart-item-remove"
                      onClick={() => remove(item.variantId)}
                      disabled={status === "loading"}
                      aria-label="حذف این مورد"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer / Checkout Section */}
        {cart && cart.items.length > 0 && (
          <div className="cart-drawer-footer">
            {/* Coupon input */}
            <form onSubmit={handleApplyCoupon} className="coupon-form">
              <input
                type="text"
                placeholder="کد تخفیف (مثال: DERMAVIA10)"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="coupon-input"
                dir="ltr"
              />
              <button type="submit" className="coupon-btn">اعمال</button>
            </form>
            {couponError && <p className="coupon-msg error">{couponError}</p>}
            {appliedCoupon && (
              <p className="coupon-msg success">
                ✓ کد {appliedCoupon} اعمال شد ({formatFaNumber(discountPercent)}٪ تخفیف)
              </p>
            )}

            {/* Price Breakdown */}
            <div className="cart-summary-lines">
              <div className="summary-line">
                <span>جمع کل اقلام:</span>
                <span className="dv-num">{formatPriceMinor(totalMinor)}</span>
              </div>
              {discountMinor > 0 && (
                <div className="summary-line discount">
                  <span>تخفیف باشگاه:</span>
                  <span className="dv-num">- {formatPriceMinor(discountMinor)}</span>
                </div>
              )}
              <div className="summary-line total">
                <strong>مبلغ قابل پرداخت:</strong>
                <strong className="dv-num">{formatPriceMinor(finalTotalMinor)}</strong>
              </div>
            </div>

            <div className="cart-footer-actions">
              <Link
                href="/checkout"
                className="dv-btn dv-checkout-cta"
                onClick={closeDrawer}
              >
                تکمیل سفارش و تسویه‌حساب
              </Link>
              <Link
                href="/cart"
                className="dv-cart-full-link"
                onClick={closeDrawer}
              >
                مشاهده صفحه کامل سبد خرید
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
