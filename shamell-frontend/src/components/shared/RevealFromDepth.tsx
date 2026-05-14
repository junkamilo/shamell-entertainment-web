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

export default function RevealFromDepth({
  children,
  className,
  delay = 0,
  duration = 900,
  style,
}: RevealFromDepthProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const effectiveDuration = isMobile && !prefersReducedMotion ? Math.min(duration, 640) : duration;

  if (prefersReducedMotion) {
    return (
      <div className={cn(className)} style={style}>
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <motion.div
        className={cn(className)}
        style={style}
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
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
