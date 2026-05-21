"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatRelativeEn } from "../lib/galleryDisplay";
import { sortActiveCategories } from "../lib/gallerySort";
import type { GalleryCategory, GalleryPhoto, GalleryStats } from "../types/gallery.types";

type Args = {
  categories: GalleryCategory[];
  photos: GalleryPhoto[];
};

export function useGalleryLibrary({ categories, photos }: Args) {
  const [searchQuery, setSearchQuery] = useState("");
  const [listCategoryFilter, setListCategoryFilter] = useState<string | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [expandedAlbumIds, setExpandedAlbumIds] = useState<Set<string>>(() => new Set());
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterDropdownOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = filterDropdownRef.current;
      if (el && !el.contains(e.target as Node)) setFilterDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [filterDropdownOpen]);

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories]);
  const sortedActiveCategories = useMemo(
    () => sortActiveCategories(categories),
    [categories],
  );

  const categoriesForLibrary = useMemo(() => {
    if (listCategoryFilter) {
      const one = sortedActiveCategories.find((c) => c.id === listCategoryFilter);
      return one ? [one] : [];
    }
    return sortedActiveCategories;
  }, [sortedActiveCategories, listCategoryFilter]);

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
    let recent = "—";
    if (photos.length > 0) {
      const sorted = [...photos].sort((a, b) => {
        const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      recent = formatRelativeEn(sorted[0]?.updatedAt ?? sorted[0]?.createdAt);
    }
    return { total, visible, catsWith, recent };
  }, [photos, categories, countByCategory]);

  const filteredPhotos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return photos.filter((photo) => {
      if (listCategoryFilter && photo.category.id !== listCategoryFilter) return false;
      if (!q) return true;
      const searchable = `${photo.category.name} ${photo.category.slug}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [photos, searchQuery, listCategoryFilter]);

  const totalForFilterAll = photos.length;
  const filterCount =
    listCategoryFilter === null ? totalForFilterAll : (countByCategory[listCategoryFilter] ?? 0);
  const filterMedioLabel = filterCount === 1 ? "file" : "files";
  const filterSummaryLabel =
    listCategoryFilter === null
      ? "All categories"
      : (activeCategories.find((c) => c.id === listCategoryFilter)?.name ?? "Category");

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
    listCategoryFilter,
    setListCategoryFilter,
    filterDropdownOpen,
    setFilterDropdownOpen,
    filterDropdownRef,
    expandedAlbumIds,
    toggleAlbumExpanded,
    activeCategories,
    sortedActiveCategories,
    categoriesForLibrary,
    countByCategory,
    stats,
    filteredPhotos,
    totalForFilterAll,
    filterCount,
    filterMedioLabel,
    filterSummaryLabel,
  };
}
