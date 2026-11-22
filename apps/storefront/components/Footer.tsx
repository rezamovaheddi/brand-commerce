import Link from "next/link";
import LeafMark from "./LeafMark";

/**
 * Site footer: Warm Clinical Luxury design with brand voice, structured
 * multi-column links, clinical trust badges, newsletter, and honest
 * development disclaimer.
 */
export default function Footer() {
  return (
    <footer className="dv-footer" style={{ borderTop: "1px solid var(--dv-line)", background: "linear-gradient(180deg, #fdfbf7 0%, #f6f1e8 100%)", paddingBlock: "64px 32px" }}>
      <div className="container">
        {/* Top Trust Badges */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, paddingBottom: 40, marginBottom: 48, borderBottom: "1px solid rgba(212, 175, 55, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.8rem" }}>🌿</span>
            <div>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--dv-navy)" }}>فرمولاسیون گیاهی و بالینی</strong>
              <span className="dv-muted" style={{ fontSize: "0.8rem" }}>فاقد پارابن، سولفات و عطرهای مصنوعی</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.8rem" }}>🔬</span>
            <div>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--dv-navy)" }}>تأییدیه تست درماتولوژیک</strong>
              <span className="dv-muted" style={{ fontSize: "0.8rem" }}>غیرکومدون‌زا و مناسب حساس‌ترین پوست‌ها</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.8rem" }}>❄️</span>
            <div>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--dv-navy)" }}>حفظ زنجیره سرد و کیفیت</strong>
              <span className="dv-muted" style={{ fontSize: "0.8rem" }}>انبارداری استاندارد و ارسال با کنترل دما</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.8rem" }}>✨</span>
            <div>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--dv-navy)" }}>ضمانت اصالت و بچ نامبر</strong>
              <span className="dv-muted" style={{ fontSize: "0.8rem" }}>رهگیری داسیه بهداشتی و برچسب اصالت</span>
            </div>
          </div>
        </div>

        {/* 4-Column Navigation & Brand Info */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 36, marginBottom: 48 }}>
          {/* Col 1: Brand story */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <LeafMark size={24} />
              <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--dv-navy)" }} dir="ltr">DERMAVIA</span>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--dv-ink-soft)", lineHeight: 1.8, marginBottom: 16 }}>
              مراقبت طبیعی، اعتماد پایدار. DERMAVIA بر پایه فلسفه فرمول‌های مینیمال و شواهد بالینی متولد شد؛ برای پوستی که سزاوار نهایت احترام، لطافت و شفافیت است.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <span className="dv-badge" style={{ background: "rgba(212, 175, 55, 0.15)", color: "var(--dv-gold)", border: "1px solid rgba(212, 175, 55, 0.3)" }}>
                گواهی Cruelty-Free
              </span>
              <span className="dv-badge" style={{ background: "rgba(212, 175, 55, 0.15)", color: "var(--dv-gold)", border: "1px solid rgba(212, 175, 55, 0.3)" }}>
                ۱۰۰٪ وگان
              </span>
            </div>
          </div>

          {/* Col 2: Products & Rituals */}
          <div>
            <h4 style={{ fontSize: "1rem", color: "var(--dv-navy)", margin: "0 0 16px", fontWeight: 700 }}>محصولات و روتین‌ها</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li>
                <Link href="/products" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  کاتالوگ کامل محصولات
                </Link>
              </li>
              <li>
                <Link href="/products?category=cleanser" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  پاک‌کننده‌های ملایم سد دفاعی
                </Link>
              </li>
              <li>
                <Link href="/products?category=serum" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  سرم‌های درمانی و جوانساز
                </Link>
              </li>
              <li>
                <Link href="/products?category=moisturizer" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  کرم‌های آبرسان و تغذیه‌کننده
                </Link>
              </li>
              <li>
                <Link href="/about" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  درباره فلسفه فرمولاسیون ما
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Services & Loyalty */}
          <div>
            <h4 style={{ fontSize: "1rem", color: "var(--dv-navy)", margin: "0 0 16px", fontWeight: 700 }}>خدمات و باشگاه مشتریان</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li>
                <Link href="/loyalty" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  باشگاه مشتریان VIP مروارید
                </Link>
              </li>
              <li>
                <Link href="/magazine" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  مجله علمی و مراقبت پوست
                </Link>
              </li>
              <li>
                <Link href="/contact" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  مشاوره تخصصی و پرسش‌های متداول
                </Link>
              </li>
              <li>
                <Link href="/support" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  ثبت و پیگیری تیکت پشتیبانی CRM
                </Link>
              </li>
              <li>
                <Link href="/cart" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  سبد خرید و هدایای ویژه
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: B2B & Enterprise */}
          <div>
            <h4 style={{ fontSize: "1rem", color: "var(--dv-navy)", margin: "0 0 16px", fontWeight: 700 }}>تأمین سازمانی و B2B</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li>
                <Link href="/b2b/portal" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  پورتال اعضای سازمانی و همکاران
                </Link>
              </li>
              <li>
                <Link href="/b2b/apply" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  درخواست نمایندگی و پخش مویرگی
                </Link>
              </li>
              <li>
                <Link href="/b2b/rfq" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  استعلام قیمت عمده و سفارش OEM
                </Link>
              </li>
              <li>
                <Link href="/admin" className="dv-link" style={{ color: "var(--dv-ink-soft)", fontSize: "0.9rem" }}>
                  کنسول مدیریت و اپراتور Backoffice
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Disclaimer & Copyright */}
        <div style={{ borderTop: "1px solid rgba(212, 175, 55, 0.2)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, fontSize: "0.84rem", color: "var(--dv-muted)" }}>
          <p style={{ margin: 0 }}>
            این سایت در فاز پیش‌تولید است؛ داده‌های نمایش‌داده‌شده محصولات نمونه بالینی (SAMPLE) هستند.
          </p>
          <p style={{ margin: 0 }} dir="ltr">
            © 2026 DERMAVIA Clinical Skincare. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
