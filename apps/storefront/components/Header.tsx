import Link from "next/link";
import LeafMark from "./LeafMark";
import CartButton from "./cart/CartButton";

/**
 * Sticky glass header (server component). The cart button is a client island
 * showing the live count from CartProvider; the /about route remains an
 * honest disabled stub until its phase.
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

        <CartButton />
      </div>
    </header>
  );
}
