"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useCanopy } from "./CanopyContext";

interface CanopyVariant {
  id: string;
  src: string;
  shadow: string;
  heightClamp: string;
}

const CANOPY_VARIANTS: CanopyVariant[] = [
  {
    id: "tube-cream",
    src: "/images/canopy_tube.svg",
    shadow: "drop-shadow(0 14px 24px rgba(182, 162, 138, 0.22))",
    heightClamp: "clamp(200px, 26vw, 360px)",
  },
  {
    id: "pump-foam",
    src: "/images/canopy_pump.svg",
    shadow: "drop-shadow(0 14px 24px rgba(160, 190, 215, 0.28))",
    heightClamp: "clamp(200px, 26vw, 360px)",
  },
  {
    id: "jar-lotion",
    src: "/images/canopy_jar.svg",
    shadow: "drop-shadow(0 14px 24px rgba(195, 175, 160, 0.25))",
    heightClamp: "clamp(200px, 26vw, 360px)",
  },
  {
    id: "dropper-gold",
    src: "/images/canopy_dropper.svg",
    shadow: "drop-shadow(0 14px 28px rgba(215, 165, 80, 0.32))",
    heightClamp: "clamp(200px, 26vw, 360px)",
  },
];

/**
 * Dynamic 3D Cream/Foam/Oil Drip Canopy
 * Changes smoothly according to the active product variant selected in the Hero section.
 * Hardware accelerated and pointer-events: none.
 */
export default function CreamCanopy() {
  const pathname = usePathname();
  const { canopyIndex } = useCanopy();
  if (pathname !== "/") return null;
  const activeIdx = Math.max(0, Math.min(CANOPY_VARIANTS.length - 1, canopyIndex));

  return (
    <div
      className="cream-drip-canopy"
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: "clamp(200px, 26vw, 360px)",
        pointerEvents: "none",
        zIndex: 5,
        overflow: "hidden",
      }}
    >
      {CANOPY_VARIANTS.map((variant, idx) => {
        const isCurrent = idx === activeIdx;
        return (
          <div
            key={variant.id}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `url('${variant.src}')`,
              backgroundRepeat: "repeat-x",
              backgroundPosition: "top center",
              backgroundSize: "contain",
              filter: variant.shadow,
              opacity: isCurrent ? 1 : 0,
              transform: isCurrent ? "translateY(0)" : "translateY(-8px)",
              transition: "opacity 0.45s ease-in-out, transform 0.45s ease-in-out",
            }}
          />
        );
      })}
    </div>
  );
}
