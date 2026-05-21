"use client";

import { useMemo, useState } from "react";
import type {
  FilterTab,
  GalleryCategoriesStats,
  GalleryCategory,
  GalleryCategoryPhotoPreview,
} from "../types/galleryCategories.types";

type Args = {
  categories: GalleryCategory[];
  photos: GalleryCategoryPhotoPreview[];
};

export function useGalleryCategoriesList({ categories, photos }: Args) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(() => new Set());

  const photoCountByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of photos) {
      m[p.categoryId] = (m[p.categoryId] ?? 0) + 1;
    }
    return m;
  }, [photos]);

  const previewUrlsByCategory = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const p of photos) {
      if (!m[p.categoryId]) m[p.categoryId] = [];
      if (m[p.categoryId].length < 5) m[p.categoryId].push(p.imageUrl);
    }
    return m;
  }, [photos]);

  const spotlightCategoryId = useMemo(() => {
    let best = "";
    let n = -1;
    for (const c of categories) {
      const count = photoCountByCategory[c.id] ?? 0;
      if (count > n) {
        n = count;
        best = c.id;
      }
    }
    return n > 0 ? best : "";
  }, [categories, photoCountByCategory]);

  const stats: GalleryCategoriesStats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.isActive).length;
    const withMedia = categories.filter((c) => (photoCountByCategory[c.id] ?? 0) > 0).length;
    let star = "—";
    if (spotlightCategoryId) {
      const c = categories.find((x) => x.id === spotlightCategoryId);
      if (c) star = c.name.length > 20 ? `${c.name.slice(0, 18)}…` : c.name;
    }
    return { total, active, inactive: total - active, withMedia, star };
  }, [categories, photoCountByCategory, spotlightCategoryId]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = categories.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
    if (filterTab === "active") list = list.filter((c) => c.isActive);
    if (filterTab === "inactive") list = list.filter((c) => !c.isActive);
    const spotlight = spotlightCategoryId && list.some((c) => c.id === spotlightCategoryId);
    return [...list].sort((a, b) => {
      if (spotlight) {
        if (a.id === spotlightCategoryId) return -1;
        if (b.id === spotlightCategoryId) return 1;
      }
      return a.name.localeCompare(b.name, "en");
    });
  }, [categories, searchQuery, filterTab, spotlightCategoryId]);

  const toggleCategoryExpanded = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    filterTab,
    setFilterTab,
    expandedCategoryIds,
    toggleCategoryExpanded,
    photoCountByCategory,
    previewUrlsByCategory,
    spotlightCategoryId,
    stats,
    filteredCategories,
  };
}
