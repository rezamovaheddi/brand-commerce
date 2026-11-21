type LeafMarkProps = {
  size?: number;
  className?: string;
};

/**
 * Decorative DERMAVIA leaf accent (gold) from the V6 identity.
 * Purely visual — hidden from assistive technology.
 */
export default function LeafMark({ size = 20, className }: LeafMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Leaf body */}
      <path
        d="M20 4C10.6 4.5 4.5 10.6 4 20c9.4-.5 15.5-6.6 16-16Z"
        fill="var(--dv-gold-light)"
      />
      {/* Vein */}
      <path
        d="M4 20C8.6 14.4 13.6 9.4 20 4"
        stroke="var(--dv-gold)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
