import Link from "next/link";
import LeafMark from "./LeafMark";

/** Site footer: brand, sample-data disclosure, minimal nav and copyright. */
export default function Footer() {
  return (
    <footer className="dv-footer">
      <div className="container dv-footer-inner">
        <p className="dv-footer-brand">
          <LeafMark size={18} />
          <span dir="ltr">DERMAVIA</span>
        </p>

        <p className="dv-footer-note">
          پلتفرم در حال توسعه — داده‌های نمایش‌داده‌شده نمونه هستند (SAMPLE)
        </p>

        <nav aria-label="ناوبری پابرگ" className="dv-footer-nav">
          <Link href="/">خانه</Link>
          <Link href="/products">محصولات</Link>
        </nav>

        <p className="dv-footer-copy">© ۲۰۲۶ DERMAVIA</p>
      </div>
    </footer>
  );
}
