/**
 * Money & number formatting — single source of truth for the storefront.
 * Every price/number rendered in the UI must go through these helpers;
 * do not duplicate formatting logic elsewhere.
 */

const faNumberFormatter = new Intl.NumberFormat("fa-IR");

/** Formats an integer with Persian digits (fa-IR locale). */
export function formatFaNumber(value: number): string {
  return faNumberFormatter.format(value);
}

/**
 * Formats a price given in minor units (e.g. rial) with Persian digits.
 *
 * NOTE: rial vs. toman presentation is a PENDING BUSINESS DECISION
 * (see docs/governance/PENDING_BUSINESS_DECISIONS.fa.md). Until the business
 * decides, the unit is rendered as the neutral ISO code "IRR" — the UI must
 * not claim "تومان" before conversion rules are settled. When the decision
 * lands, only this function needs to change.
 */
export function formatPrice(priceMinor: number, currency: string): string {
  const unit = currency === "IRR" ? "IRR" : currency;
  return `${faNumberFormatter.format(priceMinor)} ${unit}`;
}
