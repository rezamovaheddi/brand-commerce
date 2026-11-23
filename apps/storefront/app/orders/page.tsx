"use client";

import { useState } from "react";
import Link from "next/link";
import SampleBadge from "../../components/SampleBadge";

export default function OrdersIndexPage() {
  const [orderId, setOrderId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = orderId.trim();
    if (clean) {
      window.location.href = `/orders/${encodeURIComponent(clean)}`;
    }
  };

  return (
    <main
      className="orders-lookup-page"
      style={{
        padding: "4rem 1.5rem",
        maxWidth: "700px",
        margin: "0 auto",
        direction: "rtl",
        textAlign: "center",
      }}
    >
      <SampleBadge />
      <h1
        style={{
          fontSize: "2rem",
          color: "var(--dv-forest-deep, #0c1a15)",
          margin: "1rem 0 0.5rem",
          fontFamily: "var(--font-vazirmatn)",
        }}
      >
        پیگیری وضعیت سفارش درماویا
      </h1>
      <p
        style={{
          color: "var(--dv-neutral-600, #55625c)",
          fontSize: "0.95rem",
          marginBottom: "2.5rem",
          lineHeight: 1.6,
        }}
      >
        شناسه سفارش صادرشده پس از پرداخت یا پیش‌نویس سبد خرید خود را وارد کنید تا جزئیات اقلام، وضعیت ارسال و فاکتور برای شما نمایش داده شود.
      </p>

      <section
        style={{
          background: "var(--dv-card-bg, #ffffff)",
          border: "1px solid var(--dv-border-light, #e3ded5)",
          borderRadius: "16px",
          padding: "2.5rem 2rem",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.05)",
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
          <label htmlFor="order-id-input" style={{ fontSize: "0.9rem", color: "var(--dv-neutral-700, #333)", fontWeight: 600 }}>
            کد رهگیری یا شناسه سفارش
          </label>
          <input
            id="order-id-input"
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="مثلاً ord_... یا شناسه CUID"
            aria-label="شناسه سفارش"
            style={{
              padding: "0.85rem 1.25rem",
              borderRadius: "10px",
              border: "1px solid var(--dv-border-light, #e3ded5)",
              fontSize: "1rem",
              direction: "ltr",
              textAlign: "center",
              width: "100%",
              maxWidth: "380px",
            }}
          />
          <button
            type="submit"
            style={{
              background: "var(--dv-forest-deep, #0c1a15)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "0.85rem 2rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
              maxWidth: "380px",
            }}
          >
            مشاهده و رهگیری سفارش
          </button>
        </form>

        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px dashed var(--dv-border-light, #e3ded5)" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--dv-neutral-600, #666)", margin: "0 0 0.75rem" }}>
            یا برای مشاهده تاریخچه کلیه سفارش‌های خود با شماره تماس وارد شوید:
          </p>
          <Link
            href="/account"
            style={{
              color: "var(--dv-gold-primary, #b8860b)",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            ورود به حساب کاربری و سوابق خرید ←
          </Link>
        </div>
      </section>
    </main>
  );
}
