"use client";

import { useSearchParams } from "next/navigation";
import { useGalleryCategories } from "./useGalleryCategories";
import { useGalleryPhotos } from "./useGalleryPhotos";

export function useGalleryPage() {
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("filter") ?? "all";
  const { categories, isLoading: categoriesLoading } = useGalleryCategories();
  const { photos, isLoading: photosLoading } = useGalleryPhotos(currentFilter);

  return {
    currentFilter,
    categories,
    photos,
    isLoading: categoriesLoading || photosLoading,
  };
}
