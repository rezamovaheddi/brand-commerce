import type { Product } from "@bc/contracts";

interface ProductMediaIllustrationProps {
  product: Product;
  size?: "card" | "pdp";
  className?: string;
}

/**
 * ProductMediaIllustration:
 * Provides category-aware, vector-crisp Warm Clinical Luxury cosmetic packaging
 * visuals with genuine glass gradients, gold accents, and clinical aesthetics.
 * Solves GAP-007 (honest sample product media representation).
 */
export default function ProductMediaIllustration({
  product,
  size = "card",
  className = "",
}: ProductMediaIllustrationProps) {
  const categorySlug = product.category?.slug?.toLowerCase() || "";
  const nameSlug = product.slug.toLowerCase();

  const isSerum = categorySlug.includes("serum") || nameSlug.includes("serum") || nameSlug.includes("vitamin-c");
  const isCream = categorySlug.includes("moisturizer") || categorySlug.includes("cream") || nameSlug.includes("cream");
  const isCleanser = categorySlug.includes("cleanser") || nameSlug.includes("cleanser");

  if (size === "pdp") {
    if (isCream) {
      // Large Luxury Cream Jar for PDP
      return (
        <svg
          viewBox="0 0 280 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-label={product.nameFa}
          style={{ width: "100%", maxHeight: 320 }}
        >
          <defs>
            <linearGradient id="pdpJarGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#875f21" />
              <stop offset="25%" stopColor="#fae6ad" />
              <stop offset="55%" stopColor="#c6933c" />
              <stop offset="85%" stopColor="#7c571c" />
              <stop offset="100%" stopColor="#d8ab4e" />
            </linearGradient>
            <linearGradient id="pdpJarGlass" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#fffdfa" />
              <stop offset="40%" stopColor="#f7efe2" />
              <stop offset="80%" stopColor="#e8d8c2" />
              <stop offset="100%" stopColor="#d3be9f" />
            </linearGradient>
            <radialGradient id="pdpJarGlow" cx="50%" cy="55%" r="45%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#fdf6ec" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Jar Base Shadow */}
          <ellipse cx="140" cy="245" rx="100" ry="14" fill="rgba(45, 30, 15, 0.22)" />
          {/* Jar Body Frosted Glass */}
          <rect x="40" y="86" width="200" height="150" rx="28" fill="url(#pdpJarGlass)" stroke="#ffffff" strokeWidth="2" />
          <ellipse cx="140" cy="165" rx="85" ry="55" fill="url(#pdpJarGlow)" />
          {/* Gloss Edge */}
          <path d="M55 106 C55 96, 65 96, 75 96 L75 220 C65 220, 55 220, 55 210 Z" fill="#ffffff" opacity="0.6" />
          {/* Heavy Luxury Gold Lid */}
          <rect x="48" y="44" width="184" height="42" rx="10" fill="url(#pdpJarGold)" stroke="#f7e0a3" strokeWidth="1.2" />
          <rect x="60" y="52" width="160" height="4" rx="2" fill="#ffffff" opacity="0.45" />
          {/* Clinical Brand Typography */}
          <text x="140" y="152" textAnchor="middle" fill="#5a3d13" fontFamily="Vazirmatn, sans-serif" fontSize="15" fontWeight="800">
            DERMAVIA
          </text>
          <text x="140" y="172" textAnchor="middle" fill="#755220" fontFamily="system-ui, sans-serif" fontSize="9" letterSpacing="2">
            BARRIER REPAIR
          </text>
        </svg>
      );
    }

    if (isCleanser) {
      // Tall Cleanser Pump Bottle for PDP
      return (
        <svg
          viewBox="0 0 240 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-label={product.nameFa}
          style={{ width: "100%", maxHeight: 340 }}
        >
          <defs>
            <linearGradient id="pdpPumpGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#875f21" />
              <stop offset="35%" stopColor="#fae6ad" />
              <stop offset="65%" stopColor="#c6933c" />
              <stop offset="100%" stopColor="#7c571c" />
            </linearGradient>
            <linearGradient id="pdpCleanserBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f9f5ed" />
              <stop offset="100%" stopColor="#eddcc7" />
            </linearGradient>
          </defs>
          {/* Shadow */}
          <ellipse cx="120" cy="326" rx="60" ry="12" fill="rgba(45, 30, 15, 0.2)" />
          {/* Pump Spout */}
          <path d="M100 24 H145 V38 H100 Z" fill="#251a14" />
          <path d="M72 30 H100 V38 H72 Z" fill="#251a14" />
          <rect x="110" y="38" width="20" height="20" fill="url(#pdpPumpGold)" />
          <rect x="96" y="58" width="48" height="14" rx="3" fill="url(#pdpPumpGold)" />
          {/* Cylinder Body */}
          <rect x="68" y="72" width="104" height="248" rx="22" fill="url(#pdpCleanserBody)" stroke="#ffffff" strokeWidth="2" />
          <rect x="80" y="88" width="10" height="216" rx="5" fill="#ffffff" opacity="0.65" />
          {/* Clinical Typography */}
          <text x="120" y="170" textAnchor="middle" fill="#5a3d13" fontFamily="Vazirmatn, sans-serif" fontSize="13" fontWeight="800">
            DERMAVIA
          </text>
          <text x="120" y="190" textAnchor="middle" fill="#755220" fontFamily="system-ui, sans-serif" fontSize="8" letterSpacing="1.5">
            PURIFYING BOTANICAL
          </text>
        </svg>
      );
    }

    // Default: Precision Serum Dropper Bottle for PDP
    return (
      <svg
        viewBox="0 0 240 330"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label={product.nameFa}
        style={{ width: "100%", maxHeight: 330 }}
      >
        <defs>
          <linearGradient id="pdpSerumGlass" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#fff8e7" />
            <stop offset="24%" stopColor="#f5d68d" />
            <stop offset="58%" stopColor="#dfa342" />
            <stop offset="86%" stopColor="#b6731e" />
            <stop offset="100%" stopColor="#f4d485" />
          </linearGradient>
          <linearGradient id="pdpSerumCap" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c571c" />
            <stop offset="30%" stopColor="#fae6ad" />
            <stop offset="60%" stopColor="#c6933c" />
            <stop offset="100%" stopColor="#875f21" />
          </linearGradient>
          <radialGradient id="pdpSerumGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#f4cf82" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#b97214" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="120" cy="306" rx="64" ry="14" fill="rgba(45, 30, 15, 0.22)" />
        {/* Dropper Bulb & Collar */}
        <rect x="94" y="32" width="52" height="42" rx="6" fill="url(#pdpSerumCap)" />
        <rect x="88" y="70" width="64" height="10" rx="3" fill="url(#pdpSerumCap)" />
        {/* Bottle Body */}
        <rect x="62" y="80" width="116" height="216" rx="20" fill="url(#pdpSerumGlass)" stroke="#fffaf0" strokeWidth="1.8" />
        <ellipse cx="120" cy="180" rx="46" ry="72" fill="url(#pdpSerumGlow)" />
        <rect x="74" y="96" width="12" height="184" rx="6" fill="#ffffff" opacity="0.65" />
        {/* Clinical Brand Typography */}
        <text x="120" y="165" textAnchor="middle" fill="#5a3d13" fontFamily="Vazirmatn, sans-serif" fontSize="13" fontWeight="800">
          DERMAVIA
        </text>
        <text x="120" y="184" textAnchor="middle" fill="#6d4f24" fontFamily="system-ui, sans-serif" fontSize="8" letterSpacing="1.5">
          ETHEREAL V6
        </text>
      </svg>
    );
  }

  // Card size (compact for PLP)
  if (isSerum) {
    return (
      <svg width="70" height="130" viewBox="0 0 70 130" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="cardSerumFluid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="cardGoldCap" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <path d="M28 8C28 4.68629 30.6863 2 34 2H36C39.3137 2 42 4.68629 42 8V18H28V8Z" fill="#1c1913" />
        <rect x="25" y="18" width="20" height="12" rx="2" fill="url(#cardGoldCap)" />
        <rect x="15" y="30" width="40" height="90" rx="14" fill="#ffffff" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" />
        <rect x="18" y="55" width="34" height="62" rx="10" fill="url(#cardSerumFluid)" opacity="0.85" />
        <path d="M20 38V112" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      </svg>
    );
  }

  if (isCream) {
    return (
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="cardJarGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="50%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>
        <rect x="15" y="16" width="60" height="14" rx="4" fill="url(#cardJarGold)" />
        <rect x="12" y="30" width="66" height="48" rx="10" fill="#ffffff" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" />
        <rect x="18" y="36" width="54" height="36" rx="6" fill="#fffbeb" opacity="0.9" />
        <path d="M18 36V70" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    );
  }

  // Cleanser or default
  return (
    <svg width="60" height="130" viewBox="0 0 60 130" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="cardPumpGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="50%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <path d="M22 6H38V14H22V6Z" fill="#1c1913" />
      <path d="M12 10H22V14H12V10Z" fill="#1c1913" />
      <rect x="20" y="14" width="20" height="10" fill="url(#cardPumpGold)" />
      <rect x="12" y="24" width="36" height="98" rx="8" fill="#ffffff" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5" />
      <rect x="15" y="44" width="30" height="74" rx="5" fill="#f8fafc" opacity="0.9" />
      <path d="M16 30V114" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
