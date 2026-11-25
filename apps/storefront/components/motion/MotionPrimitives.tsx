"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";

const EASE_SMOOTH: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE_SMOOTH,
    },
  },
};

interface MotionSectionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  id?: string;
}

/**
 * Scroll-triggered section reveal that respects prefers-reduced-motion.
 */
export function MotionSection({
  children,
  delay = 0,
  className,
  id,
}: MotionSectionProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, delay, ease: EASE_SMOOTH }}
    >
      {children}
    </motion.div>
  );
}

interface MotionStaggerGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Staggered container for grids and card lists.
 */
export function MotionStaggerGrid({
  children,
  className,
}: MotionStaggerGridProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

interface MotionHoverCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  lift?: number;
}

/**
 * Interactive card wrapper with spring hover lift and tap scale.
 */
export function MotionHoverCard({
  children,
  className,
  onClick,
  lift = -6,
}: MotionHoverCardProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      onClick={onClick}
      variants={staggerItemVariants}
      whileHover={{ y: lift, transition: { duration: 0.22, ease: "easeOut" } }}
      whileTap={{ scale: 0.985 }}
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
}

interface MotionNumberCounterProps {
  value: number;
  durationMs?: number;
  formatter?: (n: number) => string;
}

/**
 * Smooth animated numeric counter for points and stats.
 */
export function MotionNumberCounter({
  value,
  durationMs = 900,
  formatter = (n) => n.toLocaleString("fa-IR"),
}: MotionNumberCounterProps) {
  const prefersReduced = useReducedMotion();
  const [display, setDisplay] = useState<number>(prefersReduced ? value : 0);
  const displayRef = useRef<number>(display);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    let rafId = 0;
    const startValue = displayRef.current;
    const delta = value - startValue;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startValue + delta * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, durationMs, prefersReduced]);

  return <span>{formatter(display)}</span>;
}

interface MotionFloatingOrbProps {
  size: number;
  color: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  duration?: number;
}

/**
 * Ambient cosmic glow orb for luxury hero sections.
 */
export function MotionFloatingOrb({
  size,
  color,
  top,
  left,
  right,
  bottom,
  duration = 8,
}: MotionFloatingOrbProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      animate={
        prefersReduced
          ? undefined
          : {
              y: [0, -14, 0],
              x: [0, 10, 0],
              scale: [1, 1.06, 1],
            }
      }
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: "blur(56px)",
        pointerEvents: "none",
        top,
        left,
        right,
        bottom,
      }}
    />
  );
}
