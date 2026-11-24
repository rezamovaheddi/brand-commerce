import { z } from "zod";

/**
 * Canonical Provider Capability Contracts & Adapter Boundaries (TASK-185 / GAP-030)
 * Reference: 05-integrations/provider-capability-contracts-fa.md & provider-matrix.csv
 *
 * Governs provider-neutral interfaces, strict integer minor units for financial ops,
 * Iranian tax memory IDs, cold-chain temperature thresholds, and national identity checksums.
 */

export const ProviderCapabilityEnum = z.enum([
  "PAYMENT_GATEWAY",
  "SHIPPING_CARRIER",
  "MESSAGING_SMS",
  "MESSAGING_EMAIL",
  "TAX_INVOICE",
  "ACCOUNTING_EXPORT",
  "MEDIA_SECURITY",
  "IDENTITY_KYC",
]);
export type ProviderCapability = z.infer<typeof ProviderCapabilityEnum>;

// --- 1. PAYMENT GATEWAY ADAPTER CONTRACTS ---

export const PaymentIntentInputSchema = z.object({
  orderId: z.string().min(1),
  amountMinor: z.number().int().positive(),
  currency: z.literal("IRR"),
  customerPhone: z.string().min(10).max(15),
  callbackUrl: z.string().url(),
  description: z.string().optional(),
});
export type PaymentIntentInput = z.infer<typeof PaymentIntentInputSchema>;

export const PaymentIntentOutputSchema = z.object({
  intentId: z.string(),
  paymentUrl: z.string().url(),
  authority: z.string(),
  expiresAt: z.string().datetime(),
});
export type PaymentIntentOutput = z.infer<typeof PaymentIntentOutputSchema>;

export const PaymentWebhookPayloadSchema = z.object({
  eventId: z.string(),
  authority: z.string(),
  orderId: z.string(),
  amountMinor: z.number().int().positive(),
  currency: z.literal("IRR"),
  status: z.enum(["SUCCESS", "FAILED", "CANCELLED"]),
  referenceId: z.string().optional(),
  timestamp: z.string().datetime(),
  signatureHex: z.string(),
});
export type PaymentWebhookPayload = z.infer<typeof PaymentWebhookPayloadSchema>;

export const PaymentRefundInputSchema = z.object({
  paymentReferenceId: z.string(),
  refundAmountMinor: z.number().int().positive(),
  reason: z.string(),
  idempotencyKey: z.string().uuid(),
});
export type PaymentRefundInput = z.infer<typeof PaymentRefundInputSchema>;

export const PaymentRefundOutputSchema = z.object({
  refundId: z.string(),
  refundedAmountMinor: z.number().int().positive(),
  remainingAmountMinor: z.number().int().nonnegative(),
  status: z.enum(["COMPLETED", "PENDING", "REJECTED"]),
});
export type PaymentRefundOutput = z.infer<typeof PaymentRefundOutputSchema>;

// --- 2. SHIPPING & COLD-CHAIN CARRIER CONTRACTS ---

export const ShippingCarrierQuoteInputSchema = z.object({
  originPostalCode: z.string().length(10),
  destinationPostalCode: z.string().length(10),
  weightGrams: z.number().int().positive(),
  requiresColdChain: z.boolean().default(false),
  declaredValueMinor: z.number().int().nonnegative(),
});
export type ShippingCarrierQuoteInput = z.infer<typeof ShippingCarrierQuoteInputSchema>;

export const ShippingCarrierQuoteOutputSchema = z.object({
  carrierCode: z.string(),
  serviceName: z.string(),
  shippingFeeMinor: z.number().int().nonnegative(),
  estimatedDeliveryHours: z.number().int().positive(),
  coldChainCertified: z.boolean(),
});
export type ShippingCarrierQuoteOutput = z.infer<typeof ShippingCarrierQuoteOutputSchema>;

export const ShipmentTrackingStatusEnum = z.enum([
  "MANIFESTED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RETURNED_TO_SENDER",
  "EXCEPTION",
]);
export type ShipmentTrackingStatus = z.infer<typeof ShipmentTrackingStatusEnum>;

export const ShipmentTrackingOutputSchema = z.object({
  trackingNumber: z.string(),
  carrier: z.string(),
  currentStatus: ShipmentTrackingStatusEnum,
  statusHistory: z.array(
    z.object({
      status: ShipmentTrackingStatusEnum,
      location: z.string(),
      timestamp: z.string().datetime(),
      description: z.string(),
    })
  ),
  isColdChainCompliant: z.boolean(),
  minTemperatureObservedC: z.number().optional(),
  maxTemperatureObservedC: z.number().optional(),
});
export type ShipmentTrackingOutput = z.infer<typeof ShipmentTrackingOutputSchema>;

// --- 3. MESSAGING ADAPTER (SMS OTP & EMAIL) ---

export const SmsOtpSendInputSchema = z.object({
  recipientPhone: z.string().regex(/^09\d{9}$/, "Invalid Iranian mobile number"),
  templateCode: z.string(),
  token: z.string().min(4).max(8),
  idempotencyKey: z.string(),
});
export type SmsOtpSendInput = z.infer<typeof SmsOtpSendInputSchema>;

export const SmsSendOutputSchema = z.object({
  messageId: z.string(),
  delivered: z.boolean(),
  costMinor: z.number().int().nonnegative(),
});
export type SmsSendOutput = z.infer<typeof SmsSendOutputSchema>;

export const TransactionalEmailInputSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().min(1),
  templateName: z.string(),
  templateVariables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});
export type TransactionalEmailInput = z.infer<typeof TransactionalEmailInputSchema>;

// --- 4. TAX & E-INVOICE ADAPTER (سامانه مؤدیان) ---

export const TaxInvoiceIssueInputSchema = z.object({
  invoiceNumber: z.string(),
  orderReferenceId: z.string(),
  sellerEconomicCode: z.string().length(14),
  buyerNationalIdOrEconomic: z.string().min(10).max(14),
  subtotalMinor: z.number().int().positive(),
  vatAmountMinor: z.number().int().nonnegative(),
  totalAmountMinor: z.number().int().positive(),
  issuedAt: z.string().datetime(),
});
export type TaxInvoiceIssueInput = z.infer<typeof TaxInvoiceIssueInputSchema>;

export const TaxInvoiceStatusOutputSchema = z.object({
  taxMemoryId: z.string().length(22, "INTA 22-char unique tax memory ID"),
  status: z.enum(["ACCEPTED", "REJECTED", "PENDING_VERIFICATION"]),
  referenceNumber: z.string(),
  rejectionReason: z.string().optional(),
});
export type TaxInvoiceStatusOutput = z.infer<typeof TaxInvoiceStatusOutputSchema>;

// --- 5. ACCOUNTING EXPORT ADAPTER (GENERAL LEDGER) ---

export const AccountingJournalLineSchema = z.object({
  accountCode: z.string(),
  accountNameFa: z.string(),
  debitMinor: z.number().int().nonnegative(),
  creditMinor: z.number().int().nonnegative(),
  lineDescription: z.string(),
});
export type AccountingJournalLine = z.infer<typeof AccountingJournalLineSchema>;

export const AccountingJournalExportSchema = z.object({
  journalId: z.string(),
  documentDate: z.string().datetime(),
  fiscalPeriod: z.string().regex(/^\d{4}-\d{2}$/, "e.g. 1404-09"),
  lines: z.array(AccountingJournalLineSchema).min(2),
  sourceModule: z.enum(["COMMERCE", "INVENTORY", "REFUND", "SETTLEMENT"]),
});
export type AccountingJournalExport = z.infer<typeof AccountingJournalExportSchema>;

// --- 6. MEDIA & ATTACHMENT SECURITY ---

export const MediaScanVerdictEnum = z.enum(["CLEAN", "QUARANTINED", "MALICIOUS"]);
export type MediaScanVerdict = z.infer<typeof MediaScanVerdictEnum>;

export const MediaScanResultSchema = z.object({
  fileHashSha256: z.string().length(64),
  detectedMime: z.string(),
  declaredMime: z.string(),
  verdict: MediaScanVerdictEnum,
  quarantineReason: z.string().optional(),
  scannedAt: z.string().datetime(),
});
export type MediaScanResult = z.infer<typeof MediaScanResultSchema>;

// --- 7. IDENTITY & NATIONAL KYC (سامانه شاهکار و ثبت احوال) ---

export const NationalIdKycInputSchema = z.object({
  nationalId: z.string().length(10),
  mobileNumber: z.string().regex(/^09\d{9}$/),
  birthDateJalali: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/),
});
export type NationalIdKycInput = z.infer<typeof NationalIdKycInputSchema>;

export const NationalIdKycOutputSchema = z.object({
  isMatched: z.boolean(),
  nationalIdValid: z.boolean(),
  shahkarOwnershipMatched: z.boolean(),
  verificationReference: z.string(),
});
export type NationalIdKycOutput = z.infer<typeof NationalIdKycOutputSchema>;

// --- CANONICAL REGULATORY & COMPUTATIONAL HELPERS ---

/**
 * Validates Iranian National ID using the official Modulo-11 algorithm.
 * Form: 10 digits, where the 10th digit is the checksum of the first 9 digits.
 */
export function validateIranianNationalId(nationalId: string): boolean {
  if (!/^\d{10}$/.test(nationalId)) return false;

  // Reject uniform sequences (0000000000, 1111111111, ..., 9999999999)
  if (/^(\d)\1{9}$/.test(nationalId)) return false;

  const digits = nationalId.split("").map((d) => parseInt(d, 10));
  const checkDigit = digits[9];

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }

  const remainder = sum % 11;
  if (remainder < 2) {
    return checkDigit === remainder;
  }
  return checkDigit === 11 - remainder;
}

/**
 * Checks whether biological or peptide skincare categories require strict cold-chain logistics.
 * Target range: +2°C to +8°C.
 */
export function isColdChainRequired(productCategory: string): boolean {
  const coldChainCategories = ["BIOLOGICAL_SERUM", "PEPTIDE_AMPOULE", "ACTIVE_ENZYME_TREATMENT"];
  return coldChainCategories.includes(productCategory.toUpperCase());
}

/**
 * Validates 22-character unique tax memory ID for the Iranian National Tax Administration (سامانه مؤدیان).
 */
export function validateTaxMemoryId(taxId: string): boolean {
  return /^[A-Za-z0-9]{22}$/.test(taxId);
}
