"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const labelClass =
  "relative mb-0 inline-block min-w-0 font-brand text-sm font-semibold tracking-[0.16em] text-gold/95 @[300px]:text-base @[300px]:tracking-[0.2em]";

const buttonClass = cn(
  "inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-gold/30 bg-black/35 px-2.5 py-2 font-brand text-xs font-semibold text-gold/95 transition hover:border-gold/45 hover:text-gold",
  "@[280px]:self-auto @[280px]:px-3",
);

type CatalogExpandRowProps = {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  controlsId: string;
  /** Optional hover underline animation on the label (ExperienceCard style). */
  showLabelHoverLine?: boolean;
  className?: string;
};

export function CatalogExpandRow({
  label,
  expanded,
  onToggle,
  controlsId,
  showLabelHoverLine = false,
  className,
}: CatalogExpandRowProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2 @[280px]:flex-row @[280px]:items-center @[280px]:justify-between",
        className,
      )}
    >
      <h4 className={labelClass}>
        {label}
        {showLabelHoverLine ? (
          <span
            className="absolute -bottom-1 left-0 h-px w-0 bg-linear-to-r from-transparent via-white/35 to-transparent transition-all duration-500 ease-out group-hover:w-full"
            aria-hidden
          />
        ) : null}
      </h4>
      <button
        type="button"
        onClick={onToggle}
        className={buttonClass}
        aria-expanded={expanded}
        aria-controls={controlsId}
      >
        <span className="font-body text-xs font-semibold uppercase tracking-[0.1em] @[240px]:tracking-[0.12em]">
          {expanded ? "Collapse" : "Expand"}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform motion-reduce:transition-none",
            expanded && "rotate-180",
          )}
          strokeWidth={2}
          aria-hidden
        />
      </button>
    </div>
  );
}
