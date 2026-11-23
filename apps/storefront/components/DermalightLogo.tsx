import React from "react";
import Link from "next/link";

interface DermalightLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
  className?: string;
}

export default function DermalightLogo({
  size = "md",
  variant = "full",
  className = "",
}: DermalightLogoProps) {
  const iconSize = size === "sm" ? 32 : size === "lg" ? 48 : 38;
  const textSize = size === "sm" ? "1.2rem" : size === "lg" ? "1.65rem" : "1.4rem";

  return (
    <Link
      href="/"
      className={`dermalight-logo-wrap ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        textDecoration: "none",
      }}
      aria-label="صفحه اصلی درمالایت"
    >
      {/* Luminous Brand Icon */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6533B8 0%, #4D2196 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(82, 39, 155, 0.28)",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <svg
          width={iconSize * 0.65}
          height={iconSize * 0.65}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 4-pointed sparkle star */}
          <path
            d="M12 2C12.4 7.2 16.8 11.6 22 12C16.8 12.4 12.4 16.8 12 22C11.6 16.8 7.2 12.4 2 12C7.2 11.6 11.6 7.2 12 2Z"
            fill="#FFFFFF"
          />
          {/* Micro accent dot */}
          <circle cx="5" cy="18" r="1.5" fill="#FFFFFF" opacity="0.9" />
          <path
            d="M18 5L19 7L21 8L19 9L18 11L17 9L15 8L17 7L18 5Z"
            fill="#FFFFFF"
            opacity="0.9"
          />
        </svg>
      </div>

      {variant === "full" && (
        <span
          style={{
            fontSize: textSize,
            fontWeight: 800,
            color: "#1A2254",
            letterSpacing: "-0.03em",
            fontFamily: "var(--font-vazir), Vazirmatn, sans-serif",
          }}
        >
          درمالایت
        </span>
      )}
    </Link>
  );
}
