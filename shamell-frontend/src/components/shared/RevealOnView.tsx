"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
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

export default function RevealOnView({
  children,
  className,
  delay = 0,
  duration = 520,
  amount = 0.22,
  style,
}: RevealOnViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [bfcacheKey, setBfcacheKey] = useState(0);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const useLiteVariants = isMobile;
  const effectiveDuration = isMobile ? Math.min(duration, 440) : duration;
  const isInView = useInView(ref, { once: true, amount });

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setBfcacheKey((k) => k + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  if (prefersReducedMotion) {
    return (
      <div className={cn(className)} style={style}>
        {children}
      </div>
    );
  }

  const variants = useLiteVariants
    ? {
        hidden: { opacity: 0, y: 28 },
        visible: { opacity: 1, y: 0 },
      }
    : {
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
      animate={isInView ? "visible" : "hidden"}
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
