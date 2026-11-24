/**
 * Pure Domain Rules for Loyalty, Referral, Consent & Pharmacovigilance (TASK-092..098, 133..136).
 * Strict zero-IO invariants:
 * - Append-only points ledger reconstruction
 * - Post-return-window accrual qualification
 * - Double-spend prevention via reservation locks
 * - Anti-fraud self-referral blocks
 * - Strict separation of Consumer Points from Partner Financial Commission
 * - Pharmacovigilance adverse event triage
 */

export type LoyaltyTier = "PEARL" | "GOLD" | "ETHEREAL_VIP";

export function calculateLoyaltyTier(lifetimeEarnedPoints: number): LoyaltyTier {
  if (!Number.isInteger(lifetimeEarnedPoints) || lifetimeEarnedPoints < 0) {
    throw new Error(`invalid points: ${String(lifetimeEarnedPoints)}`);
  }
  if (lifetimeEarnedPoints >= 2000) return "ETHEREAL_VIP";
  if (lifetimeEarnedPoints >= 1000) return "GOLD";
  return "PEARL";
}

export type LoyaltyMovementType =
  | "ACCRUAL"
  | "REDEMPTION_RESERVE"
  | "REDEMPTION_COMMIT"
  | "REDEMPTION_RELEASE"
  | "EXPIRY"
  | "REVERSAL"
  | "BONUS";

export interface LoyaltyMovement {
  id: string;
  accountId: string;
  type: LoyaltyMovementType;
  points: number;
  orderId?: string;
  createdAt: string;
}

export interface LoyaltyLedgerSummary {
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
  reservedPoints: number;
  availablePoints: number;
}

/**
 * Reconstructs customer loyalty balance strictly from append-only ledger movements.
 * Invariants: currentBalance >= 0, availablePoints >= 0.
 */
export function computeLoyaltyLedger(movements: LoyaltyMovement[]): LoyaltyLedgerSummary {
  let totalEarned = 0;
  let totalSpent = 0;
  let reservedPoints = 0;

  for (const m of movements) {
    if (!Number.isInteger(m.points) || m.points < 0) {
      throw new Error(`Invalid movement points: ${String(m.points)}`);
    }

    switch (m.type) {
      case "ACCRUAL":
      case "BONUS":
        totalEarned += m.points;
        break;
      case "REDEMPTION_RESERVE":
        reservedPoints += m.points;
        break;
      case "REDEMPTION_RELEASE":
        reservedPoints = Math.max(0, reservedPoints - m.points);
        break;
      case "REDEMPTION_COMMIT":
        reservedPoints = Math.max(0, reservedPoints - m.points);
        totalSpent += m.points;
        break;
      case "REVERSAL":
      case "EXPIRY":
        totalSpent += m.points;
        break;
    }
  }

  const currentBalance = totalEarned - totalSpent;
  if (currentBalance < 0) {
    throw new Error(`Negative loyalty balance detected: ${currentBalance}`);
  }

  const availablePoints = currentBalance - reservedPoints;
  if (availablePoints < 0) {
    throw new Error(`Over-reserved points detected: reserved ${reservedPoints} exceeds balance ${currentBalance}`);
  }

  return {
    totalEarned,
    totalSpent,
    currentBalance,
    reservedPoints,
    availablePoints,
  };
}

/**
 * Enforces Return-Window Accrual Qualification (TASK-093 / TASK-098).
 * Points may accrue ONLY after order status is DELIVERED and return window has elapsed.
 */
export function canAccrueLoyaltyPoints(
  orderStatus: string,
  deliveredAt: string | null,
  returnWindowDays = 7,
  currentTime: Date = new Date()
): boolean {
  if (orderStatus !== "DELIVERED" || !deliveredAt) {
    return false;
  }
  const deliveredTimestamp = new Date(deliveredAt).getTime();
  if (isNaN(deliveredTimestamp)) return false;

  const returnWindowMs = returnWindowDays * 24 * 60 * 60 * 1000;
  return currentTime.getTime() >= deliveredTimestamp + returnWindowMs;
}

/**
 * Anti-Fraud Referral Qualification Guard (TASK-096 / TASK-097).
 * Rejects self-referrals and referrals targeting pre-existing customers.
 */
export type ReferralCheck = "ok" | "self_referral" | "existing_customer";

function normalizePhoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("98")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits;
}

export function validateReferralQualification(
  referrerPhone: string,
  refereePhone: string,
  refereeHistoricalOrderCount: number
): ReferralCheck {
  const normReferrer = normalizePhoneDigits(referrerPhone);
  const normReferee = normalizePhoneDigits(refereePhone);

  if (normReferrer.length >= 9 && normReferrer === normReferee) {
    return "self_referral";
  }
  if (refereeHistoricalOrderCount > 0) {
    return "existing_customer";
  }
  return "ok";
}

/**
 * Enforces strict boundary isolation between B2C consumer points and
 * B2B/Partner financial commission ledgers (TASK-135).
 */
export function assertLedgerBoundary(
  ledgerDomain: "CONSUMER_LOYALTY" | "PARTNER_COMMISSION",
  denomination: "POINTS" | "IRR_MINOR"
): void {
  if (ledgerDomain === "CONSUMER_LOYALTY" && denomination !== "POINTS") {
    throw new Error("Consumer loyalty ledger must only be denominated in POINTS");
  }
  if (ledgerDomain === "PARTNER_COMMISSION" && denomination !== "IRR_MINOR") {
    throw new Error("Partner commercial commission ledger must only be denominated in IRR_MINOR");
  }
}

// ---- Pharmacovigilance & Adverse Event Triage (TASK-133) --------------------

export type AdverseSeverity = "MILD" | "MODERATE" | "SERIOUS";

export interface AdverseEventTriageResult {
  isEmergency: boolean;
  regulatorySlaHours: number;
  notifyRole: "CLINICAL_SPECIALIST" | "IFDA_REGULATORY_DIRECTOR";
  requiresImmediateLotFreeze: boolean;
}

export function triageAdverseEvent(
  severity: AdverseSeverity,
  requiresMedicalIntervention: boolean
): AdverseEventTriageResult {
  if (severity === "SERIOUS" || requiresMedicalIntervention) {
    return {
      isEmergency: true,
      regulatorySlaHours: 24, // IFDA 24-hour mandatory reporting
      notifyRole: "IFDA_REGULATORY_DIRECTOR",
      requiresImmediateLotFreeze: true,
    };
  }
  return {
    isEmergency: false,
    regulatorySlaHours: 72,
    notifyRole: "CLINICAL_SPECIALIST",
    requiresImmediateLotFreeze: false,
  };
}

// ---- Consent Ledger (TASK-134) ----------------------------------------------

export type ConsentPurpose =
  | "TRANSACTIONAL_SMS"
  | "MARKETING_EMAIL"
  | "CLINICAL_UPDATES"
  | "ANALYTICS_COOKIE";

export interface ConsentRecord {
  purpose: ConsentPurpose;
  granted: boolean;
  updatedAt: string;
}

/**
 * Checks if communication can be dispatched honoring active user consent.
 */
export function canDispatchCommunication(
  consents: ConsentRecord[],
  purpose: ConsentPurpose
): boolean {
  // Transactional SMS for order tracking does not require marketing consent
  if (purpose === "TRANSACTIONAL_SMS") return true;

  const record = consents.find((c) => c.purpose === purpose);
  return record?.granted === true;
}
