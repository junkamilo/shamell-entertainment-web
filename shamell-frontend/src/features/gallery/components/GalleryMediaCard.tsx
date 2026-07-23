"use client";

import Image from "next/image";
import type { GalleryPhotoItem } from "../types/gallery.types";

type GalleryMediaCardProps = {
  item: GalleryPhotoItem;
};

export function GalleryMediaCard({ item }: GalleryMediaCardProps) {
  return (
    <div
      className="shamell-gallery-card-bg group relative aspect-3/4 overflow-visible rounded-2xl border border-gold/15 shadow-[inset_0_1px_0_rgba(197,165,90,0.06),inset_0_0_0_1px_rgba(255,255,255,0.04),0_10px_36px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow] duration-500 hover:border-gold/35 hover:shadow-[0_18px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(197,165,90,0.09)] sm:aspect-3/4"
    >
      {item.mediaType === "VIDEO" ? (
        <video
          key={item.id}
          src={item.src}
          className="absolute inset-0 z-1 h-full w-full rounded-2xl object-contain object-center p-2 transition-transform duration-700 group-hover:scale-[1.02] sm:p-3"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label={item.alt}
        />
      ) : (
        <Image
          src={item.src}
          alt={item.alt}
          fill
          className="rounded-2xl object-contain object-center p-2 transition-transform duration-700 group-hover:scale-[1.02] sm:p-3"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      )}
    </div>
  );
}
