"use client";

import type { GalleryPhotoItem } from "../types/gallery.types";
import { GalleryMediaCard } from "./GalleryMediaCard";

type GalleryGridProps = {
  photos: GalleryPhotoItem[];
  isLoading: boolean;
};

export function GalleryGrid({ photos, isLoading }: GalleryGridProps) {
  return (
    <>
      {isLoading ? (
        <p className="mb-6 text-center text-sm text-foreground/60">Loading gallery...</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {photos.map((item) => (
          <GalleryMediaCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}
