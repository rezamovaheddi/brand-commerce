"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import type { Order, Ticket } from "@bc/contracts";
import SampleBadge from "../../components/SampleBadge";
import { formatFaDigits, formatFaNumber, formatPrice } from "../../lib/format";

type Tab = "orders" | "tickets" | "lookup";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "پیش‌نویس", color: "var(--dv-gold-antique, #a1782e)" },
  AWAITING_PAYMENT: { label: "در انتظار پرداخت", color: "var(--dv-gold-primary, #b8860b)" },
  PAID: { label: "پرداخت‌شده", color: "#2d7a4f" },
  CANCELLED: { label: "لغو شده", color: "#8a2424" },
  REFUNDED: { label: "بازگشت وجه", color: "#6b5282" },
  SHIPPED: { label: "ارسال‌شده", color: "#1d6f8a" },
  DELIVERED: { label: "تحویل داده شده", color: "#2d7a4f" },
};

const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: "در انتظار بررسی",
  IN_PROGRESS: "در حال بررسی",
  WAITING_CUSTOMER: "در انتظار پاسخ مشتری",
  RESOLVED: "پاسخ داده شده",
  CLOSED: "بسته شده",
};

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [phone, setPhone] = useState("");
  const [inputPhone, setInputPhone] = useState("");
  const [orderLookupId, setOrderLookupId] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Load saved phone from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dermavia_customer_phone");
      if (saved) {
        setPhone(saved);
        setInputPhone(saved);
      }
    }
  }, []);

  const loadData = useCallback(async (currentPhone: string) => {
    if (!currentPhone) return;

    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const res = await fetch(`/backend/orders/by-phone/${encodeURIComponent(currentPhone)}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        setOrdersError("خطا در دریافت فهرست سفارش‌ها");
      }
    } catch {
      setOrdersError("عدم برقراری ارتباط با سرویس سفارش‌ها");
    } finally {
      setLoadingOrders(false);
    }

    setLoadingTickets(true);
    try {
      const res = await fetch(`/backend/support/tickets/by-phone/${encodeURIComponent(currentPhone)}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.items || []);
      }
    } catch {
      // non-critical
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    if (phone) {
      void loadData(phone);
    }
  }, [phone, loadData]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputPhone.trim();
    if (!clean) return;
    setPhone(clean);
    if (typeof window !== "undefined") {
      localStorage.setItem("dermavia_customer_phone", clean);
    }
    void loadData(clean);
  };

  const handleClearPhone = () => {
    setPhone("");
    setInputPhone("");
    setOrders([]);
    setTickets([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("dermavia_customer_phone");
    }
  };

  return (
    <main className="account-page" style={{ padding: "3rem 1.5rem", maxWidth: "1100px", margin: "0 auto", direction: "rtl" }}>
      {/* Header Banner */}
      <section style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <SampleBadge />
        <h1 style={{ fontSize: "2rem", color: "var(--dv-forest-deep, #0c1a15)", margin: "0.8rem 0 0.4rem", fontFamily: "var(--font-vazirmatn)" }}>
          پورتال مشتریان و پیگیری سفارشات
        </h1>
        <p style={{ color: "var(--dv-neutral-600, #55625c)", maxWidth: "600px", margin: "0 auto", fontSize: "0.95rem" }}>
          مشاهده تاریخچه سفارشات، رهگیری مرسولات، بررسی تیکت‌های پشتیبانی و اطلاعات کاربری اثیری درماویا.
        </p>
      </section>

      {/* Phone Login / Verification Bar */}
      <section
        style={{
          background: "var(--dv-card-bg, #ffffff)",
          border: "1px solid var(--dv-border-light, #e3ded5)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "2rem",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.25rem", color: "var(--dv-forest-deep, #0c1a15)" }}>
              {phone ? `ورود با شماره: ${formatFaDigits(phone)}` : "ورود سریع با شماره تلفن همراه"}
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--dv-neutral-600, #55625c)", margin: 0 }}>
              {phone
                ? "سفارش‌ها و تیکت‌های مرتبط با این شماره بارگذاری شده‌اند."
                : "برای مشاهده سوابق خرید و پیام‌های پشتیبانی، شماره خود را وارد کنید."}
            </p>
          </div>

          {phone ? (
            <button
              type="button"
              onClick={handleClearPhone}
              style={{
                background: "transparent",
                border: "1px solid var(--dv-border-light, #e3ded5)",
                borderRadius: "8px",
                padding: "0.5rem 1rem",
                color: "var(--dv-neutral-700, #444)",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              تغییر شماره / خروج
            </button>
          ) : (
            <form onSubmit={handlePhoneSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="tel"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                placeholder="مثلاً ۰۹۱۲۳۴۵۶۷۸۹"
                aria-label="شماره تلفن همراه"
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--dv-border-light, #e3ded5)",
                  fontSize: "0.95rem",
                  direction: "ltr",
                  width: "180px",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "var(--dv-forest-deep, #0c1a15)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.6rem 1.25rem",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ورود و بازیابی
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--dv-border-light, #e3ded5)", marginBottom: "2rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "orders" ? "2px solid var(--dv-gold-primary, #b8860b)" : "2px solid transparent",
            color: activeTab === "orders" ? "var(--dv-gold-primary, #b8860b)" : "var(--dv-neutral-600, #55625c)",
            fontWeight: activeTab === "orders" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          سفارش‌های من ({orders.length > 0 ? formatFaNumber(orders.length) : "۰"})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tickets")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "tickets" ? "2px solid var(--dv-gold-primary, #b8860b)" : "2px solid transparent",
            color: activeTab === "tickets" ? "var(--dv-gold-primary, #b8860b)" : "var(--dv-neutral-600, #55625c)",
            fontWeight: activeTab === "tickets" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          تیکت‌های پشتیبانی ({tickets.length > 0 ? formatFaNumber(tickets.length) : "۰"})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("lookup")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "lookup" ? "2px solid var(--dv-gold-primary, #b8860b)" : "2px solid transparent",
            color: activeTab === "lookup" ? "var(--dv-gold-primary, #b8860b)" : "var(--dv-neutral-600, #55625c)",
            fontWeight: activeTab === "lookup" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          رهگیری با شناسه سفارش
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === "orders" && (
        <section>
          {loadingOrders ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--dv-neutral-600, #666)" }}>
              در حال فراخوانی اطلاعات سفارش‌ها…
            </div>
          ) : ordersError ? (
            <div style={{ padding: "1.5rem", background: "#fdf2f2", color: "#991b1b", borderRadius: "12px", textAlign: "center" }}>
              {ordersError}
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3.5rem 1.5rem",
                background: "var(--dv-card-bg, #ffffff)",
                border: "1px dashed var(--dv-border-light, #e3ded5)",
                borderRadius: "16px",
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 1rem", color: "var(--dv-gold-antique, #a1782e)" }}>
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
                <path d="M2 3h3l2.4 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.5L22 7H6" />
              </svg>
              <h3 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem", color: "var(--dv-forest-deep, #0c1a15)" }}>
                {phone ? "سفارشی برای این شماره ثبت نشده است" : "شماره تماس خود را وارد نکرده‌اید"}
              </h3>
              <p style={{ color: "var(--dv-neutral-600, #666)", fontSize: "0.9rem", maxWidth: "450px", margin: "0 auto 1.5rem" }}>
                {phone
                  ? "می‌توانید کاتالوگ محصولات اثیری ما را مرور کرده و سفارش جدیدی ثبت کنید."
                  : "از بخش بالای صفحه شماره موبایل خود را وارد نمایید یا سفارش را با شناسه اختصاصی رهگیری کنید."}
              </p>
              <Link
                href="/products"
                style={{
                  display: "inline-block",
                  background: "var(--dv-forest-deep, #0c1a15)",
                  color: "#ffffff",
                  padding: "0.75rem 1.75rem",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                مشاهده محصولات درماویا
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {orders.map((order) => {
                const statusMeta = STATUS_LABELS[order.status] || { label: order.status, color: "#666" };
                return (
                  <article
                    key={order.id}
                    style={{
                      background: "var(--dv-card-bg, #ffffff)",
                      border: "1px solid var(--dv-border-light, #e3ded5)",
                      borderRadius: "14px",
                      padding: "1.5rem",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1.5rem",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--dv-forest-deep, #0c1a15)" }}>
                          سفارش #{order.id.slice(-8)}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "12px",
                            background: "rgba(0,0,0,0.04)",
                            color: statusMeta.color,
                            fontWeight: 600,
                          }}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 0.35rem", fontSize: "0.85rem", color: "var(--dv-neutral-600, #666)" }}>
                        تعداد اقلام: {formatFaNumber(order.itemCount)} قلم کالا | تحویل‌گیرنده: {order.address.fullName} ({order.address.city})
                      </p>
                      <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--dv-forest-deep, #0c1a15)" }}>
                        مبلغ سفارش: {formatPrice(order.subtotalMinor)}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link
                        href={`/orders/${order.id}`}
                        style={{
                          display: "inline-block",
                          background: "var(--dv-forest-deep, #0c1a15)",
                          color: "#ffffff",
                          padding: "0.6rem 1.25rem",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        رهگیری و فاکتور
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Tickets */}
      {activeTab === "tickets" && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--dv-forest-deep, #0c1a15)" }}>
              پیام‌ها و تیکت‌های پشتیبانی
            </h2>
            <Link
              href="/support"
              style={{
                display: "inline-block",
                background: "var(--dv-forest-deep, #0c1a15)",
                color: "#ffffff",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              + ثبت تیکت جدید
            </Link>
          </div>

          {loadingTickets ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--dv-neutral-600, #666)" }}>
              در حال دریافت تیکت‌های پشتیبانی…
            </div>
          ) : tickets.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1.5rem",
                background: "var(--dv-card-bg, #ffffff)",
                border: "1px dashed var(--dv-border-light, #e3ded5)",
                borderRadius: "16px",
              }}
            >
              <p style={{ color: "var(--dv-neutral-600, #666)", margin: "0 0 1rem" }}>
                هیچ پیام یا تیکت فعالی با این شماره ثبت نشده است.
              </p>
              <Link
                href="/support"
                style={{
                  display: "inline-block",
                  background: "var(--dv-forest-deep, #0c1a15)",
                  color: "#ffffff",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                تماس با واحد پشتیبانی و مشاوره
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {tickets.map((t) => (
                <article
                  key={t.id}
                  style={{
                    background: "var(--dv-card-bg, #ffffff)",
                    border: "1px solid var(--dv-border-light, #e3ded5)",
                    borderRadius: "14px",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--dv-forest-deep, #0c1a15)" }}>
                        {t.subject || "بدون عنوان"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "10px",
                          background: t.status === "CLOSED" ? "#eee" : "#e6f4ea",
                          color: t.status === "CLOSED" ? "#666" : "#137333",
                          fontWeight: 600,
                        }}
                      >
                        {TICKET_STATUS_LABELS[t.status] || t.status}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--dv-neutral-600, #666)" }}>
                      شناسه: {t.id} | پیام‌ها: {formatFaNumber(t.messages.length)}
                    </p>
                  </div>

                  <Link
                    href={`/support?ticket=${t.id}`}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--dv-border-light, #e3ded5)",
                      borderRadius: "8px",
                      padding: "0.5rem 1rem",
                      fontSize: "0.85rem",
                      textDecoration: "none",
                      color: "var(--dv-forest-deep, #0c1a15)",
                      fontWeight: 600,
                    }}
                  >
                    مشاهده گفتگو
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Quick Lookup */}
      {activeTab === "lookup" && (
        <section
          style={{
            background: "var(--dv-card-bg, #ffffff)",
            border: "1px solid var(--dv-border-light, #e3ded5)",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "600px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", color: "var(--dv-forest-deep, #0c1a15)", margin: "0 0 0.5rem" }}>
            رهگیری مستقیم مرسوله و فاکتور
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--dv-neutral-600, #666)", marginBottom: "1.5rem" }}>
            اگر کد پیگیری یا شناسه سفارش خود را در اختیار دارید، آن را وارد کنید تا مستقیم به صفحه رهگیری هدایت شوید.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const id = orderLookupId.trim();
              if (id) {
                window.location.href = `/orders/${encodeURIComponent(id)}`;
              }
            }}
            style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}
          >
            <input
              type="text"
              value={orderLookupId}
              onChange={(e) => setOrderLookupId(e.target.value)}
              placeholder="مثلاً ord_... یا شناسه پیگیری"
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--dv-border-light, #e3ded5)",
                fontSize: "0.95rem",
                direction: "ltr",
                width: "260px",
              }}
            />
            <button
              type="submit"
              style={{
                background: "var(--dv-forest-deep, #0c1a15)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              رهگیری سفارش
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
