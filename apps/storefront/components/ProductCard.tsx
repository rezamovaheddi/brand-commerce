import Link from "next/link";
import type { Product } from "@bc/contracts";
import PriceTag from "./PriceTag";
import SampleBadge from "./SampleBadge";
import ProductMediaIllustration from "./ProductMediaIllustration";
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
        <ProductMediaIllustration product={product} size="card" />
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
