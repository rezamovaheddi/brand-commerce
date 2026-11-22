"use client";

import { useState } from "react";
import { useCart } from "./cart/CartProvider";
import { formatFaNumber } from "../lib/format";

interface FloatingDockProps {
  onOpenConsultation: () => void;
}

export default function FloatingDock({ onOpenConsultation }: FloatingDockProps) {
  const { openDrawer, count } = useCart();
  const [isMuted, setIsMuted] = useState(true);

  // Play a soft luxury ambient pentatonic chime with Web Audio API (zero asset download)
  const playLuxuryChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Pentatonic chord: F#4, A#4, C#5, F5
      const freqs = [369.99, 466.16, 554.37, 698.46];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.3);
      });
      setIsMuted(false);
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <aside className="floating-dock" aria-label="دسترسی سریع">
      {/* 1. Cart Drawer Button */}
      <button
        type="button"
        className="dock-btn"
        onClick={openDrawer}
        aria-label="مشاهده سبد خرید لوکس"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M2 3h3l2.4 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.5L22 7H6" />
        </svg>
        {count > 0 && <span className="dock-badge dv-num">{formatFaNumber(count)}</span>}
        <span className="dock-tooltip">سبد خرید</span>
      </button>

      {/* 2. Skin Consultation */}
      <button
        type="button"
        className="dock-btn"
        onClick={onOpenConsultation}
        aria-label="مشاوره تخصصی پوست"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z" />
        </svg>
        <span className="dock-tooltip">مشاوره پوست</span>
      </button>

      {/* 3. Luxury Ambient Sound */}
      <button
        type="button"
        className={`dock-btn ${!isMuted ? "is-active" : ""}`}
        onClick={playLuxuryChime}
        aria-label={isMuted ? "پخش نوای لوکس درماویا" : "نوای درماویا فعال است"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
        <span className="dock-tooltip">نوای اثیری</span>
      </button>

      {/* 4. Scroll to Top */}
      <button
        type="button"
        className="dock-btn"
        onClick={scrollToTop}
        aria-label="رفتن به بالای صفحه"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
        <span className="dock-tooltip">بالای صفحه</span>
      </button>
    </aside>
  );
}
