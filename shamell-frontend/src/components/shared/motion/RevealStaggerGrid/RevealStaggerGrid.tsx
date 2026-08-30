"use client";

import type { CSSProperties, ReactNode } from "react";
import { Children, isValidElement, useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const easeLux = [0.16, 1, 0.3, 1] as const;
const VIEW_FALLBACK_MS = 800;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0,
    },
  },
};

type RevealStaggerGridProps = {
  children: ReactNode;
  className?: string;
  amount?: number;
  itemDuration?: number;
  /** When set, merged onto each item wrapper (grid cell placement, etc.). Length should match child count. */
  itemClassNames?: string[];
  style?: CSSProperties;
};

export function RevealStaggerGrid({
  children,
  className,
  amount = 0.01,
  itemDuration = 520,
  itemClassNames,
  style,
}: RevealStaggerGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [bfcacheKey, setBfcacheKey] = useState(0);
  const [forceVisible, setForceVisible] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const durationSec = itemDuration / 1000;
  const isInView = useInView(ref, { once: true, amount });
  const showStatic = prefersReducedMotion || isMobile;

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setBfcacheKey((k) => k + 1);
        setForceVisible(false);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    if (showStatic || isInView || forceVisible) return;
    const id = window.setTimeout(() => setForceVisible(true), VIEW_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [showStatic, isInView, forceVisible, bfcacheKey]);

  if (showStatic) {
    return (
      <div className={cn(className)} style={style}>
        {Children.map(children, (child, index) => {
          if (!isValidElement(child)) return child;
          const itemExtraClass = itemClassNames?.[index];
          return (
            <div key={child.key ?? index} className={cn("h-full", itemExtraClass)}>
              {child}
            </div>
          );
        })}
      </div>
    );
  }

  const visible = isInView || forceVisible;
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.94, y: 28 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <motion.div
      key={bfcacheKey}
      ref={ref}
      className={cn(className)}
      style={style}
      variants={containerVariants}
      initial="hidden"
      animate={visible ? "visible" : "hidden"}
    >
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;
        const itemExtraClass = itemClassNames?.[index];
        return (
          <motion.div
            key={child.key ?? index}
            variants={itemVariants}
            className={cn("h-full", itemExtraClass)}
            transition={{ duration: durationSec, ease: easeLux }}
          >
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
