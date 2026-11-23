/**
 * Money & number formatting — single source of truth for the storefront.
 * Every price/number rendered in the UI must go through these helpers;
 * do not duplicate formatting logic elsewhere.
 */

const faNumberFormatter = new Intl.NumberFormat("fa-IR");

/** Converts ASCII digits in any string or number to Persian digits (۰-۹). */
export function formatFaDigits(value: string | number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(value).replace(/[0-9]/g, (d) => persianDigits[parseInt(d, 10)] ?? d);
}

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
export function formatPrice(priceMinor: number, currency = "IRR"): string {
  const unit = currency === "IRR" ? "IRR" : currency;
  return `${faNumberFormatter.format(priceMinor)} ${unit}`;
}

/** Convenience helper defaulting currency to IRR. */
export function formatPriceMinor(priceMinor: number, currency = "IRR"): string {
  return formatPrice(priceMinor, currency);
}

