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
    { href: "/products", label: "کاتالوگ محصولات" },
    { href: "/products?category=serums", label: "سرم‌های درمانی" },
    { href: "/products?category=moisturizers", label: "کرم و مرطوب‌کننده" },
    { href: "/b2b/rfq", label: "سفارش عمده و B2B" },
    { href: "/magazine", label: "مجله سلامت و پوست" },
    { href: "/about", label: "درباره درماویا" },
  ];

  return (
    <>
      <header
        className="dermalight-header"
        id="top"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.7)",
          transition: "all 0.25s ease",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* 1. Right: Brand Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="باز کردن منوی موبایل"
              style={{
                display: "none",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A2254" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <DermalightLogo size="md" />
          </div>

          {/* 2. Center: Navigation Links */}
          <nav
            className="dermalight-nav-links"
            aria-label="منوی اصلی"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
            }}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#52279B" : "#1A2254",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                    position: "relative",
                    paddingBlock: "4px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#52279B")}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#1A2254";
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: -4,
                        right: 0,
                        left: 0,
                        height: 2,
                        backgroundColor: "#52279B",
                        borderRadius: 2,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 3. Left: Action Icons (Search, Profile, Wishlist, Cart) */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Live Search Icon Button */}
            <div ref={searchBoxRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="جستجوی محصولات"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1A2254",
                  background: isSearchOpen ? "rgba(82, 39, 155, 0.08)" : "transparent",
                  transition: "background 0.2s",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {/* Search Dropdown */}
              {isSearchOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    left: 0,
                    width: 320,
                    background: "#FFFFFF",
                    borderRadius: 16,
                    boxShadow: "0 18px 45px rgba(26, 34, 84, 0.16)",
                    border: "1px solid #E2E8F0",
                    padding: 12,
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
                        borderRadius: 10,
                        border: "1px solid #CBD5E1",
                        fontSize: "0.88rem",
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                  {isSearching && (
                    <div style={{ padding: "12px 6px", fontSize: "0.82rem", color: "#64748B", textAlign: "center" }}>
                      در حال جستجو...
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
                      {searchResults.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={`/products/${item.slug}`}
                            onClick={() => setIsSearchOpen(false)}
                            style={{
                              display: "block",
                              padding: "8px 10px",
                              borderRadius: 8,
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
              aria-label="حساب کاربری"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1A2254",
                textDecoration: "none",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            {/* Wishlist / Heart Icon with active indicator */}
            <Link
              href="/account#wishlist"
              aria-label="لیست علاقه‌مندی‌ها"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1A2254",
                position: "relative",
                textDecoration: "none",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {/* Cyan active dot matching Figma */}
              <span
                style={{
                  position: "absolute",
                  top: 9,
                  right: 9,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#0284C7",
                }}
              />
            </Link>

            {/* Luxury Cart Drawer Trigger Button */}
            <button
              type="button"
              onClick={openDrawer}
              aria-label={`مشاهده سبد خرید (${formatFaNumber(count)} مورد)`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 9999,
                background: "linear-gradient(135deg, #F3EEFB 0%, #EDE5FA 100%)",
                border: "1px solid #D8C5F2",
                color: "#52279B",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#52279B";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #F3EEFB 0%, #EDE5FA 100%)";
                e.currentTarget.style.color = "#52279B";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              padding: "16px 24px 24px",
              background: "#FFFFFF",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: 12,
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
                  padding: "8px 0",
                  textDecoration: "none",
                }}
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
