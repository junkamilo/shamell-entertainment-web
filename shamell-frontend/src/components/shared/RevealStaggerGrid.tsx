"use client";

import type { CSSProperties, ReactNode } from "react";
import { Children, isValidElement } from "react";
import { motion } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const easeLux = [0.16, 1, 0.3, 1] as const;

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

export default function RevealStaggerGrid({
  children,
  className,
  amount = 0.18,
  itemDuration = 520,
  itemClassNames,
  style,
}: RevealStaggerGridProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const durationSec = (isMobile ? Math.min(itemDuration, 440) : itemDuration) / 1000;

  const itemVariants = isMobile
    ? {
        hidden: { opacity: 0, y: 28 },
        visible: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, scale: 0.94, y: 28 },
        visible: { opacity: 1, scale: 1, y: 0 },
      };

  if (prefersReducedMotion) {
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
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
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
