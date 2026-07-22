"use client";

import { motion } from "motion/react";
import { TABLE_SIZE_CONFIG, TABLE_SIZE_ORDER } from "../lib/tableSizeConfig";
import type { TableSize } from "../types/venueTables.types";

type Props = {
  value: TableSize;
  onChange: (size: TableSize) => void;
};

export default function TableSizeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TABLE_SIZE_ORDER.map((size) => {
        const meta = TABLE_SIZE_CONFIG[size];
        const selected = value === size;
        return (
          <motion.button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            whileTap={{ scale: 0.96 }}
            className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition ${
              selected
                ? "border-shamell-gold bg-shamell-gold/15 shadow-[0_0_20px_rgba(232,201,122,0.2)]"
                : "border-shamell-line-soft bg-shamell-twilight/30 hover:border-shamell-gold/40"
            }`}
          >
            <svg width="56" height="56" viewBox="-32 -32 64 64" aria-hidden>
              <circle
                r={meta.tableRadius * 0.65}
                fill={selected ? "#C4B5E8" : "#D8CCEF"}
                stroke={selected ? "#E8C97A" : "#6B5B95"}
                strokeWidth={2}
              />
            </svg>
            <span className="text-xs font-semibold text-shamell-text-primary">
              {meta.label}
            </span>
            <span className="text-[10px] text-shamell-gold">
              {meta.minChairs}–{meta.maxChairs} chairs
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
