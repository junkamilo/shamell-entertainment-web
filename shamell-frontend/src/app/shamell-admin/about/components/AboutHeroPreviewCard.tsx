"use client";

import { Trash2 } from "lucide-react";
import type { AboutHeroPreviewCardProps } from "../types/aboutAdmin.types";

export function AboutHeroPreviewCard({
  src,
  isVideo,
  badge,
  onRemove,
  removeDisabled,
  removeBusy,
  removeAriaLabel,
  onExpand,
}: AboutHeroPreviewCardProps) {
  return (
    <div className="relative flex w-38 shrink-0 flex-col gap-1 rounded-xl border border-gold/22 bg-black/25 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-gold/10">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        disabled={removeDisabled}
        className="absolute right-1 top-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-red-500/35 bg-black/70 text-red-200/95 shadow-md backdrop-blur-sm transition hover:border-red-400/55 hover:bg-red-950/45 hover:text-red-50 disabled:cursor-not-allowed disabled:opacity-45"
        aria-label={removeAriaLabel}
      >
        {removeBusy ? (
          <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-red-200/80" aria-hidden />
        ) : (
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
      </button>
      <p className="pr-9 font-brand text-[9px] uppercase leading-tight tracking-[0.14em] text-gold/65">{badge}</p>
      <button
        type="button"
        onClick={onExpand}
        className="group relative aspect-square w-full overflow-hidden rounded-lg bg-[#080a0e] ring-1 ring-gold/12"
        aria-label="View full size"
      >
        {isVideo ? (
          <video
            src={src}
            className="h-full w-full object-contain p-1 transition group-hover:opacity-95"
            muted
            playsInline
            loop
            autoPlay
            preload="metadata"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt=""
            className="h-full w-full object-contain p-1 transition group-hover:opacity-95"
          />
        )}
      </button>
    </div>
  );
}
