"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getGalleryBearerToken } from "../lib/galleryAuth";
import { fetchAdminGalleryCategories } from "../services/fetchAdminGalleryCategories";
import { fetchAdminGalleryPhotos } from "../services/fetchAdminGalleryPhotos";
import type { GalleryCategory, GalleryPhoto } from "../types/gallery.types";

function isOfflineError(err: unknown) {
  const description = err instanceof Error ? err.message : "Could not reach the server.";
  return description === "Failed to fetch" || !(err instanceof Error);
}

export function useGalleryCatalog() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    const token = getGalleryBearerToken();
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const [cats, items] = await Promise.all([
        fetchAdminGalleryCategories(token),
        fetchAdminGalleryPhotos(token),
      ]);
      setCategories(cats);
      setPhotos(items);
    } catch (err) {
      const offline = isOfflineError(err);
      toast({
        variant: "destructive",
        title: offline ? "Offline" : "Error",
        description: offline
          ? "Could not reach the server."
          : err instanceof Error
            ? err.message
            : "Could not load gallery data.",
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
