"use client";

import { useEffect, useState } from "react";
import {
  galleryItems as fallbackItems,
  type GalleryFilter,
} from "@/lib/galleryData";
import { fetchGalleryPhotos } from "../services/fetchGalleryPhotos";
import type { GalleryPhotoItem } from "../types/gallery.types";

export function useGalleryPhotos(
  filter: string,
  limit?: number,
  enabled: boolean = true,
) {
  const [photos, setPhotos] = useState<GalleryPhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let isCancelled = false;
    setIsLoading(true);

    fetchGalleryPhotos({ filter, limit })
      .then((mapped) => {
        if (!isCancelled) setPhotos(mapped);
      })
      .catch(() => {
        if (isCancelled) return;
        const fallback =
          filter === "all"
            ? fallbackItems
            : fallbackItems.filter((item) => item.category === (filter as GalleryFilter));
        setPhotos(
          fallback.map((item) => ({
            id: item.id,
            src: item.src.src,
            posterUrl: null,
            alt: item.alt,
            categorySlug: item.category,
            mediaType: "IMAGE" as const,
          })),
        );
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [filter, limit, enabled]);

  return { photos, isLoading };
}
