"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type RevealFromDepthProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  style?: CSSProperties;
};

const easeLux = [0.16, 1, 0.3, 1] as const;

export function RevealFromDepth({
  children,
  className,
  delay = 0,
  duration = 900,
  style,
}: RevealFromDepthProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  if (prefersReducedMotion || isMobile) {
    return (
      <div className={cn(className)} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(className)}
      style={style}
      initial={{
        opacity: 0,
        scale: 0.42,
        y: 48,
        filter: "blur(18px)",
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      transition={{
        delay: delay / 1000,
        duration: duration / 1000,
        ease: easeLux,
      }}
    >
      {children}
    </motion.div>
  );
}
