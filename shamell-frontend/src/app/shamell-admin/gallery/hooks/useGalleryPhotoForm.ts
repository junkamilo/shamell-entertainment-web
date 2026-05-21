"use client";

import { useCallback, useMemo, useState } from "react";
import { GALLERY_CATCHALL_SLUG } from "@/lib/galleryConstants";
import type { GalleryCategory, GalleryPhoto } from "../types/gallery.types";

type Args = {
  activeCategories: GalleryCategory[];
  sortedActiveCategories: GalleryCategory[];
  listCategoryFilter: string | null;
};

export function useGalleryPhotoForm({
  activeCategories,
  sortedActiveCategories,
  listCategoryFilter,
}: Args) {
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [originalCategoryId, setOriginalCategoryId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const resetPhotoForm = useCallback(() => {
    setEditingPhotoId(null);
    setOriginalCategoryId(null);
    setImageFiles([]);
    setSelectedCategoryId((current) => {
      if (current) return current;
      return sortedActiveCategories[0]?.id ?? "";
    });
  }, [sortedActiveCategories]);

  const openUploadToCategory = useCallback(
    (categoryId: string) => {
      setEditingPhotoId(null);
      setOriginalCategoryId(null);
      setImageFiles([]);
      const id =
        categoryId && activeCategories.some((c) => c.id === categoryId)
          ? categoryId
          : (sortedActiveCategories[0]?.id ?? "");
      setSelectedCategoryId(id);
    },
    [activeCategories, sortedActiveCategories],
  );

  const openPhotoCreate = useCallback(() => {
    if (listCategoryFilter && activeCategories.some((c) => c.id === listCategoryFilter)) {
      openUploadToCategory(listCategoryFilter);
      return;
    }
    const catchAll = activeCategories.find((c) => c.slug === GALLERY_CATCHALL_SLUG);
    openUploadToCategory(catchAll?.id ?? sortedActiveCategories[0]?.id ?? "");
  }, [listCategoryFilter, activeCategories, sortedActiveCategories, openUploadToCategory]);

  const startPhotoEdit = useCallback((photo: GalleryPhoto) => {
    setEditingPhotoId(photo.id);
    setSelectedCategoryId(photo.category.id);
    setOriginalCategoryId(photo.category.id);
    setImageFiles([]);
  }, []);

  const selectedCategoryName = activeCategories.find((c) => c.id === selectedCategoryId)?.name;
  const selectedCategorySlug = activeCategories.find((c) => c.id === selectedCategoryId)?.slug;

  const canSubmitPhoto = useMemo(() => {
    if (!selectedCategoryId) return false;
    if (!editingPhotoId) return imageFiles.length > 0;
    return imageFiles.length > 0 || selectedCategoryId !== (originalCategoryId ?? "");
  }, [selectedCategoryId, editingPhotoId, imageFiles, originalCategoryId]);

  return {
    editingPhotoId,
    originalCategoryId,
    selectedCategoryId,
    setSelectedCategoryId,
    imageFiles,
    setImageFiles,
    canSubmitPhoto,
    resetPhotoForm,
    openUploadToCategory,
    openPhotoCreate,
    startPhotoEdit,
    selectedCategoryName,
    selectedCategorySlug,
  };
}
