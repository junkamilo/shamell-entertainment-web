"use client";

import { type FormEvent, useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getGalleryBearerToken } from "@/app/shamell-admin/gallery/lib/galleryAuth";
import { patchAdminGalleryCategory } from "../services/patchAdminGalleryCategory";
import { patchAdminGalleryCategoryActive } from "../services/patchAdminGalleryCategoryActive";
import { postAdminGalleryCategory } from "../services/postAdminGalleryCategory";
import type { GalleryCategory } from "../types/galleryCategories.types";
import { useGalleryCategoriesCatalog } from "./useGalleryCategoriesCatalog";
import { useGalleryCategoriesForm } from "./useGalleryCategoriesForm";
import { useGalleryCategoriesList } from "./useGalleryCategoriesList";

function isOfflineError(err: unknown) {
  const description = err instanceof Error ? err.message : "Could not reach the server.";
  return description === "Failed to fetch" || !(err instanceof Error);
}

function toastApiError(err: unknown, fallbackTitle: string) {
  const offline = isOfflineError(err);
  toast({
    variant: "destructive",
    title: offline ? "Offline" : fallbackTitle,
    description: offline
      ? "Could not reach the server."
      : err instanceof Error
        ? err.message
        : "Something went wrong.",
  });
}

export function useGalleryCategoriesPage() {
  const catalog = useGalleryCategoriesCatalog();
  const list = useGalleryCategoriesList({
    categories: catalog.categories,
    photos: catalog.photos,
  });
  const form = useGalleryCategoriesForm();

  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const onSubmitCategory = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const token = getGalleryBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an admin.",
        });
        return;
      }

      const name = form.categoryName.trim();
      if (!name) {
        toast({
          variant: "destructive",
          title: "Check the form",
          description: "Name is required.",
        });
        return;
      }

      setIsSubmittingCategory(true);
      try {
        if (form.editingCategoryId) {
          await patchAdminGalleryCategory(token, form.editingCategoryId, name);
        } else {
          await postAdminGalleryCategory(token, name);
        }
        toast({
          title: form.editingCategoryId ? "Category updated" : "Category created",
          description: "The gallery category was saved.",
        });
        form.closeCategoryModal();
        await catalog.loadData();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setIsSubmittingCategory(false);
      }
    },
    [form, catalog],
  );

  const onToggleCategoryActive = useCallback(
    async (category: GalleryCategory) => {
      const token = getGalleryBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an admin.",
        });
        return;
      }

      setTogglingId(category.id);
      try {
        await patchAdminGalleryCategoryActive(token, category.id, !category.isActive);
        toast({
          title: category.isActive ? "Category hidden" : "Category visible",
          description: category.isActive
            ? "The category is no longer shown on the public gallery."
            : "The category is active again.",
        });
        await catalog.loadData();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setTogglingId(null);
      }
    },
    [catalog],
  );

  return {
    catalog,
    list,
    form,
    isSubmittingCategory,
    togglingId,
    onSubmitCategory,
    onToggleCategoryActive,
  };
}
