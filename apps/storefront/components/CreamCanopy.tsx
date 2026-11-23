import React from "react";

/**
 * 3D Cream Drip Canopy
 * Figma exact dripping milk canopy with natural specular gloss and micro-droplets.
 * Hardware accelerated and pointer-events: none.
 */
export default function CreamCanopy() {
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
        height: "clamp(180px, 24vw, 320px)",
        pointerEvents: "none",
        zIndex: 5,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundImage: "url('/images/cream_canopy.svg')",
          backgroundRepeat: "repeat-x",
          backgroundPosition: "top center",
          backgroundSize: "contain",
          filter: "drop-shadow(0 14px 24px rgba(182, 162, 138, 0.22))",
        }}
      />
    </div>
  );
}
