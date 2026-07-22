"use client";

import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { TABLE_SIZE_CONFIG } from "../lib/tableSizeConfig";
import type { TableSize } from "../types/venueTables.types";

type Props = {
  size: TableSize;
  includedChairs: number;
  canIncrement: boolean;
  canDecrement: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
};

function chairPosition(index: number, total: number, orbit: number) {
  const angle = (360 / total) * index - 90;
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * orbit,
    y: Math.sin(rad) * orbit,
  };
}

export default function TableChairRing({
  size,
  includedChairs,
  canIncrement,
  canDecrement,
  onIncrement,
  onDecrement,
}: Props) {
  const meta = TABLE_SIZE_CONFIG[size];
  const view = 160;

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="flex items-center justify-center gap-3 pb-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          disabled={!canDecrement}
          onClick={onDecrement}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-shamell-line-soft bg-shamell-twilight text-shamell-text-primary disabled:opacity-40"
          aria-label="Remove chair"
        >
          <Minus className="h-5 w-5" />
        </motion.button>
        <p className="min-w-[8rem] text-center text-sm font-medium text-shamell-gold">
          {includedChairs} chair{includedChairs === 1 ? "" : "s"} included
        </p>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          disabled={!canIncrement}
          onClick={onIncrement}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-shamell-gold/60 bg-shamell-fire/80 text-white disabled:opacity-40"
          aria-label="Add chair"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>

      <div className="rounded-2xl border border-shamell-line-soft bg-gradient-to-b from-white to-shamell-twilight/10 p-4 shadow-inner">
        <svg
          viewBox={`${-view} ${-view} ${view * 2} ${view * 2}`}
          className="mx-auto h-auto w-full max-w-[280px]"
          role="img"
          aria-label={`Table with ${includedChairs} chairs`}
        >
          <circle
            cx={0}
            cy={0}
            r={meta.tableRadius}
            fill="#C4B5E8"
            stroke="#6B5B95"
            strokeWidth={2}
          />
          <AnimatePresence mode="popLayout">
            {Array.from({ length: includedChairs }, (_, i) => {
              const { x, y } = chairPosition(i, includedChairs, meta.chairOrbit);
              return (
                <motion.rect
                  key={`chair-${i}-${includedChairs}`}
                  x={x - meta.chairRadius}
                  y={y - meta.chairRadius}
                  width={meta.chairRadius * 2}
                  height={meta.chairRadius * 2}
                  rx={2}
                  fill="#D8CCEF"
                  stroke="#6B5B95"
                  strokeWidth={1.5}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                />
              );
            })}
          </AnimatePresence>
        </svg>
      </div>
    </div>
  );
}
