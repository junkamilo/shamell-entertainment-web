"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
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
  const isMobile = useMediaQuery("(max-width: 768px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const useLiteVariants = isMobile;
  const effectiveDuration = isMobile ? Math.min(duration, 440) : duration;

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
      className={cn(className)}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
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
