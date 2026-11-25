"use client";

import React from "react";
import { formatFaNumber } from "../../lib/format";
import { SORT_OPTIONS } from "../../lib/catalogData";

interface CatalogHeaderBarProps {
  title: string;
  totalCount: number;
  activeSort: string;
  onSortChange: (sortId: string) => void;
  onOpenMobileFilters?: () => void;
}

export default function CatalogHeaderBar({
  title,
  totalCount,
  activeSort,
  onSortChange,
  onOpenMobileFilters,
}: CatalogHeaderBarProps) {
  return (
    <div className="dv-catalog-header-card">
      {/* Top / Main Row (Title + Count + Mobile Filter Button) */}
      <div className="dv-catalog-header-main-row">
        <div className="dv-catalog-title-wrap">
          <h1 className="dv-catalog-title">{title}</h1>
          <span className="dv-catalog-count">
            (نمایش {formatFaNumber(totalCount)} محصول)
          </span>
        </div>

        {/* Mobile Filter Trigger Button */}
        {onOpenMobileFilters && (
          <button
            type="button"
            className="dv-mobile-filter-trigger"
            onClick={onOpenMobileFilters}
            aria-label="مشاهده و اعمال فیلترها"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span>فیلترها</span>
          </button>
        )}
      </div>

      {/* Sort Pills Row / Scrollable on mobile */}
      <div className="dv-sort-wrapper">
        <div className="dv-sort-bar" role="tablist" aria-label="مرتب‌سازی محصولات">
          {SORT_OPTIONS.map((opt) => {
            const isActive = activeSort === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`dv-sort-btn ${isActive ? "is-active" : ""}`}
                onClick={() => onSortChange(opt.id)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
