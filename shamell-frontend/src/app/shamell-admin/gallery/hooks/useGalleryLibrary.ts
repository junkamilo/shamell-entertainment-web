"use client";

import { useMemo, useState } from "react";
import { sortActiveCategories } from "../lib/gallerySort";
import type { GalleryCategory, GalleryPhoto, GalleryStats } from "../types/gallery.types";

type Args = {
  categories: GalleryCategory[];
  photos: GalleryPhoto[];
};

export function useGalleryLibrary({ categories, photos }: Args) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAlbumIds, setExpandedAlbumIds] = useState<Set<string>>(() => new Set());

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories]);
  const sortedActiveCategories = useMemo(
    () => sortActiveCategories(categories),
    [categories],
  );

  const categoriesForLibrary = sortedActiveCategories;

  const countByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of photos) {
      const id = p.category.id;
      m[id] = (m[id] ?? 0) + 1;
    }
    return m;
  }, [photos]);

  const stats: GalleryStats = useMemo(() => {
    const total = photos.length;
    const visible = photos.filter((p) => p.isActive).length;
    const catsWith = categories.filter((c) => (countByCategory[c.id] ?? 0) > 0).length;
    return { total, visible, catsWith };
  }, [photos, categories, countByCategory]);

  const filteredPhotos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return photos;
    return photos.filter((photo) => {
      const searchable = `${photo.category.name} ${photo.category.slug}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [photos, searchQuery]);

  const toggleAlbumExpanded = (categoryId: string) => {
    setExpandedAlbumIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    expandedAlbumIds,
    toggleAlbumExpanded,
    activeCategories,
    sortedActiveCategories,
    categoriesForLibrary,
    countByCategory,
    stats,
    filteredPhotos,
  };
}
