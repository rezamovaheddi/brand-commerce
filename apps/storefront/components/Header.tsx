"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart/CartProvider";
import { formatFaNumber } from "../lib/format";
import DermalightLogo from "./DermalightLogo";

interface HeaderProps {
  onOpenConsultation?: () => void;
}

export default function Header({ onOpenConsultation: _onOpenConsultation }: HeaderProps) {
  const pathname = usePathname();
  const { count, status, openDrawer } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; nameFa: string; slug: string; categoryName?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Scroll listener for dynamic liquid blur & shadow elevation
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 15);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { href: "/products", label: "کاتالوگ محصولات" },
    { href: "/products?category=serums", label: "سرم‌های درمانی" },
    { href: "/products?category=moisturizers", label: "کرم و مرطوب‌کننده" },
    { href: "/magazine", label: "مجله سلامت و پوست" },
    { href: "/about", label: "درباره درماویا" },
  ];

  return (
    <>
      {/* Floating Outer Wrapper (Centered detached navigation bar) */}
      <header
        className="dermalight-header-floating-wrap"
        id="top"
        style={{
          position: "fixed",
          top: "clamp(12px, 2vw, 22px)",
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "center",
          padding: "0 clamp(16px, 3vw, 36px)",
          pointerEvents: "none",
        }}
      >
        {/* Floating Liquid Glassmorphism Capsule Navbar */}
        <div className={`dermalight-liquid-navbar ${isScrolled ? "is-scrolled" : ""}`}>
          {/* 1. Right side in RTL: Brand Logo & Mobile Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="dermalight-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="باز کردن منوی موبایل"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34254D" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <DermalightLogo size="md" />
          </div>

          {/* 2. Center: Navigation Links with Liquid Pill Indicator (Desktop only) */}
          <nav
            className="dermalight-nav-links"
            aria-label="منوی اصلی"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`dermalight-nav-link ${isActive ? "is-active" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* 3. Left side in RTL: Action Icons (Search, Profile, Wishlist, Cart) */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Live Search Icon Button */}
            <div ref={searchBoxRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="dermalight-glass-btn"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="جستجوی محصولات"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {/* Search Dropdown */}
              {isSearchOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 14px)",
                    left: 0,
                    width: 320,
                    background: "rgba(255, 255, 255, 0.88)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    borderRadius: 20,
                    boxShadow: "0 20px 48px rgba(118, 62, 117, 0.16)",
                    border: "1px solid rgba(255, 255, 255, 0.8)",
                    padding: 14,
                    zIndex: 200,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="نام محصول، برند یا ماده مؤثر..."
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1px solid #CBD5E1",
                        fontSize: "0.88rem",
                        outline: "none",
                        fontFamily: "inherit",
                        background: "#FFFFFF",
                      }}
                    />
                  </div>
                  {isSearching && (
                    <div style={{ padding: "12px 6px", fontSize: "0.82rem", color: "#64748B", textAlign: "center" }}>
                      در حال جستجو...
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
                      {searchResults.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={`/products/${item.slug}`}
                            onClick={() => setIsSearchOpen(false)}
                            style={{
                              display: "block",
                              padding: "9px 12px",
                              borderRadius: 10,
                              fontSize: "0.88rem",
                              color: "#1E293B",
                              textDecoration: "none",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {item.nameFa}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Profile / Account Icon */}
            <Link
              href="/account"
              className="dermalight-glass-btn dermalight-hide-mobile"
              aria-label="حساب کاربری"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            {/* Wishlist / Heart Icon with active indicator */}
            <Link
              href="/account#wishlist"
              className="dermalight-glass-btn dermalight-hide-mobile"
              aria-label="لیست علاقه‌مندی‌ها"
              style={{ position: "relative" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span
                style={{
                  position: "absolute",
                  top: 9,
                  right: 9,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#763E75",
                }}
              />
            </Link>

            {/* Luxury Cart Drawer Trigger Button Capsule */}
            <button
              type="button"
              onClick={openDrawer}
              className="dermalight-cart-pill"
              aria-label={`مشاهده سبد خرید (${formatFaNumber(count)} مورد)`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span style={{ minWidth: 16, textAlign: "center" }}>
                {status === "loading" ? "…" : formatFaNumber(count)}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            style={{
              pointerEvents: "auto",
              position: "fixed",
              top: 76,
              left: 20,
              right: 20,
              padding: "20px 24px",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(24px)",
              borderRadius: 24,
              boxShadow: "0 24px 60px rgba(26, 34, 84, 0.18)",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              zIndex: 101,
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#1A2254",
                  padding: "10px 14px",
                  borderRadius: 12,
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
