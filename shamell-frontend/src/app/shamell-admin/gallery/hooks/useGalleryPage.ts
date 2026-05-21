"use client";

import { type FormEvent, useCallback, useState } from "react";
import { GALLERY_UPLOAD_MAX_FILES } from "@/lib/galleryConstants";
import { toast } from "@/hooks/use-toast";
import { buildGalleryPhotoFormData } from "../lib/galleryFormUtils";
import { getGalleryBearerToken } from "../lib/galleryAuth";
import { deleteAdminGalleryPhoto } from "../services/deleteAdminGalleryPhoto";
import { patchAdminGalleryPhoto } from "../services/patchAdminGalleryPhoto";
import { patchAdminGalleryPhotoActive } from "../services/patchAdminGalleryPhotoActive";
import { postAdminGalleryPhotos } from "../services/postAdminGalleryPhotos";
import type { GalleryPhoto } from "../types/gallery.types";
import { useGalleryCatalog } from "./useGalleryCatalog";
import { useGalleryLibrary } from "./useGalleryLibrary";
import { useGalleryPhotoForm } from "./useGalleryPhotoForm";

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

export function useGalleryPage() {
  const catalog = useGalleryCatalog();
  const library = useGalleryLibrary({
    categories: catalog.categories,
    photos: catalog.photos,
  });
  const form = useGalleryPhotoForm({
    activeCategories: library.activeCategories,
    sortedActiveCategories: library.sortedActiveCategories,
    listCategoryFilter: library.listCategoryFilter,
  });

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);

  const openPhotoModalForCreate = useCallback(() => {
    form.openPhotoCreate();
    setIsPhotoModalOpen(true);
  }, [form]);

  const openUploadToCategory = useCallback(
    (categoryId: string) => {
      form.openUploadToCategory(categoryId);
      setIsPhotoModalOpen(true);
    },
    [form],
  );

  const closePhotoModal = useCallback(() => {
    setIsPhotoModalOpen(false);
    form.resetPhotoForm();
  }, [form]);

  const startPhotoEdit = useCallback(
    (photo: GalleryPhoto) => {
      form.startPhotoEdit(photo);
      setIsPhotoModalOpen(true);
    },
    [form],
  );

  const onSubmitPhoto = useCallback(
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

      if (!form.selectedCategoryId) {
        toast({
          variant: "destructive",
          title: "Choose category",
          description: "Pick the gallery category where this file will be saved.",
        });
        return;
      }

      if (!form.editingPhotoId && form.imageFiles.length === 0) {
        toast({
          variant: "destructive",
          title: "File required",
          description: "Select one or more images or videos to upload.",
        });
        return;
      }

      if (!form.editingPhotoId && form.imageFiles.length > GALLERY_UPLOAD_MAX_FILES) {
        toast({
          variant: "destructive",
          title: "Too many files",
          description: `You can upload at most ${GALLERY_UPLOAD_MAX_FILES} files per batch.`,
        });
        return;
      }

      if (
        form.editingPhotoId &&
        form.imageFiles.length === 0 &&
        form.selectedCategoryId === (form.originalCategoryId ?? "")
      ) {
        toast({
          variant: "destructive",
          title: "No changes",
          description: "Choose another category or replace the file.",
        });
        return;
      }

      setIsSubmittingPhoto(true);
      try {
        const body = buildGalleryPhotoFormData({
          categoryId: form.selectedCategoryId,
          files: form.imageFiles,
          editingId: form.editingPhotoId,
        });
        const catLabel =
          library.activeCategories.find((c) => c.id === form.selectedCategoryId)?.name ??
          "the category";

        if (form.editingPhotoId) {
          await patchAdminGalleryPhoto(token, form.editingPhotoId, body);
          toast({
            title: "Media updated",
            description: `Changes were applied in “${catLabel}”.`,
          });
        } else {
          const result = await postAdminGalleryPhotos(token, body);
          const createdCount = result.items.length;
          toast({
            title: "Upload complete",
            description:
              createdCount > 0
                ? `${createdCount} file(s) saved in category “${catLabel}”.`
                : `The file was saved in category “${catLabel}”.`,
          });
        }

        setIsPhotoModalOpen(false);
        form.resetPhotoForm();
        await catalog.loadData();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setIsSubmittingPhoto(false);
      }
    },
    [form, library.activeCategories, catalog],
  );

  const onTogglePhotoActive = useCallback(
    async (photo: GalleryPhoto) => {
      const token = getGalleryBearerToken();
      if (!token) return;

      try {
        await patchAdminGalleryPhotoActive(token, photo.id, !photo.isActive);
        toast({
          title: photo.isActive ? "Hidden on site" : "Visible on site",
          description: `Album: ${photo.category.name}.`,
        });
        await catalog.loadData();
      } catch (err) {
        toastApiError(err, "Error");
      }
    },
    [catalog],
  );

  const onDisablePhoto = useCallback(
    async (photoId: string) => {
      const token = getGalleryBearerToken();
      if (!token) return;

      try {
        await deleteAdminGalleryPhoto(token, photoId);
        toast({ title: "Media removed", description: "Removed from gallery and storage." });
        await catalog.loadData();
      } catch (err) {
        toastApiError(err, "Error");
      }
    },
    [catalog],
  );

  return {
    catalog,
    library,
    form,
    isPhotoModalOpen,
    isSubmittingPhoto,
    openPhotoModalForCreate,
    openUploadToCategory,
    closePhotoModal,
    startPhotoEdit,
    onSubmitPhoto,
    onTogglePhotoActive,
    onDisablePhoto,
  };
}
