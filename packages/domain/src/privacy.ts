/**
 * Canonical Data Privacy, Consent Ledger & Retention Engine (N20 / TASK-134 / TASK-136)
 *
 * References:
 * - 03-architecture/data-classification-and-retention-matrix-fa.csv
 * - 04-workflows/21-consent-and-data-rights.mmd
 * - Iranian E-Commerce Law (قانون تجارت الکترونیکی) & Tax Code Article 14 (10-Year Statutory Hold)
 */

export type DataClassificationTier =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "RESTRICTED"
  | "SECRET";

export interface DataClassificationPolicy {
  readonly tier: DataClassificationTier;
  readonly categoryFa: string;
  readonly examples: string;
  readonly defaultAccess: string;
  readonly processingControls: string;
  readonly retentionPolicy: string;
  readonly deletionOrHoldRule: string;
  readonly owner: string;
}

export const DATA_CLASSIFICATIONS: Readonly<Record<DataClassificationTier, DataClassificationPolicy>> = {
  PUBLIC: {
    tier: "PUBLIC",
    categoryFa: "عمومی",
    examples: "صفحات منتشرشده، اطلاعات عمومی محصول",
    defaultAccess: "Public read",
    processingControls: "CMS publication gate, cache policy",
    retentionPolicy: "Until unpublished + archive policy",
    deletionOrHoldRule: "Remove public cache; retain approved historical version per policy",
    owner: "CMS/Product",
  },
  INTERNAL: {
    tier: "INTERNAL",
    categoryFa: "داخلی",
    examples: "پیکربندی، مستندات داخلی غیرحساس، KPI aggregate",
    defaultAccess: "Staff by role",
    processingControls: "SSO/MFA, least privilege, audit",
    retentionPolicy: "Business schedule approved per document type",
    deletionOrHoldRule: "Archive then delete with owner approval",
    owner: "Operations",
  },
  CONFIDENTIAL: {
    tier: "CONFIDENTIAL",
    categoryFa: "محرمانه",
    examples: "پروفایل مشتری، اطلاعات تماس، سفارش، قیمت قراردادی، مکاتبات",
    defaultAccess: "Assigned customer/org/team",
    processingControls: "Encryption, object-level access, purpose limitation, redaction",
    retentionPolicy: "Market/legal retention schedule; do not set universal period",
    deletionOrHoldRule: "Delete/anonymize after purpose and legal retention; legal hold overrides",
    owner: "CRM/Commerce",
  },
  RESTRICTED: {
    tier: "RESTRICTED",
    categoryFa: "محدود",
    examples: "مدارک هویتی/شرکتی، اسناد مالی، فرمول و artwork محرمانه، رخداد ناخواسته، credential",
    defaultAccess: "Named roles only",
    processingControls: "Field encryption where justified, MFA step-up, no logs/traces, private object storage",
    retentionPolicy: "Category-specific lawful schedule; short-lived challenge TTL for OTP",
    deletionOrHoldRule: "Legal hold, breach process, approved purge and audit; no self-service deletion of case evidence",
    owner: "Security/Finance/Regulatory",
  },
  SECRET: {
    tier: "SECRET",
    categoryFa: "راز سامانه",
    examples: "API keys, signing keys, database credentials, encryption keys",
    defaultAccess: "Secret manager service principals only",
    processingControls: "No repository/.env production secrets, rotation, scoped access, access audit",
    retentionPolicy: "Rotate per threat/provider policy; revoke on incident/personnel change",
    deletionOrHoldRule: "Secure destroy after rotation/expiry; preserve rotation audit metadata only",
    owner: "Platform Security",
  },
} as const;

export type PrivacyConsentPurpose =
  | "TRANSACTIONAL_ESSENTIAL"
  | "MARKETING_EMAIL"
  | "MARKETING_SMS"
  | "ANALYTICS_TRACKING"
  | "THIRD_PARTY_SHARING";

export type ConsentChannel =
  | "WEB"
  | "MOBILE_APP"
  | "SMS_OPT_IN"
  | "CALL_CENTER"
  | "PAPER_FORM";

export type ConsentStatus = "GRANTED" | "REVOKED";

export interface PrivacyConsentRecord {
  readonly id: string;
  readonly customerId: string;
  readonly purpose: PrivacyConsentPurpose;
  readonly channel: ConsentChannel;
  readonly status: ConsentStatus;
  readonly version: string;
  readonly timestamp: string;
  readonly ipAddressMasked?: string;
  readonly userAgent?: string;
}

/**
 * Mask an IPv4 or IPv6 address for privacy-safe audit logging.
 */
export function maskIpAddress(ip: string): string {
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 3).join(":")}::0`;
  }
  return "0.0.0.0";
}

/** Check if customer currently has active, granted consent for a specific purpose. */
export function isConsentActive(
  customerId: string,
  purpose: PrivacyConsentPurpose,
  history: readonly PrivacyConsentRecord[]
): boolean {
  // TRANSACTIONAL_ESSENTIAL is fundamental to service execution (orders, OTP, delivery)
  if (purpose === "TRANSACTIONAL_ESSENTIAL") {
    return true;
  }

  const matching = history.filter((r) => r.customerId === customerId && r.purpose === purpose);

  if (matching.length === 0) {
    return false; // Default-Deny: absence of explicit affirmative opt-in means revoked/denied
  }

  // Find latest record; tie-breaker is later position in history
  let latest = matching[0];
  let latestTime = new Date(latest.timestamp).getTime();
  for (let i = 1; i < matching.length; i++) {
    const t = new Date(matching[i].timestamp).getTime();
    if (t >= latestTime) {
      latest = matching[i];
      latestTime = t;
    }
  }

  return latest.status === "GRANTED";
}

/**
 * Append a new consent event to the customer's immutable consent ledger.
 * Returns updated history array.
 */
export function recordConsent(
  history: readonly PrivacyConsentRecord[],
  event: Omit<PrivacyConsentRecord, "timestamp"> & { timestamp?: string }
): PrivacyConsentRecord[] {
  const fullRecord: PrivacyConsentRecord = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
    ipAddressMasked: event.ipAddressMasked ? maskIpAddress(event.ipAddressMasked) : undefined,
  };

  return [...history, fullRecord];
}

// ---- Data Subject Rights (DSAR) - Export & Erasure -------------------------

export interface DataSubjectProfile {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  nationalId?: string;
  addresses: Array<{
    id: string;
    province: string;
    city: string;
    detail: string;
    postalCode: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface DataSubjectOrderSummary {
  orderId: string;
  orderNumber: string;
  status: string;
  amountMinor: number;
  currency: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface DataSubjectLoyaltySummary {
  balancePoints: number;
  tier: string;
  referralCode?: string;
  totalAccruedPoints: number;
}

export interface DataSubjectExportBundle {
  exportId: string;
  generatedAt: string;
  subjectId: string;
  classification: "CONFIDENTIAL";
  profile: DataSubjectProfile;
  orders: DataSubjectOrderSummary[];
  loyalty?: DataSubjectLoyaltySummary;
  consents: PrivacyConsentRecord[];
  legalNoticeFa: string;
}

/**
 * Generate portable, machine-readable JSON bundle for Right of Access (DSAR Export).
 */
export function generateDataSubjectExport(
  profile: DataSubjectProfile,
  orders: DataSubjectOrderSummary[],
  consents: PrivacyConsentRecord[],
  loyalty?: DataSubjectLoyaltySummary
): DataSubjectExportBundle {
  return {
    exportId: `DSAR-EXP-${Date.now()}-${profile.id.slice(-6)}`,
    generatedAt: new Date().toISOString(),
    subjectId: profile.id,
    classification: "CONFIDENTIAL",
    profile: { ...profile },
    orders: [...orders],
    loyalty: loyalty ? { ...loyalty } : undefined,
    consents: consents.filter((c) => c.customerId === profile.id),
    legalNoticeFa:
      "این پرونده شامل کلیه اطلاعات هویتی، سوابق سفارش، لجر وفاداری و تاریخچه رضایت‌نامه‌های شما در پلتفرم Brand Commerce می‌باشد.",
  };
}

export interface LegalHoldRecord {
  holdId: string;
  customerId: string;
  statutoryRequirement: "TAX_CODE_10_YEARS" | "IFDA_SAFETY_RECALL" | "LITIGATION_PENDING";
  reason: string;
  issuedAt: string;
  active: boolean;
}

export type ErasureDecisionCode =
  | "ERASURE_APPROVED"
  | "LEGAL_HOLD_BLOCKED"
  | "STATUTORY_HOLD_PSEUDONYMIZATION";

export interface ErasureEvaluationResult {
  decision: "PROCEED_FULL_ERASURE" | "PROCEED_PSEUDONYMIZATION" | "REJECT_LEGAL_HOLD";
  code: ErasureDecisionCode;
  reason: string;
  activeHoldIds: string[];
  statutoryRetentionOrdersCount: number;
}

/** 10 Years in Milliseconds (Iranian Commercial & Tax Code Article 14) */
export const TEN_YEARS_MS = 10 * 365.25 * 24 * 60 * 60 * 1000;

/**
 * Evaluate customer Right-to-Erasure against active legal holds and statutory tax retention.
 */
export function evaluateErasureRequest(
  customerId: string,
  orders: DataSubjectOrderSummary[],
  legalHolds: readonly LegalHoldRecord[],
  currentTimeMs: number = Date.now()
): ErasureEvaluationResult {
  // 1. Check active legal holds (e.g. ongoing investigation, IFDA pharmacovigilance audit)
  const activeHolds = legalHolds.filter((h) => h.customerId === customerId && h.active);
  if (activeHolds.length > 0) {
    return {
      decision: "REJECT_LEGAL_HOLD",
      code: "LEGAL_HOLD_BLOCKED",
      reason: `درخواست حذف به دلیل وجود ${activeHolds.length} مورد قرار منع امحای قانونی فعال (Legal Hold) مسدود گردید.`,
      activeHoldIds: activeHolds.map((h) => h.holdId),
      statutoryRetentionOrdersCount: 0,
    };
  }

  // 2. Check completed orders within statutory retention period (10 years)
  const statutoryOrders = orders.filter((o) => {
    if (o.status !== "PAID" && o.status !== "DELIVERED" && o.status !== "COMPLETED") {
      return false;
    }
    const orderTime = new Date(o.createdAt).getTime();
    return currentTimeMs - orderTime < TEN_YEARS_MS;
  });

  if (statutoryOrders.length > 0) {
    return {
      decision: "PROCEED_PSEUDONYMIZATION",
      code: "STATUTORY_HOLD_PSEUDONYMIZATION",
      reason: `به دلیل الزام ماده ۱۴ قانون تجارت و مقررات مالیاتی، اسناد مالی ${statutoryOrders.length} سفارش تا سقف ۱۰ سال حفظ می‌شود؛ اطلاعات هویتی و ارتباطی نام‌برده به صورت غیرقابل بازگشت مستعارسازی و پیوندهای بازاریابی امحا می‌گردد.`,
      activeHoldIds: [],
      statutoryRetentionOrdersCount: statutoryOrders.length,
    };
  }

  return {
    decision: "PROCEED_FULL_ERASURE",
    code: "ERASURE_APPROVED",
    reason: "هیچ قرار منع امحا یا تعهد قانونی مالیاتی فعال وجود ندارد؛ امحای کامل و یکپارچه پرونده تایید شد.",
    activeHoldIds: [],
    statutoryRetentionOrdersCount: 0,
  };
}

/**
 * Irreversibly pseudonymize personal identifying attributes while preserving
 * referential financial ledger integrity.
 */
export function anonymizeCustomerProfile(profile: DataSubjectProfile): DataSubjectProfile {
  const shortHash = profile.id.slice(-6);

  return {
    id: profile.id,
    fullName: `کاربر ناشناس [${shortHash}]`,
    mobile: "+989000000000",
    email: `anonymized-${shortHash}@brand-commerce.local`,
    nationalId: undefined,
    addresses: [],
    createdAt: profile.createdAt,
    updatedAt: new Date().toISOString(),
  };
}
