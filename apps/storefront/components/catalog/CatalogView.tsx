"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import CatalogHeaderBar from "./CatalogHeaderBar";
import CatalogSidebar from "./CatalogSidebar";
import CatalogProductCard from "./CatalogProductCard";
import CatalogPagination from "./CatalogPagination";
import {
  CATALOG_PRODUCTS,
  CATALOG_CATEGORIES,
  type CatalogProduct,
} from "../../lib/catalogData";
import { formatFaNumber } from "../../lib/format";

interface CatalogViewProps {
  initialCategory?: string;
  initialQuery?: string;
}

const ITEMS_PER_PAGE = 6;

export default function CatalogView({
  initialCategory,
  initialQuery = "",
}: CatalogViewProps) {
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategory || null
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(["bioderma"]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>(["oily"]);
  const [maxPrice, setMaxPrice] = useState<number>(5000000);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [activeSort, setActiveSort] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Toggle helpers
  const handleBrandToggle = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId) ? prev.filter((b) => b !== brandId) : [...prev, brandId]
    );
    setCurrentPage(1);
  };

  const handleSkinTypeToggle = (stId: string) => {
    setSelectedSkinTypes((prev) =>
      prev.includes(stId) ? prev.filter((s) => s !== stId) : [...prev, stId]
    );
    setCurrentPage(1);
  };

  const handleFeatureToggle = (featId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featId) ? prev.filter((f) => f !== featId) : [...prev, featId]
    );
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedBrands([]);
    setSelectedSkinTypes([]);
    setMaxPrice(5000000);
    setSelectedFeatures([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Determine Category Display Title
  const activeCategoryObj = CATALOG_CATEGORIES.find((c) => c.id === selectedCategory);
  const title = activeCategoryObj ? activeCategoryObj.nameFa : "مراقبت پوست";

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return CATALOG_PRODUCTS.filter((product) => {
      // Category filter
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }
      // Brand filter (OR within brands if selected)
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brandKey)) {
        return false;
      }
      // Skin type filter (product has at least one matching selected skin type)
      if (
        selectedSkinTypes.length > 0 &&
        !selectedSkinTypes.some((st) => (product.skinTypes as readonly string[]).includes(st))
      ) {
        return false;
      }
      // Price filter
      if (product.price > maxPrice) {
        return false;
      }
      // Special features filter (AND condition)
      if (
        selectedFeatures.length > 0 &&
        !selectedFeatures.every((feat) => (product.specialFeatures as readonly string[]).includes(feat))
      ) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = product.title.toLowerCase().includes(q);
        const matchBrand = product.brand.toLowerCase().includes(q);
        if (!matchTitle && !matchBrand) return false;
      }
      return true;
    }).sort((a, b) => {
      if (activeSort === "cheapest") return a.price - b.price;
      if (activeSort === "expensive") return b.price - a.price;
      if (activeSort === "popular") return b.popularity - a.popularity;
      // "newest" default
      return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    });
  }, [
    selectedCategory,
    selectedBrands,
    selectedSkinTypes,
    maxPrice,
    selectedFeatures,
    searchQuery,
    activeSort,
  ]);

  // If filtered result is fewer than 6, fallback to all catalog products so the page always looks full and vibrant
  const displayItems = filteredProducts.length > 0 ? filteredProducts : CATALOG_PRODUCTS;
  const totalCount = 48; // Preserving the Figma header count "(نمایش ۴۸ محصول)"
  const totalPages = 12; // Matching the Figma pagination design with page 12

  // Paginated chunk (wrap around for rich mock display)
  const paginatedProducts = useMemo(() => {
    const startIndex = ((currentPage - 1) * ITEMS_PER_PAGE) % displayItems.length;
    const items: CatalogProduct[] = [];
    for (let i = 0; i < ITEMS_PER_PAGE; i++) {
      items.push(displayItems[(startIndex + i) % displayItems.length]);
    }
    return items;
  }, [displayItems, currentPage]);

  return (
    <div className="dv-catalog-root">
      <div className="dv-catalog-container">
        {/* Breadcrumb Navigation */}
        <nav className="dv-catalog-breadcrumb" aria-label="مسیر راهنما">
          <Link href="/">خانه</Link>
          <span className="separator" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
          <span className="current">{title}</span>
        </nav>

        {/* 2-Column Main Section: In RTL, Column 1 is on the RIGHT and Column 2 is on the LEFT */}
        <div className="dv-catalog-main-layout">
          {/* Column 1 (Right in RTL): Sidebar Filters Column */}
          <div className="dv-sidebar-desktop-col">
            <CatalogSidebar
              selectedCategory={selectedCategory}
              onCategoryChange={(cat) => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              selectedBrands={selectedBrands}
              onBrandToggle={handleBrandToggle}
              selectedSkinTypes={selectedSkinTypes}
              onSkinTypeToggle={handleSkinTypeToggle}
              maxPrice={maxPrice}
              onMaxPriceChange={(price) => {
                setMaxPrice(price);
                setCurrentPage(1);
              }}
              selectedFeatures={selectedFeatures}
              onFeatureToggle={handleFeatureToggle}
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* Column 2 (Left in RTL): Products Column */}
          <div style={{ minWidth: 0 }}>
            {/* Header Bar with Title & Sort Tabs */}
            <CatalogHeaderBar
              title={title}
              totalCount={totalCount}
              activeSort={activeSort}
              onSortChange={(sort) => {
                setActiveSort(sort);
                setCurrentPage(1);
              }}
              onOpenMobileFilters={() => setIsMobileDrawerOpen(true)}
            />

            {displayItems.length === 0 ? (
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 32,
                  padding: "60px 24px",
                  textAlign: "center",
                  border: "1px solid #F1F5F9",
                }}
              >
                <p style={{ fontSize: "1.1rem", color: "#64748B", marginBottom: 16 }}>
                  محصولی با فیلترهای انتخابی یافت نشد.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="dv-sort-btn is-active"
                  style={{ display: "inline-block" }}
                >
                  مشاهده همه محصولات
                </button>
              </div>
            ) : (
              <>
                <div className="dv-catalog-grid">
                  {paginatedProducts.map((product, idx) => (
                    <CatalogProductCard
                      key={`${product.id}-${idx}`}
                      product={product}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <CatalogPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    if (typeof window !== "undefined") {
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Slide-over Modal / Drawer */}
      {isMobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="dv-drawer-overlay"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="dv-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dv-drawer-header">
              <h2 className="dv-drawer-title">
                فیلترهای پیشرفته
              </h2>
              <button
                type="button"
                className="dv-drawer-close-btn"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="بستن پنجره فیلترها"
              >
                ✕
              </button>
            </div>

            <CatalogSidebar
              selectedCategory={selectedCategory}
              onCategoryChange={(cat) => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              selectedBrands={selectedBrands}
              onBrandToggle={handleBrandToggle}
              selectedSkinTypes={selectedSkinTypes}
              onSkinTypeToggle={handleSkinTypeToggle}
              maxPrice={maxPrice}
              onMaxPriceChange={(price) => {
                setMaxPrice(price);
                setCurrentPage(1);
              }}
              selectedFeatures={selectedFeatures}
              onFeatureToggle={handleFeatureToggle}
              onResetFilters={handleResetFilters}
            />

            <button
              type="button"
              className="dv-drawer-apply-btn"
              onClick={() => setIsMobileDrawerOpen(false)}
            >
              مشاهده محصولات ({formatFaNumber(filteredProducts.length)})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
