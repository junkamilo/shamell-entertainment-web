"use client";

import { useEffect, useState } from "react";
import { galleryTabs as fallbackTabs } from "@/lib/galleryData";
import { fetchGalleryCategories } from "../services/fetchGalleryCategories";
import type { GalleryTabItem } from "../types/gallery.types";

export function useGalleryCategories() {
  const [categories, setCategories] = useState<GalleryTabItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    fetchGalleryCategories()
      .then((mapped) => {
        if (!isCancelled) setCategories(mapped);
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
  }, []);

  return { categories, isLoading };
}
