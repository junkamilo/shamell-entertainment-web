"use client";

import { useCallback, useState } from "react";
import type { GalleryCategory } from "../types/galleryCategories.types";

export function useGalleryCategoriesForm() {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const resetCategoryForm = useCallback(() => {
    setEditingCategoryId(null);
    setCategoryName("");
  }, []);

  const openCategoryCreate = useCallback(() => {
    resetCategoryForm();
    setIsCategoryModalOpen(true);
  }, [resetCategoryForm]);

  const startCategoryEdit = useCallback((category: GalleryCategory) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setIsCategoryModalOpen(true);
  }, []);

  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false);
    resetCategoryForm();
  }, [resetCategoryForm]);

  return {
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    editingCategoryId,
    categoryName,
    setCategoryName,
    resetCategoryForm,
    openCategoryCreate,
    startCategoryEdit,
    closeCategoryModal,
  };
}
