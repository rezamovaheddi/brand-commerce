import Link from "next/link";
import type { Product } from "@bc/contracts";
import PriceTag from "./PriceTag";
import SampleBadge from "./SampleBadge";
import { getDefaultVariant } from "../lib/product";

type ProductCardProps = {
  product: Product;
};

/**
 * ProductCard: Warm Clinical Luxury card with responsive SVG bottle graphic,
 * clinical badges, formatted price, and stock indicators.
 */
export default function ProductCard({ product }: ProductCardProps) {
  const variant = getDefaultVariant(product);
  const totalAvailable = product.variants.reduce((sum, v) => sum + v.availableToSell, 0);
  const outOfStock = totalAvailable === 0;

  // Derive bottle style from category or name
  const isSerum = product.category?.slug === "serum" || product.slug.includes("serum");
  const isCream = product.category?.slug === "moisturizer" || product.slug.includes("cream");

  return (
    <Link href={`/products/${product.slug}`} className="dv-product-card" style={{ textDecoration: "none", display: "flex", flexDirection: "column" }}>
      <span className="dv-card-top">
        {product.category ? (
          <span className="dv-chip">{product.category.nameFa}</span>
        ) : (
          <span />
        )}
        {outOfStock ? (
          <span className="dv-badge dv-badge-oos">ناموجود</span>
        ) : product.isSample ? (
          <SampleBadge />
        ) : null}
      </span>

      {/* Luxury Bottle / Jar SVG Visual */}
      <div
        className="dv-card-media"
        aria-hidden="true"
        style={{
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 40%, rgba(246, 241, 232, 0.9) 0%, rgba(239, 232, 220, 0.6) 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {isSerum ? (
          // Dropper bottle SVG
          <svg width="70" height="130" viewBox="0 0 70 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="serumFluid" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="goldCap" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="50%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            {/* Dropper bulb */}
            <path d="M28 8C28 4.68629 30.6863 2 34 2H36C39.3137 2 42 4.68629 42 8V18H28V8Z" fill="#1c1913" />
            {/* Gold collar */}
            <rect x="25" y="18" width="20" height="12" rx="2" fill="url(#goldCap)" />
            {/* Glass body */}
            <rect x="15" y="30" width="40" height="90" rx="14" fill="#ffffff" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" />
            {/* Fluid */}
            <rect x="18" y="55" width="34" height="62" rx="10" fill="url(#serumFluid)" opacity="0.85" />
            {/* Gloss highlight */}
            <path d="M20 38V112" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          </svg>
        ) : isCream ? (
          // Luxury cream jar SVG
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="jarGold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="50%" stopColor="#fef9c3" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
            </defs>
            {/* Golden Lid */}
            <rect x="15" y="16" width="60" height="14" rx="4" fill="url(#jarGold)" />
            {/* Frosted Glass Base */}
            <rect x="12" y="30" width="66" height="48" rx="10" fill="#ffffff" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" />
            {/* Inner Cream */}
            <rect x="18" y="36" width="54" height="36" rx="6" fill="#fffbeb" opacity="0.9" />
            {/* Gloss highlight */}
            <path d="M18 36V70" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          </svg>
        ) : (
          // Cleanser pump bottle SVG
          <svg width="60" height="130" viewBox="0 0 60 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="pumpGold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="50%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            {/* Pump actuator */}
            <path d="M22 6H38V14H22V6Z" fill="#1c1913" />
            <path d="M12 10H22V14H12V10Z" fill="#1c1913" />
            {/* Collar */}
            <rect x="20" y="14" width="20" height="10" fill="url(#pumpGold)" />
            {/* Body */}
            <rect x="12" y="24" width="36" height="98" rx="8" fill="#ffffff" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" />
            <rect x="15" y="44" width="30" height="74" rx="5" fill="#f8fafc" opacity="0.9" />
            {/* Gloss highlight */}
            <path d="M16 30V114" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </svg>
        )}
      </div>

      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <h3 className="dv-card-name" style={{ fontSize: "1rem", margin: "0 0 6px", color: "var(--dv-navy)" }}>
          {product.nameFa}
        </h3>
        <p className="dv-muted" style={{ fontSize: "0.78rem", margin: "0 0 12px", letterSpacing: 0 }} dir="ltr">
          {product.nameEn}
        </p>

        <span className="dv-card-foot" style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {variant ? (
            <PriceTag priceMinor={variant.priceMinor} currency={variant.currency} />
          ) : (
            <span className="dv-muted" style={{ fontSize: "0.85rem" }}>قیمت استعلامی</span>
          )}
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--dv-gold)" }}>
            مشاهده فرمول ←
          </span>
        </span>
      </div>
    </Link>
  );
}
