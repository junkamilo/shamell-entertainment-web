"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type RevealOnViewProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  amount?: number;
  style?: CSSProperties;
};

const easeLux = [0.16, 1, 0.3, 1] as const;
/** If IntersectionObserver never fires, force visible so content is never stuck hidden. */
const VIEW_FALLBACK_MS = 800;

export function RevealOnView({
  children,
  className,
  delay = 0,
  duration = 520,
  amount = 0.01,
  style,
}: RevealOnViewProps) {
  const hasMounted = useHasMounted();
  const ref = useRef<HTMLDivElement>(null);
  const [bfcacheKey, setBfcacheKey] = useState(0);
  const [forceVisible, setForceVisible] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const effectiveDuration = duration;
  const isInView = useInView(ref, { once: true, amount });
  const showStatic = !hasMounted || prefersReducedMotion || isMobile;

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
        {children}
      </div>
    );
  }

  const visible = isInView || forceVisible;
  const variants = {
    hidden: { opacity: 0, scale: 0.94, y: 28 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <motion.div
      key={bfcacheKey}
      ref={ref}
      className={cn(className)}
      style={style}
      initial="hidden"
      animate={visible ? "visible" : "hidden"}
      variants={variants}
      transition={{
        delay: delay / 1000,
        duration: effectiveDuration / 1000,
        ease: easeLux,
      }}
    >
      {children}
    </motion.div>
  );
}
