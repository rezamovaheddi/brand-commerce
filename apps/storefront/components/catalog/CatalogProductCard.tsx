"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CatalogProduct } from "../../lib/catalogData";
import { formatFaNumber } from "../../lib/format";
import { useCart } from "../cart/CartProvider";

interface CatalogProductCardProps {
  product: CatalogProduct;
}

export default function CatalogProductCard({ product }: CatalogProductCardProps) {
  const { add, openDrawer } = useCart();
  const [isWishlist, setIsWishlist] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      await add(product.id, 1);
      openDrawer();
    } catch {
      // If server cart fails, open drawer to show honest fallback
      openDrawer();
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlist((prev) => !prev);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.origin + `/products/${product.slug}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="dv-card-figma">
      {/* Product Image Area */}
      <div className="dv-card-img-box">
        {/* Badges on top-right */}
        <div className="dv-floating-badges">
          {product.badge?.type === "new" && (
            <span className="dv-badge-new">{product.badge.text}</span>
          )}
          {product.badge?.type === "discount" && (
            <span className="dv-badge-discount">{product.badge.text}</span>
          )}
        </div>

        {/* Action buttons on top-left (Wishlist & Share) */}
        <div className="dv-floating-actions">
          <button
            type="button"
            className={`dv-circle-btn ${isWishlist ? "is-active" : ""}`}
            onClick={handleToggleWishlist}
            aria-label="افزودن به لیست علاقه‌مندی‌ها"
            title="افزودن به علاقه‌مندی‌ها"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlist ? "#EF4444" : "none"} stroke={isWishlist ? "#EF4444" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>

          {product.hasShare && (
            <button
              type="button"
              className="dv-circle-btn"
              onClick={handleShare}
              aria-label="اشتراک‌گذاری محصول"
              title={copiedShare ? "لینک کپی شد!" : "اشتراک‌گذاری"}
            >
              {copiedShare ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Product Media */}
        <Link href={`/products/${product.slug}`} style={{ width: "100%", height: "100%", display: "block" }}>
          <Image
            src={product.image}
            alt={product.title}
            width={320}
            height={320}
            className="dv-card-img"
            priority={product.id === "p-1"}
          />
        </Link>
      </div>

      {/* Product Body Information */}
      <div className="dv-card-body">
        <span className="dv-card-brand">{product.brand}</span>
        <h3 className="dv-card-title">
          <Link href={`/products/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
            {product.title}
          </Link>
        </h3>

        {/* Footer: Price on right, Cart button on left */}
        <div className="dv-card-footer">
          <div className="dv-card-price-wrap">
            {product.oldPrice ? (
              <span className="dv-card-old-price">
                {formatFaNumber(product.oldPrice)}
              </span>
            ) : null}
            <div className="dv-card-current-price">
              <span>{formatFaNumber(product.price)}</span>
              <span className="unit">{product.currency}</span>
            </div>
          </div>

          <button
            type="button"
            className="dv-card-cart-btn"
            onClick={handleAddToCart}
            aria-label={`افزودن ${product.title} به سبد خرید`}
            title="افزودن به سبد خرید"
            disabled={isAdding}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
