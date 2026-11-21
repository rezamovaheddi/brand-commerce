import type { Product, ProductVariant } from "@bc/contracts";

/**
 * Returns the product's default variant, falling back to the first variant.
 * Returns null when the product has no variants at all.
 */
export function getDefaultVariant(product: Product): ProductVariant | null {
  const fallback = product.variants[0] ?? null;
  return product.variants.find((variant) => variant.isDefault) ?? fallback;
}
