"use client";

import { useEffect, useMemo, useState } from "react";
import {
  galleryItems as fallbackItems,
  galleryTabs as fallbackTabs,
  type GalleryFilter,
} from "@/lib/galleryData";

export type GalleryCategoryApiItem = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type GalleryPhotoApiItem = {
  id: string;
  imageUrl: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

type GalleryPhotosResponse = {
  items: GalleryPhotoApiItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type GalleryTabItem = {
  id: string;
  label: string;
};

export type GalleryPhotoItem = {
  id: string;
  src: string;
  alt: string;
  categorySlug: string;
};

export function useGalleryCategories() {
  const [categories, setCategories] = useState<GalleryTabItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );

  useEffect(() => {
    let isCancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    fetch(`${apiBaseUrl}/api/v1/gallery/categories`)
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load gallery categories.");
        return response.json();
      })
      .then((data: unknown) => {
        if (isCancelled || !Array.isArray(data)) return;

        const mapped = (data as GalleryCategoryApiItem[])
          .filter((item) => item?.slug && item?.name)
          .map((item) => ({
            id: item.slug,
            label: item.name,
          }));

        setCategories([{ id: "all", label: "All" }, ...mapped]);
      })
      .catch(() => {
        if (isCancelled) return;
        setCategories(fallbackTabs.map((tab) => ({ id: tab.id, label: tab.label })));
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [apiBaseUrl]);

  return { categories, isLoading };
}

export function useGalleryPhotos(filter: string, limit?: number) {
  const [photos, setPhotos] = useState<GalleryPhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );

  useEffect(() => {
    let isCancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    const params = new URLSearchParams();
    if (filter && filter !== "all") params.set("category", filter);
    if (limit !== undefined) params.set("limit", String(limit));
    params.set("page", "1");

    fetch(`${apiBaseUrl}/api/v1/gallery/photos?${params.toString()}`)
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load gallery photos.");
        return response.json();
      })
      .then((data: unknown) => {
        if (isCancelled || typeof data !== "object" || data === null) return;
        const payload = data as GalleryPhotosResponse;
        if (!Array.isArray(payload.items)) return;

        setPhotos(
          payload.items.map((item) => ({
            id: item.id,
            src: item.imageUrl,
            alt: `Foto de ${item.category.name}`,
            categorySlug: item.category.slug,
          })),
        );
      })
      .catch(() => {
        if (isCancelled) return;
        const fallback = filter === "all"
          ? fallbackItems
          : fallbackItems.filter((item) => item.category === (filter as GalleryFilter));
        setPhotos(
          fallback.map((item) => ({
            id: item.id,
            src: item.src.src,
            alt: item.alt,
            categorySlug: item.category,
          })),
        );
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [apiBaseUrl, filter, limit]);

  return { photos, isLoading };
}
