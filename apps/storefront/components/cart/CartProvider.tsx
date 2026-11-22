"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Cart } from "@bc/contracts";
import {
  CartApiError,
  addItem,
  createCart,
  getCart,
  removeItem,
  updateItem,
} from "../../lib/cart-client";

export type CartStatus = "idle" | "loading" | "ready" | "error";

type CartContextValue = {
  /** Last known server cart; null before the first item or after a hard failure. */
  cart: Cart | null;
  status: CartStatus;
  /** Honest Persian message for global (page-level) failure states. */
  error: string | null;
  /** Total item count, 0 when there is no cart. */
  count: number;
  /** Adds a variant (creates the cart on first use). Throws CartApiError. */
  add: (variantId: string, quantity: number) => Promise<void>;
  /** Changes a line's quantity. Throws CartApiError. */
  update: (variantId: string, quantity: number) => Promise<void>;
  /** Removes a line. Throws CartApiError. */
  remove: (variantId: string) => Promise<void>;
  /** Re-fetches the cart; used by the retry button on the /cart error card. */
  refresh: () => Promise<void>;
  /** Clears the global error and restores a calm status. */
  clearError: () => void;
  /** Controls slide-over Cart Drawer visibility */
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** localStorage key holding the guest cart id across visits. */
const CART_ID_STORAGE_KEY = "bc_cart_id";

function readStoredCartId(): string | null {
  try {
    const value = window.localStorage.getItem(CART_ID_STORAGE_KEY);
    return value !== null && value.trim() !== "" ? value : null;
  } catch {
    // Storage can be unavailable (private mode) — the cart simply won't persist.
    return null;
  }
}

function writeStoredCartId(cartId: string): void {
  try {
    window.localStorage.setItem(CART_ID_STORAGE_KEY, cartId);
  } catch {
    // Non-fatal: the cart still works for the session without persistence.
  }
}

function clearStoredCartId(): void {
  try {
    window.localStorage.removeItem(CART_ID_STORAGE_KEY);
  } catch {
    // Non-fatal.
  }
}

/** Maps a thrown value to the honest Persian message for global error states. */
function describeCartFailure(cause: unknown): string {
  if (cause instanceof CartApiError) {
    if (cause.kind === "network") {
      return "سرویس سبد خرید در دسترس نیست. اتصال API (پورت ۳۰۰۱) را بررسی کنید.";
    }
    if (cause.status === 404) {
      return "سبد خرید ذخیره‌شده روی سرور یافت نشد. با افزودن محصول، سبد جدیدی ساخته می‌شود.";
    }
    return cause.message;
  }
  return "خطای غیرمنتظره در سرویس سبد خرید رخ داد.";
}

/**
 * Client-side cart state for the whole app (guest carts, server-authoritative).
 * The cart id is persisted in localStorage; the first add-to-cart creates the
 * cart server-side. On mount an existing id is restored, and an unusable id
 * (404 / network failure) is dropped with an honest error message — never
 * silently faked.
 */
export default function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<CartStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  // The id lives in a ref so async callbacks always read the latest value
  // without stale-closure hazards; state (`cart`) mirrors it for rendering.
  const cartIdRef = useRef<string | null>(null);

  // Restore a persisted cart on mount (once).
  useEffect(() => {
    let cancelled = false;
    const storedId = readStoredCartId();
    cartIdRef.current = storedId;
    if (storedId === null) {
      // No persisted cart: stay idle until the first add-to-cart creates one.
      return;
    }
    setStatus("loading");
    getCart(storedId)
      .then((restored) => {
        if (cancelled) return;
        cartIdRef.current = restored.id;
        setCart(restored);
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        // 404 or network: the stored id cannot be trusted — drop it and say so.
        cartIdRef.current = null;
        clearStoredCartId();
        setCart(null);
        setError(describeCartFailure(cause));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback(async (variantId: string, quantity: number): Promise<void> => {
    const hadCart = cartIdRef.current !== null;
    setStatus("loading");
    try {
      let currentId = cartIdRef.current;
      if (currentId === null) {
        // First item in this browser: create the cart and persist its id.
        const created = await createCart();
        cartIdRef.current = created.id;
        writeStoredCartId(created.id);
        currentId = created.id;
      }
      let next: Cart;
      try {
        next = await addItem(currentId, { variantId, quantity });
      } catch (cause) {
        // The stored cart may have been cleaned up server-side: rebuild once.
        if (cause instanceof CartApiError && cause.status === 404) {
          clearStoredCartId();
          const created = await createCart();
          cartIdRef.current = created.id;
          writeStoredCartId(created.id);
          next = await addItem(created.id, { variantId, quantity });
        } else {
          throw cause;
        }
      }
      cartIdRef.current = next.id;
      setCart(next);
      setError(null);
      setStatus("ready");
      setIsDrawerOpen(true);
    } catch (cause) {
      // Keep the last known cart visible; the caller (PDP button) surfaces
      // the thrown CartApiError as inline feedback.
      setStatus(hadCart ? "ready" : "idle");
      throw cause;
    }
  }, []);

  const update = useCallback(async (variantId: string, quantity: number): Promise<void> => {
    const currentId = cartIdRef.current;
    if (currentId === null) {
      throw new CartApiError("http", "سبد خریدی برای به‌روزرسانی وجود ندارد.");
    }
    setStatus("loading");
    try {
      const next = await updateItem(currentId, variantId, { quantity });
      setCart(next);
      setError(null);
      setStatus("ready");
    } catch (cause) {
      if (cause instanceof CartApiError && cause.status === 404) {
        // Server no longer knows this cart: drop the local id honestly.
        cartIdRef.current = null;
        clearStoredCartId();
        setCart(null);
        setStatus("idle");
      } else {
        setStatus(cartIdRef.current !== null ? "ready" : "idle");
      }
      throw cause;
    }
  }, []);

  const remove = useCallback(async (variantId: string): Promise<void> => {
    const currentId = cartIdRef.current;
    if (currentId === null) {
      throw new CartApiError("http", "سبد خریدی برای حذف وجود ندارد.");
    }
    setStatus("loading");
    try {
      const next = await removeItem(currentId, variantId);
      setCart(next);
      setError(null);
      setStatus("ready");
    } catch (cause) {
      if (cause instanceof CartApiError && cause.status === 404) {
        cartIdRef.current = null;
        clearStoredCartId();
        setCart(null);
        setStatus("idle");
      } else {
        setStatus(cartIdRef.current !== null ? "ready" : "idle");
      }
      throw cause;
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    const currentId = cartIdRef.current;
    if (currentId === null) {
      setCart(null);
      setError(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    try {
      const restored = await getCart(currentId);
      cartIdRef.current = restored.id;
      setCart(restored);
      setError(null);
      setStatus("ready");
    } catch (cause) {
      // Same contract as the mount restore: an unusable id is dropped openly.
      cartIdRef.current = null;
      clearStoredCartId();
      setCart(null);
      setError(describeCartFailure(cause));
      setStatus("error");
    }
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
    setStatus(cartIdRef.current !== null ? "ready" : "idle");
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      status,
      error,
      count: cart?.itemCount ?? 0,
      add,
      update,
      remove,
      refresh,
      clearError,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [cart, status, error, add, update, remove, refresh, clearError, isDrawerOpen, openDrawer, closeDrawer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Access the cart context; must be used inside <CartProvider>. */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return context;
}
