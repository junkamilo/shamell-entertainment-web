"use client";

import { Sparkles } from "lucide-react";
import CardMedia from "@/components/media/CardMedia";
import { useCatalogSlideActive } from "@/components/shared/catalog-slide-context";
import { cn } from "@/lib/utils";

type EventCatalogCardHeroProps = {
  imageUrl: string | null;
  mediaType?: "IMAGE" | "VIDEO";
  /** @deprecated Prefer mediaType; kept for callers that still pass isVideo. */
  isVideo?: boolean;
  posterUrl?: string | null;
  posterUrlMobile?: string | null;
  videoUrl?: string | null;
  /** Used for image alt when not decorative. */
  title: string;
  className?: string;
  /** Tailwind aspect class for the media frame (default portrait catalog ratio). */
  aspectClassName?: string;
  /** Eager-load hero media (e.g. first home card). */
  priority?: boolean;
};

/**
 * Portrait-first hero frame for event-type catalog cards.
 * Delegates media rendering to CardMedia (poster + gated video).
 */
export function EventCatalogCardHero({
  imageUrl,
  mediaType,
  isVideo = false,
  posterUrl,
  posterUrlMobile,
  videoUrl,
  title,
  className,
  aspectClassName = "aspect-[3/4] @[300px]:aspect-4/5",
  priority = false,
}: EventCatalogCardHeroProps) {
  const isActiveSlide = useCatalogSlideActive();
  const resolvedType: "IMAGE" | "VIDEO" =
    mediaType ?? (isVideo ? "VIDEO" : "IMAGE");
  const hasMedia =
    resolvedType === "IMAGE"
      ? Boolean(imageUrl?.trim())
      : Boolean(posterUrl?.trim() || posterUrlMobile?.trim() || videoUrl?.trim() || imageUrl?.trim());

  return (
    <div
      className={cn(
        "relative z-10 w-full shrink-0 overflow-hidden rounded-t-2xl bg-[#0a0908]",
        className,
      )}
    >
      <div className={cn("relative w-full", aspectClassName)}>
        {hasMedia ? (
          <>
            <CardMedia
              mediaType={resolvedType}
              imageUrl={imageUrl}
              videoUrl={videoUrl ?? (resolvedType === "VIDEO" ? imageUrl : null)}
              posterUrl={posterUrl}
              posterUrlMobile={posterUrlMobile}
              isActive={isActiveSlide}
              alt={title}
              className="absolute inset-0"
              loading={priority ? "eager" : "lazy"}
            />

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
