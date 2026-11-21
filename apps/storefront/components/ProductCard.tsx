import Link from "next/link";
import type { Product } from "@bc/contracts";
import PriceTag from "./PriceTag";
import SampleBadge from "./SampleBadge";
import { getDefaultVariant } from "../lib/product";

type ProductCardProps = {
  product: Product;
};

/**
 * Catalog card linking to the PDP. Media is a CSS gradient placeholder with
 * the Latin initial of the product (no binary assets in this phase).
 */
export default function ProductCard({ product }: ProductCardProps) {
  const variant = getDefaultVariant(product);
  // P5-lite: a product is ناموجود when every variant has zero available stock.
  const totalAvailable = product.variants.reduce((sum, v) => sum + v.availableToSell, 0);
  const outOfStock = totalAvailable === 0;

  return (
    <Link href={`/products/${product.slug}`} className="dv-product-card">
      <span className="dv-card-top">
        {product.category ? (
          <span className="dv-chip">{product.category.nameFa}</span>
        ) : (
          <span />
        )}
        {outOfStock ? <span className="dv-badge dv-badge-oos">ناموجود</span> : null}
        {product.isSample ? <SampleBadge /> : null}
      </span>

      <span className="dv-card-media" aria-hidden="true">
        <span className="dv-card-initial">{product.nameEn.charAt(0).toUpperCase()}</span>
      </span>

      <h3 className="dv-card-name">{product.nameFa}</h3>

      <span className="dv-card-foot">
        {variant ? (
          <PriceTag priceMinor={variant.priceMinor} currency={variant.currency} />
        ) : (
          <span className="dv-muted">قیمت ثبت نشده</span>
        )}
      </span>
    </Link>
  );
}
