"use client";

import { useEffect, useRef } from "react";

/**
 * 2D Canvas Stardust Particle Engine (بوم ذرات ستاره‌ای و رشته‌های نور طلایی)
 * Detached canvas sprites, physics-based floating particles, zero DOM lag,
 * respects prefers-reduced-motion.
 */
export default function StardustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let rafId: number | null = null;
    let tick = 0;

    // Pre-rendered sprite textures in detached memory canvases
    const specs = [
      { size: 28, inner: "rgba(255, 251, 236, 0.95)", outer: "rgba(255, 232, 168, 0)" },
      { size: 42, inner: "rgba(246, 214, 134, 0.75)", outer: "rgba(246, 214, 134, 0)" },
      { size: 18, inner: "rgba(255, 240, 200, 0.85)", outer: "rgba(200, 160, 90, 0)" },
    ];

    const sprites = specs.map((s) => {
      const c = document.createElement("canvas");
      c.width = s.size;
      c.height = s.size;
      const g = c.getContext("2d");
      if (g) {
        const half = s.size / 2;
        const grad = g.createRadialGradient(half, half, 0, half, half, half);
        grad.addColorStop(0, s.inner);
        grad.addColorStop(0.35, s.inner.replace(/[\d.]+\)$/, "0.45)"));
        grad.addColorStop(1, s.outer);
        g.fillStyle = grad;
        g.beginPath();
        g.arc(half, half, half, 0, Math.PI * 2);
        g.fill();
      }
      return c;
    });

    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 22 : 45;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      spriteIdx: number;
      scale: number;
      baseAlpha: number;
      phase: number;
      pulseSpeed: number;
    }

    let particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: -0.15 - Math.random() * 0.35,
          spriteIdx: Math.floor(Math.random() * sprites.length),
          scale: 0.4 + Math.random() * 0.7,
          baseAlpha: 0.25 + Math.random() * 0.65,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.03,
        });
      }
    }

    function loop() {
      if (!ctx) return;
      tick++;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + Math.sin(tick * 0.01 + p.phase) * 0.15;
        p.y += p.vy;

        // Wrap edges
        if (p.y < -50) p.y = height + 40;
        if (p.x < -40) p.x = width + 30;
        if (p.x > width + 40) p.x = -30;

        const pulse = Math.sin(tick * p.pulseSpeed + p.phase);
        const alpha = Math.max(0, Math.min(1, p.baseAlpha + pulse * 0.28));
        const sprite = sprites[p.spriteIdx];
        const w = sprite.width * p.scale;
        const h = sprite.height * p.scale;

        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, p.x - w / 2, p.y - h / 2, w, h);
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resize, { passive: true });
    resize();
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="stardust-layer"
      aria-hidden="true"
    />
  );
}
