"use client";

import React from "react";
import { formatFaNumber } from "../../lib/format";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  // Build page numbers array with ellipsis if many pages
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, "ellipsis", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <nav className="dv-catalog-pagination" aria-label="صفحه‌بندی محصولات">
      {/* Right Arrow (Previous in RTL) */}
      <button
        type="button"
        className="dv-pager-btn"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="صفحه قبلی"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Page Numbers */}
      {pages.map((p, index) => {
        if (p === "ellipsis") {
          return (
            <span key={`ellipsis-${index}`} className="dv-pager-ellipsis">
              …
            </span>
          );
        }

        const pageNum = Number(p);
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            type="button"
            className={`dv-pager-btn ${isActive ? "is-active" : ""}`}
            onClick={() => onPageChange(pageNum)}
            aria-current={isActive ? "page" : undefined}
          >
            {formatFaNumber(pageNum)}
          </button>
        );
      })}

      {/* Left Arrow (Next in RTL) */}
      <button
        type="button"
        className="dv-pager-btn"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="صفحه بعدی"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </nav>
  );
}
