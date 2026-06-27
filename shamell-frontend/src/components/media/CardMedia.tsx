"use client";

import { useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

export type CardMediaProps = {
  mediaType: "IMAGE" | "VIDEO";
  /** Optimized image URL when mediaType is IMAGE. */
  imageUrl?: string | null;
  /** Stream URL when mediaType is VIDEO. */
  videoUrl?: string | null;
  posterUrl?: string | null;
  posterUrlMobile?: string | null;
  /** Carousel slide centered (mobile / touch). */
  isActive?: boolean;
  alt?: string;
  className?: string;
  sizes?: string;
};

function joinSrcSet(parts: Array<string | null>): string | undefined {
  const out = parts.filter(Boolean).join(", ");
  return out || undefined;
}

const defaultSizes = "(max-width: 767px) 90vw, 33vw";

/**
 * Polymorphic catalog media: IMAGE renders a lazy img only; VIDEO shows a
 * poster and mounts the stream when in-view and hovered or slide-active.
 */
export default function CardMedia({
  mediaType,
  imageUrl,
  videoUrl,
  posterUrl,
  posterUrlMobile,
  isActive = false,
  alt = "",
  className,
  sizes = defaultSizes,
}: CardMediaProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "200px" });
  const [hovered, setHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  if (mediaType === "IMAGE") {
    const src = imageUrl?.trim();
    if (!src) return null;
    return (
      <div ref={ref} className={cn("h-full w-full", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-[center_28%]"
        />
      </div>
    );
  }

  const poster = posterUrl ?? posterUrlMobile;
  const shouldPlay = inView && (hovered || isActive) && Boolean(videoUrl?.trim());

  return (
    <div
      ref={ref}
      className={cn("relative h-full w-full", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setVideoReady(false);
      }}
    >
      {poster ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={poster}
          srcSet={joinSrcSet([
            posterUrlMobile ? `${posterUrlMobile} 480w` : null,
            posterUrl ? `${posterUrl} 720w` : null,
          ])}
          sizes={sizes}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-[center_28%] transition-opacity duration-300",
            videoReady ? "opacity-0" : "opacity-100",
          )}
        />
      ) : null}
      {shouldPlay ? (
        <video
          key={videoUrl!}
          src={videoUrl!}
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          onCanPlay={() => setVideoReady(true)}
          onPlaying={() => setVideoReady(true)}
          aria-label={alt ? `${alt} — video preview` : undefined}
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-[center_28%] transition-opacity duration-300",
            videoReady ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
    </div>
  );
}
