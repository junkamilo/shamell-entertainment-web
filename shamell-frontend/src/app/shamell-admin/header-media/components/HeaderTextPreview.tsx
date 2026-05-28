"use client";

import { fontClassForToken } from "@/lib/headerTextStyleTokens";
import type { HeaderTextContent } from "@/lib/headerTextTypes";
import { cn } from "@/lib/utils";

type Props = {
  content: HeaderTextContent;
  className?: string;
  compact?: boolean;
};

export default function HeaderTextPreview({ content, className, compact = false }: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gold/15 bg-[#080a0e] text-center",
        compact ? "px-4 py-8" : "px-6 py-12 md:px-10 md:py-14",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_38%,rgba(0,0,0,0.15)_0%,transparent_55%,rgba(0,0,0,0.55)_100%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-xl">
        <h1
          className={cn(
            fontClassForToken(content.headlineFont),
            compact
              ? "mb-3 text-3xl tracking-[0.24em]"
              : "mb-4 text-4xl tracking-[0.28em] sm:text-5xl md:text-6xl",
          )}
          style={{ color: content.headlineColor }}
        >
          {content.headline}
        </h1>

        <p
          className={cn(
            fontClassForToken(content.taglineFont),
            "mx-auto mb-8 max-w-lg font-medium italic leading-relaxed tracking-wide",
            compact ? "text-lg" : "text-xl sm:text-2xl md:text-3xl",
          )}
          style={{ color: content.taglineColor }}
        >
          {content.tagline}
        </p>

        <div
          className={cn(
            "mx-auto max-w-md rounded-2xl border border-white/12 bg-black/35 backdrop-blur-md",
            compact ? "px-4 py-4" : "px-5 py-6 sm:px-8 sm:py-7",
          )}
        >
          <p
            className={cn(
              fontClassForToken(content.quoteFont),
              compact ? "text-xl leading-snug" : "text-2xl leading-snug sm:text-3xl",
            )}
            style={{ color: content.quoteColor }}
          >
            {content.quote}
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-gold-light align-middle opacity-90" />
          </p>
        </div>
      </div>
    </div>
  );
}
