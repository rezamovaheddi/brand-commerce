import Link from "next/link";
import LeafMark from "./LeafMark";
import CartButton from "./cart/CartButton";

/**
 * Sticky glass header (server component). The cart button is a client island
 * showing the live count from CartProvider.
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
          <Link href="/about" className="dv-nav-link">درباره ما</Link>
          <Link href="/b2b/portal" className="dv-nav-link">فروش سازمانی</Link>
        </nav>

        <CartButton />
      </div>
    </header>
  );
}
