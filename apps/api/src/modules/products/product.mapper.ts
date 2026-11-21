import { Product, ProductStatus } from '@bc/contracts';

/**
 * Structural row types kept independent of the generated Prisma client so the
 * mapper is a pure function that is trivially unit-testable. Prisma rows
 * (product + include variants/category) are structurally assignable to these.
 */
export interface ProductVariantRow {
  id: string;
  sku: string;
  titleFa: string;
  titleEn: string;
  /** Minor currency units (e.g. IRR rial). */
  priceMinor: number;
  currency: string;
  isDefault: boolean;
  status: ProductStatus;
  /** P5-lite inventory row (optional include): null ⇒ treated as out of stock. */
  inventory: { onHand: number; reserved: number } | null;
}

export interface ProductRowWithRelations {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string;
  descriptionFa: string | null;
  descriptionEn: string | null;
  status: ProductStatus;
  /** true ⇒ clearly-marked sample/seed data. */
  isSample: boolean;
  category: { slug: string; nameFa: string; nameEn: string } | null;
  variants: readonly ProductVariantRow[];
}

/**
 * Maps a Prisma product row (with variants and category included) to the
 * shared API contract. Pure: no I/O, no Prisma types, deterministic output.
 */
export function toContract(row: ProductRowWithRelations): Product {
  return {
    id: row.id,
    slug: row.slug,
    nameFa: row.nameFa,
    nameEn: row.nameEn,
    descriptionFa: row.descriptionFa,
    descriptionEn: row.descriptionEn,
    status: row.status,
    isSample: row.isSample,
    category: row.category
      ? { slug: row.category.slug, nameFa: row.category.nameFa, nameEn: row.category.nameEn }
      : null,
    variants: row.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      titleFa: variant.titleFa,
      titleEn: variant.titleEn,
      priceMinor: variant.priceMinor,
      currency: variant.currency,
      isDefault: variant.isDefault,
      status: variant.status,
      availableToSell: Math.max(
        0,
        variant.inventory ? variant.inventory.onHand - variant.inventory.reserved : 0,
      ),
    })),
  };
}
