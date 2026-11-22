"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart/CartProvider";
import { formatFaNumber } from "../lib/format";

interface HeaderProps {
  onOpenConsultation?: () => void;
}

export default function Header({ onOpenConsultation }: HeaderProps) {
  const pathname = usePathname();
  const { count, status, openDrawer } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; nameFa: string; slug: string; categoryName?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live search debounced fetch
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/backend/products?q=${encodeURIComponent(q)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.items || []);
          setIsSearchOpen(true);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navLinks = [
    { href: "/", label: "خانه" },
    { href: "/products", label: "محصولات" },
    { href: "/loyalty", label: "باشگاه مشتریان" },
    { href: "/magazine", label: "مجله" },
    { href: "/about", label: "درباره ما" },
    { href: "/support", label: "پشتیبانی" },
    { href: "/contact", label: "تماس" },
  ];

  return (
    <>
      <header className="site-header" id="top">
        <nav className="nav-capsule" aria-label="ناوبری اصلی درماویا">
          {/* Start: Cart button & Brand logo */}
          <div className="nav-start">
            <button
              type="button"
              className="cart-nav-btn"
              onClick={openDrawer}
              aria-label={`مشاهده سبد خرید لوکس (${formatFaNumber(count)} مورد)`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
                <path d="M2 3h3l2.4 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.5L22 7H6" />
              </svg>
              <span className="badge-count dv-num">
                {status === "loading" ? "…" : formatFaNumber(count)}
              </span>
            </button>

            <Link href="/" className="brand-mark" aria-label="صفحه اصلی درماویا">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="28" height="28">
                <circle cx="18" cy="18" r="16" stroke="#7d5618" strokeWidth="1.6" />
                <path d="M18 6 C22 13 27 17.5 27 22.5 A9 9 0 1 1 9 22.5 C9 17.5 14 13 18 6 Z" fill="url(#brandGoldGrad)" />
                <defs>
                  <linearGradient id="brandGoldGrad" x1="9" y1="6" x2="27" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#e5c174" />
                    <stop offset="1" stopColor="#855e1c" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="brand-text">درماویا</span>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <ul className="nav-links">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`nav-link ${isActive ? "is-active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            {onOpenConsultation && (
              <li>
                <button
                  type="button"
                  className="nav-link nav-consult-btn"
                  onClick={onOpenConsultation}
                >
                  مشاوره پوست
                </button>
              </li>
            )}
          </ul>

          {/* End: Live Search & Mobile Toggle */}
          <div className="nav-end">
            <div className="search-box" ref={searchBoxRef}>
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                className="search-input"
                placeholder="جست‌وجوی محصول..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setIsSearchOpen(true); }}
                aria-label="جست‌وجو در محصولات درماویا"
                autoComplete="off"
              />

              {/* Instant Search Results Dropdown */}
              {isSearchOpen && (
                <div className="search-results-box" role="listbox">
                  {isSearching ? (
                    <div className="search-loading">در حال جست‌وجو...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="search-empty">نتیجه‌ای یافت نشد.</div>
                  ) : (
                    searchResults.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.slug}`}
                        className="search-result-item"
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                      >
                        <span className="search-result-title">{item.nameFa}</span>
                        {item.categoryName && <span className="search-result-cat">{item.categoryName}</span>}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="باز کردن منوی موبایل"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span className="brand-text">منوی درماویا</span>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="بستن منو"
              >
                ✕
              </button>
            </div>

            <div className="mobile-menu-links">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="mobile-nav-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {onOpenConsultation && (
                <button
                  type="button"
                  className="mobile-nav-item consult-item"
                  onClick={() => { setIsMobileMenuOpen(false); onOpenConsultation(); }}
                >
                  ✨ مشاوره تخصصی پوست
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
