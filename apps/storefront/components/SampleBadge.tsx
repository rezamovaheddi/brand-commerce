type SampleBadgeProps = {
  className?: string;
};

/**
 * Marks seed/sample data so users never mistake demo content for real
 * catalog data (a hard rule of the V6 identity).
 */
export default function SampleBadge({ className }: SampleBadgeProps) {
  const classes = className ? `dv-badge ${className}` : "dv-badge";
  return (
    <span
      className={classes}
      title="این داده از مجموعهٔ اولیه (seed) آمده است و دادهٔ واقعی فروشگاه نیست"
    >
      داده نمونه
    </span>
  );
}
