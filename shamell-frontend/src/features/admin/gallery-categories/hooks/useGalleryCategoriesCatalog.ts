"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getGalleryBearerToken } from "@/features/admin/gallery/lib/galleryAuth";
import { fetchGalleryCategoriesCatalog } from "../services/fetchGalleryCategoriesCatalog";
import type { GalleryCategory, GalleryCategoryPhotoPreview } from "../types/galleryCategories.types";

function isOfflineError(err: unknown) {
  const description = err instanceof Error ? err.message : "Could not reach the server.";
  return description === "Failed to fetch" || !(err instanceof Error);
}

export function useGalleryCategoriesCatalog() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [photos, setPhotos] = useState<GalleryCategoryPhotoPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    const token = getGalleryBearerToken();
    if (!token) {
      setCategories([]);
      setPhotos([]);
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchGalleryCategoriesCatalog(token);
      setCategories(result.categories);
      setPhotos(result.photos);
    } catch (err) {
      const offline = isOfflineError(err);
      toast({
        variant: "destructive",
        title: offline ? "Offline" : "Error",
        description: offline
          ? "Could not reach the server."
          : err instanceof Error
            ? err.message
            : "Could not load categories.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return { categories, photos, isLoading, loadData };
}
