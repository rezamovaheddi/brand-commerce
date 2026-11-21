import Link from "next/link";
import LeafMark from "./LeafMark";

/**
 * Sticky glass header (server component — no client state in this phase).
 * The /about route and the cart are honest stubs: disabled, explained via
 * tooltips, never faking functionality that does not exist yet.
 */
export default function Header() {
  return (
    <header className="dv-header">
      <div className="container dv-header-inner">
        <Link href="/" className="dv-brand" aria-label="DERMAVIA — صفحهٔ اصلی">
          <LeafMark size={20} />
          <span dir="ltr">DERMAVIA</span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="dv-nav">
          <Link href="/" className="dv-nav-link">خانه</Link>
          <Link href="/products" className="dv-nav-link">محصولات</Link>
          {/* /about is planned for a later phase — rendered as a disabled item */}
          <span className="dv-nav-disabled" aria-disabled="true" title="در فاز بعدی">
            درباره ما
          </span>
        </nav>

        <button
          type="button"
          className="dv-btn dv-cart-btn"
          disabled
          aria-disabled="true"
          title="سبد خرید در فاز P2 فعال می‌شود"
        >
          سبد خرید (۰)
        </button>
      </div>
    </header>
  );
}
