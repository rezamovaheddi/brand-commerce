import { z } from "zod";

/**
 * Shared API contracts — single source of truth for API ⇄ Storefront.
 * All commerce data crossing the HTTP boundary must validate against these.
 */

export const ProductStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const ProductVariantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  titleFa: z.string(),
  titleEn: z.string(),
  /** Price in minor units (e.g. IRR rial). Currency & pricing rules are a
   *  PENDING BUSINESS DECISION — see docs/governance/PENDING_BUSINESS_DECISIONS.fa.md */
  priceMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  isDefault: z.boolean(),
  status: ProductStatusSchema,
});
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

export const CategoryRefSchema = z.object({
  slug: z.string(),
  nameFa: z.string(),
  nameEn: z.string(),
});
export type CategoryRef = z.infer<typeof CategoryRefSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameFa: z.string(),
  nameEn: z.string(),
  descriptionFa: z.string().nullable(),
  descriptionEn: z.string().nullable(),
  status: ProductStatusSchema,
  /** true ⇒ data is clearly-marked sample/seed data, must be shown as such in UI */
  isSample: z.boolean(),
  category: CategoryRefSchema.nullable(),
  variants: z.array(ProductVariantSchema),
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().max(80).optional(),
  q: z.string().max(100).optional(),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export const ProductListResponseSchema = z.object({
  items: z.array(ProductSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().nonnegative(),
});
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;

export const CategorySchema = CategoryRefSchema.extend({
  productCount: z.number().int().nonnegative(),
});
export type Category = z.infer<typeof CategorySchema>;

export const HealthResponseSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  database: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
