"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const mediaClassName = cn(
  "h-full w-full object-cover object-[center_28%]",
  "transition-[transform,filter] duration-[1.1s] ease-out",
  "group-hover/card:scale-[1.03] group-hover/card:brightness-[1.04]",
  "motion-reduce:group-hover/card:scale-100 motion-reduce:group-hover/card:brightness-100",
);

type EventCatalogCardHeroProps = {
  imageUrl: string | null;
  isVideo: boolean;
  /** Used for image alt when not decorative. */
  title: string;
  className?: string;
  /** Tailwind aspect class for the media frame (default portrait catalog ratio). */
  aspectClassName?: string;
};

/**
 * Portrait-first hero frame for event-type catalog cards.
 * Taller aspect ratio and top-weighted object-position keep performers in frame
 * inside narrow carousel columns.
 */
export function EventCatalogCardHero({
  imageUrl,
  isVideo,
  title,
  className,
  aspectClassName = "aspect-4/5",
}: EventCatalogCardHeroProps) {
  return (
    <div
      className={cn(
        "relative z-10 w-full shrink-0 overflow-hidden rounded-t-2xl bg-[#0a0908]",
        className,
      )}
    >
      <div className={cn("relative w-full", aspectClassName)}>
        {imageUrl ? (
          <>
            {isVideo ? (
              <video
                src={imageUrl}
                className={mediaClassName}
                muted
                playsInline
                loop
                autoPlay
                aria-label={`${title} — video preview`}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={title} className={mediaClassName} loading="lazy" decoding="async" />
            )}

            {/* Bottom vignette only — avoids crushing faces at the top */}
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_52%,rgba(4,3,2,0.55)_78%,rgba(3,2,2,0.88)_100%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_85%,rgba(0,0,0,0.35),transparent_58%)]"
              aria-hidden
            />
          </>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(197,165,90,0.14)_0%,transparent_58%)]"
            aria-hidden
          >
            <Sparkles
              className="h-11 w-11 text-gold/22 transition-colors duration-500 group-hover/card:text-gold/35"
              strokeWidth={1.2}
            />
          </div>
        )}
      </div>
    </div>
  );
}
