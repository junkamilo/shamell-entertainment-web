"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type RevealFromDepthProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  style?: CSSProperties;
};

export default function RevealFromDepth({
  children,
  className,
  delay = 0,
  duration = 900,
  style,
}: RevealFromDepthProps) {
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
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
