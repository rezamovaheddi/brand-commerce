import { formatPrice } from "../lib/format";

type PriceTagProps = {
  priceMinor: number;
  currency: string;
  className?: string;
};

/**
 * Displays a formatted price (Persian digits via lib/format).
 *
 * The currency unit is intentionally rendered as the neutral ISO code "IRR":
 * rial/toman conversion is a PENDING BUSINESS DECISION, so the UI carries a
 * tooltip explaining that instead of asserting a unit it cannot prove.
 */
export default function PriceTag({ priceMinor, currency, className }: PriceTagProps) {
  const classes = className ? `dv-price ${className}` : "dv-price";
  return (
    <span className={classes} title="واحد پول نهایی نیازمند تصمیم کسب‌وکار است">
      {formatPrice(priceMinor, currency)}
    </span>
  );
}
