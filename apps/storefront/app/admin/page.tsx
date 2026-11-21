"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminApiError,
  adminAdjustStock,
  adminListB2BApplications,
  adminListInventory,
  adminListLedger,
  adminListOrders,
  adminB2BDecision,
  clearAdminKey,
  getAdminKey,
  setAdminKey,
  type AdminInventory,
  type AdminOrderList,
  type B2BApplicationRow,
  type LedgerRow,
} from "../../lib/admin-client";
import { formatFaNumber, formatPrice } from "../../lib/format";

/**
 * BOOTSTRAP operator console (backoffice-lite). Auth = shared admin key in
 * sessionStorage behind the API's AdminKeyGuard — real RBAC arrives in P4.
 * Everything here is operator tooling; the storefront surface is unaffected.
 */

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  AWAITING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELLED: "لغو شده",
  REFUNDED: "بازگشت وجه",
};

type Section = "orders" | "inventory" | "b2b";

export default function AdminPage() {
  const [key, setKey] = useState<string>("");
  const [authed, setAuthed] = useState<boolean>(false);
  const [section, setSection] = useState<Section>("orders");
  const [orders, setOrders] = useState<AdminOrderList | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [inventory, setInventory] = useState<AdminInventory[] | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[] | null>(null);
  const [b2bApps, setB2bApps] = useState<B2BApplicationRow[] | null>(null);
  const [b2bNote, setB2bNote] = useState<{ id: string; note: string; action: "approve" | "reject" | "request-info" } | null>(null);
  const [adjust, setAdjust] = useState<{ variantId: string; delta: string; note: string }>({
    variantId: "",
    delta: "",
    note: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadSection = useCallback(
    async (which: Section, orderPage: number, filter: string): Promise<void> => {
      setBusy(true);
      setError(null);
      try {
        if (which === "orders") {
          setOrders(await adminListOrders(orderPage, filter || undefined));
        } else if (which === "b2b") {
          setB2bApps(await adminListB2BApplications());
        } else {
          const [inv, led] = await Promise.all([adminListInventory(), adminListLedger()]);
          setInventory(inv);
          setLedger(led);
        }
      } catch (cause) {
        const message = cause instanceof AdminApiError ? cause.message : "خطای غیرمنتظره.";
        if (cause instanceof AdminApiError && (cause.status === 401 || cause.status === 404)) {
          clearAdminKey();
          setAuthed(false);
          setError(message);
        } else {
          setError(message);
        }
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (getAdminKey()) {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      void loadSection(section, page, statusFilter);
    }
  }, [authed, section, page, statusFilter, loadSection]);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setAdminKey(key.trim());
    setError(null);
    setAuthed(true);
  };

  const handleAdjust = async (variantId: string): Promise<void> => {
    if (adjust.variantId !== variantId) {
      return;
    }
    const delta = Number(adjust.delta);
    if (!Number.isInteger(delta) || delta === 0) {
      setError("تغییر باید عدد صحیح غیرصفر باشد.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminAdjustStock(variantId, delta, adjust.note.trim() || "adjustment");
      setNotice("موجودی اصلاح شد و در دفتر ثبت شد.");
      setAdjust({ variantId: "", delta: "", note: "" });
      setInventory(await adminListInventory());
      setLedger(await adminListLedger());
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "خطای غیرمنتظره در اصلاح موجودی.");
    } finally {
      setBusy(false);
    }
  };

  const handleB2BDecision = async (id: string): Promise<void> => {
    if (b2bNote === null || b2bNote.id !== id) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await adminB2BDecision(id, b2bNote.action, b2bNote.note);
      setB2bApps((prev) =>
        prev ? prev.map((row) => (row.id === updated.id ? updated : row)) : prev,
      );
      setNotice(`درخواست ${updated.id.slice(-8)} به وضعیت «${updated.status}» رفت.`);
      setB2bNote(null);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "خطای غیرمنتظره در بررسی درخواست.");
    } finally {
      setBusy(false);
    }
  };

  // ---- key gate -------------------------------------------------------------
  if (!authed) {
    return (
      <div className="container dv-page dv-admin">
        <h1>کنسول اپراتور</h1>
        <div className="dv-order-banner" role="note">
          کنسول بوت‌استرپ — احراز هویت با کلید مشترک؛ RBAC واقعی در فاز P4 جایگزین
          می‌شود. اگر کلید ادمین در API تنظیم نشده باشد، این کنسول غیرفعال است.
        </div>
        <form className="dv-checkout-form dv-admin-login" onSubmit={handleLogin}>
          <label htmlFor="admin-key">کلید ادمین</label>
          <input
            id="admin-key"
            type="password"
            dir="ltr"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            autoComplete="off"
            required
          />
          <button type="submit" className="dv-btn">
            ورود
          </button>
          {error !== null ? (
            <p className="dv-cart-feedback-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    );
  }

  // ---- console --------------------------------------------------------------
  return (
    <div className="container dv-page dv-admin">
      <div className="dv-order-head">
        <h1>کنسول اپراتور</h1>
        <span className="dv-sandbox-chip">BOOTSTRAP — RBAC در P4</span>
      </div>

      <div className="dv-admin-tabs" role="tablist" aria-label="بخش‌های کنسول">
        <button
          type="button"
          role="tab"
          aria-selected={section === "orders"}
          className={section === "orders" ? "dv-admin-tab dv-admin-tab-active" : "dv-admin-tab"}
          onClick={() => setSection("orders")}
        >
          سفارش‌ها
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === "inventory"}
          className={section === "inventory" ? "dv-admin-tab dv-admin-tab-active" : "dv-admin-tab"}
          onClick={() => setSection("inventory")}
        >
          موجودی و دفتر
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === "b2b"}
          className={section === "b2b" ? "dv-admin-tab dv-admin-tab-active" : "dv-admin-tab"}
          onClick={() => setSection("b2b")}
        >
          درخواست‌های B2B
        </button>
        <button
          type="button"
          className="dv-admin-tab dv-admin-exit"
          onClick={() => {
            clearAdminKey();
            setAuthed(false);
          }}
        >
          خروج
        </button>
      </div>

      <p className="dv-order-announce" role="status" aria-live="polite">
        {notice}
      </p>
      {error !== null ? (
        <div className="dv-checkout-error-card" role="alert">
          {error}
        </div>
      ) : null}
      {busy ? <p className="dv-muted">در حال کار…</p> : null}

      {section === "orders" ? (
        <section aria-label="سفارش‌ها">
          <div className="dv-admin-filter">
            <label htmlFor="status-filter">فیلتر وضعیت:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">همه</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {orders !== null && orders.items.length === 0 ? (
            <div className="dv-empty">سفارشی با این فیلتر یافت نشد.</div>
          ) : null}
          {orders !== null && orders.items.length > 0 ? (
            <table className="dv-admin-table">
              <thead>
                <tr>
                  <th>کد</th>
                  <th>وضعیت</th>
                  <th>مشتری</th>
                  <th>موبایل</th>
                  <th>اقلام</th>
                  <th>مبلغ</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {orders.items.map((row) => (
                  <tr key={row.id}>
                    <td dir="ltr">{row.id.slice(-8)}</td>
                    <td>{STATUS_LABELS[row.status] ?? row.status}</td>
                    <td>{row.customerName}</td>
                    <td dir="ltr">{row.customerPhone}</td>
                    <td>{formatFaNumber(row.itemCount)}</td>
                    <td>{formatPrice(row.subtotalMinor, row.currency)}</td>
                    <td dir="ltr">{new Date(row.createdAt).toISOString().slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {orders !== null && orders.totalPages > 1 ? (
            <div className="dv-admin-pager">
              <button type="button" className="dv-btn dv-btn-gold" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                قبلی
              </button>
              <span>
                صفحه {formatFaNumber(page)} از {formatFaNumber(orders.totalPages)}
              </span>
              <button
                type="button"
                className="dv-btn dv-btn-gold"
                disabled={page >= orders.totalPages}
                onClick={() => setPage(page + 1)}
              >
                بعدی
              </button>
            </div>
          ) : null}
        </section>
      ) : section === "b2b" ? (
        <section aria-label="درخواست‌های همکاری B2B">
          {b2bApps !== null && b2bApps.length === 0 ? (
            <div className="dv-empty">درخواستی ثبت نشده است.</div>
          ) : null}
          {b2bApps !== null
            ? b2bApps.map((row) => (
                <article key={row.id} className="dv-card dv-b2b-app">
                  <h3>{row.orgName}</h3>
                  <p className="dv-muted">
                    {row.contactName} — <span dir="ltr">{row.contactPhone}</span>
                    {row.economicCode ? (
                      <>
                        {" "}— کد اقتصادی: <span dir="ltr">{row.economicCode}</span>
                      </>
                    ) : null}
                  </p>
                  <p>
                    وضعیت: <strong>{row.status}</strong>
                    {row.reviewNote ? ` — ${row.reviewNote}` : ""}
                  </p>
                  {b2bNote !== null && b2bNote.id === row.id ? (
                    <div className="dv-admin-adjust">
                      <input
                        type="text"
                        aria-label="یادداشت بررسی"
                        placeholder="یادداشت بررسی (حداقل ۳ نویسه)"
                        value={b2bNote.note}
                        onChange={(event) => setB2bNote({ ...b2bNote, note: event.target.value })}
                      />
                      <button
                        type="button"
                        className="dv-btn dv-btn-gold"
                        disabled={busy}
                        onClick={() => void handleB2BDecision(row.id)}
                      >
                        ثبت
                      </button>
                      <button
                        type="button"
                        className="dv-admin-tab"
                        onClick={() => setB2bNote(null)}
                      >
                        انصراف
                      </button>
                    </div>
                  ) : (
                    <div className="dv-pay-actions">
                      <button
                        type="button"
                        className="dv-btn dv-btn-gold"
                        disabled={busy}
                        onClick={() => setB2bNote({ id: row.id, note: "", action: "approve" })}
                      >
                        تأیید
                      </button>
                      <button
                        type="button"
                        className="dv-order-cancel dv-pay-fail"
                        disabled={busy}
                        onClick={() => setB2bNote({ id: row.id, note: "", action: "reject" })}
                      >
                        رد
                      </button>
                      <button
                        type="button"
                        className="dv-admin-tab"
                        disabled={busy}
                        onClick={() => setB2bNote({ id: row.id, note: "", action: "request-info" })}
                      >
                        درخواست اطلاعات
                      </button>
                    </div>
                  )}
                </article>
              ))
            : null}
        </section>
      ) : (
        <section aria-label="موجودی و دفتر">
          {inventory !== null && inventory.length > 0 ? (
            <table className="dv-admin-table">
              <thead>
                <tr>
                  <th>محصول</th>
                  <th>SKU</th>
                  <th>onHand</th>
                  <th>رزرو</th>
                  <th>قابل فروش</th>
                  <th>اصلاح</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.variantId}>
                    <td>{item.productNameFa}</td>
                    <td dir="ltr">{item.sku}</td>
                    <td>{formatFaNumber(item.onHand)}</td>
                    <td>{formatFaNumber(item.reserved)}</td>
                    <td>{formatFaNumber(item.availableToSell)}</td>
                    <td>
                      {adjust.variantId === item.variantId ? (
                        <div className="dv-admin-adjust">
                          <input
                            type="number"
                            dir="ltr"
                            aria-label="تغییر موجودی"
                            value={adjust.delta}
                            onChange={(event) => setAdjust({ ...adjust, delta: event.target.value })}
                          />
                          <input
                            type="text"
                            aria-label="یادداشت"
                            placeholder="یادداشت"
                            value={adjust.note}
                            onChange={(event) => setAdjust({ ...adjust, note: event.target.value })}
                          />
                          <button
                            type="button"
                            className="dv-btn dv-btn-gold"
                            disabled={busy}
                            onClick={() => void handleAdjust(item.variantId)}
                          >
                            ثبت
                          </button>
                          <button
                            type="button"
                            className="dv-admin-tab"
                            onClick={() => setAdjust({ variantId: "", delta: "", note: "" })}
                          >
                            انصراف
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="dv-btn dv-btn-gold"
                          onClick={() => setAdjust({ variantId: item.variantId, delta: "", note: "" })}
                        >
                          اصلاح
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="dv-empty">موجودی ثبت‌شده‌ای نیست.</div>
          )}

          {ledger !== null && ledger.length > 0 ? (
            <>
              <h2 className="dv-admin-ledger-title">دفتر موجودی (۱۰۰ ردیف آخر)</h2>
              <table className="dv-admin-table">
                <thead>
                  <tr>
                    <th>واریانت</th>
                    <th>دلتا onHand</th>
                    <th>دلتا رزرو</th>
                    <th>دلیل</th>
                    <th>مرجع</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row) => (
                    <tr key={row.id}>
                      <td dir="ltr">{row.variantId.slice(-8)}</td>
                      <td>{formatFaNumber(row.deltaOnHand)}</td>
                      <td>{formatFaNumber(row.deltaReserved)}</td>
                      <td>{row.reason}</td>
                      <td>{row.refType}</td>
                      <td dir="ltr">{new Date(row.createdAt).toISOString().slice(0, 16).replace("T", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </section>
      )}
    </div>
  );
}
