import { z } from "zod";

/**
 * PIM & Regulatory Content Governance Schema (TASK-113 / A3, J4, J7, N21).
 * Provides clinical-grade content modeling for cosmetic & pharmaceutical products:
 * - INCI ingredient breakdown with CAS numbers and concentration tiers
 * - Safety warnings and allergen disclosures
 * - Application protocols and usage directives
 * - Regulatory origin, ISO 22716 GMP certificates, and audit lifecycle
 */

export const ContentLocaleSchema = z.enum(["fa-IR", "en-US"]);
export type ContentLocale = z.infer<typeof ContentLocaleSchema>;

export const ContentSourceSchema = z.enum([
  "REGULATORY_DOSSIER",
  "LABORATORY_COA",
  "FORMULATOR_SPEC",
  "CLINICAL_TRIAL",
]);
export type ContentSource = z.infer<typeof ContentSourceSchema>;

export const ApprovalStateSchema = z.enum([
  "DRAFT",
  "REGULATORY_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "ARCHIVED",
]);
export type ApprovalState = z.infer<typeof ApprovalStateSchema>;

export const ConcentrationTierSchema = z.enum([
  "BAND_A_OVER_50",
  "BAND_B_10_TO_50",
  "BAND_C_1_TO_10",
  "BAND_D_UNDER_1",
]);
export type ConcentrationTier = z.infer<typeof ConcentrationTierSchema>;

export const WarningTypeSchema = z.enum([
  "ALLERGEN",
  "PRECAUTION",
  "CONTRAINDICATION",
  "SUN_EXPOSURE",
]);
export type WarningType = z.infer<typeof WarningTypeSchema>;

export const WarningSeveritySchema = z.enum(["MILD", "MODERATE", "CRITICAL"]);
export type WarningSeverity = z.infer<typeof WarningSeveritySchema>;

export const TimeOfDaySchema = z.enum(["MORNING", "EVENING", "BOTH"]);
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;

export const InciIngredientSchema = z.object({
  inciName: z.string().min(2),
  persianName: z.string().min(2),
  casNumber: z.string().regex(/^\d{2,7}-\d{2}-\d$/, "Invalid CAS registry format"),
  concentrationTier: ConcentrationTierSchema,
  purposeFa: z.string().min(3),
  ewgRating: z.number().int().min(1).max(10),
  isAllergen: z.boolean().default(false),
});
export type InciIngredient = z.infer<typeof InciIngredientSchema>;

export const SafetyWarningSchema = z.object({
  warningType: WarningTypeSchema,
  severity: WarningSeveritySchema,
  textFa: z.string().min(5),
  textEn: z.string().min(5),
});
export type SafetyWarning = z.infer<typeof SafetyWarningSchema>;

export const UsageDirectionSchema = z.object({
  stepNumber: z.number().int().positive(),
  instructionFa: z.string().min(5),
  instructionEn: z.string().min(5),
  timeOfDay: TimeOfDaySchema,
  dosageUnits: z.string().min(2),
});
export type UsageDirection = z.infer<typeof UsageDirectionSchema>;

export const ProductOriginSchema = z.object({
  countryCode: z.string().length(2),
  manufacturingFacility: z.string().min(3),
  iso22716Certification: z.string().min(3),
  batchCoaHash: z.string().regex(/^[a-f0-9]{64}$/, "Must be a 64-character SHA-256 hex digest"),
});
export type ProductOrigin = z.infer<typeof ProductOriginSchema>;

export const ProductContentModelSchema = z.object({
  productId: z.string().min(3),
  sku: z.string().min(3),
  locale: ContentLocaleSchema,
  source: ContentSourceSchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must follow SemVer format (x.y.z)"),
  approvalState: ApprovalStateSchema,
  approvedBy: z.string().nullable(),
  approvedAt: z.string().datetime().nullable(),
  ingredients: z.array(InciIngredientSchema).min(1),
  warnings: z.array(SafetyWarningSchema),
  usage: z.array(UsageDirectionSchema).min(1),
  origin: ProductOriginSchema,
});
export type ProductContentModel = z.infer<typeof ProductContentModelSchema>;
