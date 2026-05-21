"use client";

import { type FormEvent, useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getHeaderMediaBearerToken } from "../lib/headerMediaAuth";
import { deleteAdminHeaderPhoto } from "../services/deleteAdminHeaderPhoto";
import { patchAdminHeaderPhotoActive } from "../services/patchAdminHeaderPhotoActive";
import { postAdminHeaderPhotos } from "../services/postAdminHeaderPhotos";
import type { HeaderPhoto } from "../types/headerMedia.types";
import { useHeaderMediaFocus } from "./useHeaderMediaFocus";
import { useHeaderMediaLibrary } from "./useHeaderMediaLibrary";
import { useHeaderMediaUpload } from "./useHeaderMediaUpload";

export function useHeaderMediaPage() {
  const library = useHeaderMediaLibrary();
  const upload = useHeaderMediaUpload();
  const focus = useHeaderMediaFocus({ setPhotos: library.setPhotos });

  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<HeaderPhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const token = getHeaderMediaBearerToken();
      if (!token) return;
      if (!upload.pendingFiles.length) {
        toast({
          variant: "destructive",
          title: "File required",
          description: "Select at least one image or video.",
        });
        return;
      }

      setIsSaving(true);
      try {
        await postAdminHeaderPhotos(token, upload.pendingFiles);
        toast({
          title: "Media uploaded",
          description: "Main header images and videos were saved.",
        });
        upload.clearPending();
        await library.loadData();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            err instanceof Error ? err.message : "Could not upload header photos.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [upload, library],
  );

  const onToggle = useCallback(
    async (photo: HeaderPhoto) => {
      const token = getHeaderMediaBearerToken();
      if (!token) return;
      try {
        await patchAdminHeaderPhotoActive(token, photo.id, !photo.isActive);
        await library.loadData();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            err instanceof Error ? err.message : "Could not update the item status.",
        });
      }
    },
    [library],
  );

  const openDeleteConfirm = useCallback((photo: HeaderPhoto) => {
    setPendingDelete(photo);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (!isDeleting) setPendingDelete(null);
  }, [isDeleting]);

  const onConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const token = getHeaderMediaBearerToken();
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAdminHeaderPhoto(token, pendingDelete.id);
      focus.clearFocusIfDeleted(pendingDelete.id);
      toast({
        title: "Item removed",
        description: "The item was removed from the main header.",
      });
      setPendingDelete(null);
      await library.loadData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Could not delete the item.",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, focus, library]);

  return {
    library,
    upload,
    focus,
    isSaving,
    pendingDelete,
    isDeleting,
    onSubmit,
    onToggle,
    openDeleteConfirm,
    closeDeleteModal,
    onConfirmDelete,
  };
}
