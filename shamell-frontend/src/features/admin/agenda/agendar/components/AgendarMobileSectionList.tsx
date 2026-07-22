"use client";

import { Eye } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AGENDAR_MOBILE_SECTIONS } from "../lib/agendarMobileSections";
import type { AgendarMobileSectionListProps } from "../types/agendarComponents.types";
import type { AgendarMobileSectionId } from "../types/agendar.types";

export function AgendarMobileSectionList({ form }: AgendarMobileSectionListProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      {AGENDAR_MOBILE_SECTIONS.map((row) => {
        const complete = form.mobileSectionStatus[row.id as AgendarMobileSectionId];
        return (
          <motion.div
            key={row.id}
            layout
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-4 py-4 shadow-sm backdrop-blur-[2px] transition-colors duration-300",
              complete
                ? "border-emerald-400/50 bg-emerald-500/12"
                : "border-gold/25 bg-black/35",
            )}
          >
            <div className="min-w-0 pr-2">
              <p className="font-brand text-[13px] tracking-[0.16em] text-gold">{row.title}</p>
              <p className="mt-1.5 font-body text-sm leading-relaxed text-foreground/68">{row.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => form.setMobileSectionModal(row.id)}
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors",
                complete
                  ? "border-emerald-400/45 text-emerald-200 hover:bg-emerald-500/15"
                  : "border-gold/30 text-gold/90 hover:bg-gold/10 hover:text-gold",
              )}
              aria-label={`Open ${row.title.toLowerCase()}`}
            >
              <Eye className="h-6 w-6" strokeWidth={1.5} aria-hidden />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
