"use client";

import React from "react";
import {
  CATALOG_CATEGORIES,
  CATALOG_BRANDS,
  SKIN_TYPES,
  SPECIAL_FEATURES,
} from "../../lib/catalogData";
import { formatFaNumber } from "../../lib/format";

interface CatalogSidebarProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  selectedBrands: string[];
  onBrandToggle: (brandId: string) => void;
  selectedSkinTypes: string[];
  onSkinTypeToggle: (skinTypeId: string) => void;
  maxPrice: number;
  onMaxPriceChange: (price: number) => void;
  selectedFeatures: string[];
  onFeatureToggle: (featureId: string) => void;
  onResetFilters: () => void;
}

export default function CatalogSidebar({
  selectedCategory,
  onCategoryChange,
  selectedBrands,
  onBrandToggle,
  selectedSkinTypes,
  onSkinTypeToggle,
  maxPrice,
  onMaxPriceChange,
  selectedFeatures,
  onFeatureToggle,
  onResetFilters: _onResetFilters,
}: CatalogSidebarProps) {
  return (
    <aside className="dv-sidebar-wrap" aria-label="فیلترهای کاتالوگ محصولات">

      {/* 1. Categories Card */}
      <div className="dv-filter-card">
        <div className="dv-filter-header">
          <span className="dv-filter-header-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </span>
          <h2 className="dv-filter-header-title">دسته‌بندی‌ها</h2>
        </div>

        <ul className="dv-filter-cat-list">
          {CATALOG_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <li
                key={cat.id}
                className={`dv-filter-cat-item ${isActive ? "is-active" : ""}`}
                onClick={() => onCategoryChange(isActive ? null : cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCategoryChange(isActive ? null : cat.id);
                  }
                }}
              >
                <span>{cat.nameFa}</span>
                <span className="dv-filter-cat-badge">
                  {formatFaNumber(cat.count)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 2. Brands Card */}
      <div className="dv-filter-card">
        <div className="dv-filter-header">
          <span className="dv-filter-header-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <h2 className="dv-filter-header-title">برندها</h2>
        </div>

        <div className="dv-checkbox-list">
          {CATALOG_BRANDS.map((brand) => {
            const isChecked = selectedBrands.includes(brand.id);
            return (
              <label
                key={brand.id}
                className={`dv-checkbox-row ${isChecked ? "is-checked" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  onBrandToggle(brand.id);
                }}
              >
                <span className="dv-checkbox-custom" aria-hidden="true">
                  {isChecked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span>{brand.nameFa}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Skin Type Card */}
      <div className="dv-filter-card">
        <div className="dv-filter-header">
          <span className="dv-filter-header-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </span>
          <h2 className="dv-filter-header-title">نوع پوست</h2>
        </div>

        <div className="dv-skin-types-grid">
          {SKIN_TYPES.map((st) => {
            const isActive = selectedSkinTypes.includes(st.id);
            return (
              <button
                key={st.id}
                type="button"
                className={`dv-skin-pill ${isActive ? "is-active" : ""}`}
                onClick={() => onSkinTypeToggle(st.id)}
              >
                {st.nameFa}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Price Range Card */}
      <div className="dv-filter-card">
        <div className="dv-filter-header">
          <span className="dv-filter-header-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <h2 className="dv-filter-header-title">محدوده قیمت</h2>
        </div>

        <div className="dv-price-slider-wrap">
          <div className="dv-slider-track">
            <div
              className="dv-slider-progress"
              style={{
                width: `${Math.min(100, Math.max(0, (maxPrice / 5000000) * 100))}%`,
                right: 0,
              }}
            />
          </div>

          <input
            type="range"
            min={200000}
            max={5000000}
            step={50000}
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(Number(e.target.value))}
            className="dv-slider-input"
            aria-label="حداکثر قیمت"
          />

          <div className="dv-price-labels">
            <span>۰ تومان</span>
            <span>{formatFaNumber(maxPrice)} تومان</span>
          </div>
        </div>
      </div>

      {/* 5. Special Features Card */}
      <div className="dv-filter-card">
        <div className="dv-filter-header">
          <span className="dv-filter-header-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </span>
          <h2 className="dv-filter-header-title">ویژگی‌های خاص</h2>
        </div>

        <div className="dv-checkbox-list">
          {SPECIAL_FEATURES.map((feat) => {
            const isChecked = selectedFeatures.includes(feat.id);
            return (
              <label
                key={feat.id}
                className={`dv-checkbox-row ${isChecked ? "is-checked" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  onFeatureToggle(feat.id);
                }}
              >
                <span className="dv-checkbox-custom" aria-hidden="true">
                  {isChecked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span>{feat.nameFa}</span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
