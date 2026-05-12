"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type RevealOnViewProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  amount?: number;
  style?: CSSProperties;
};

export default function RevealOnView({
  children,
  className,
  delay = 0,
  duration = 720,
  amount = 0.22,
  style,
}: RevealOnViewProps) {
  return (
    <motion.div
      className={cn(className)}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount }}
      variants={{
        hidden: {
          opacity: 0,
          scale: 0.86,
          y: 42,
          filter: "blur(14px)",
        },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
        },
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
