"use client";

import { type Dispatch, type MouseEvent, type SetStateAction, useCallback, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { clampPercent, headerLibraryItemIsVideo } from "../lib/headerMediaUtils";
import { getHeaderMediaBearerToken } from "../lib/headerMediaAuth";
import { patchAdminHeaderPhotoFocal } from "../services/patchAdminHeaderPhotoFocal";
import type { FocusDraft, HeaderPhoto } from "../types/headerMedia.types";

type UseHeaderMediaFocusArgs = {
  setPhotos: Dispatch<SetStateAction<HeaderPhoto[]>>;
};

export function useHeaderMediaFocus({ setPhotos }: UseHeaderMediaFocusArgs) {
  const [editingFocusPhoto, setEditingFocusPhoto] = useState<HeaderPhoto | null>(null);
  const [focusDraft, setFocusDraft] = useState<FocusDraft>({
    desktopX: 50,
    desktopY: 35,
    mobileX: 50,
    mobileY: 35,
  });
  const [isSavingFocus, setIsSavingFocus] = useState(false);

  const focusEditorIsVideo = useMemo(
    () => (editingFocusPhoto ? headerLibraryItemIsVideo(editingFocusPhoto) : false),
    [editingFocusPhoto],
  );

  const openFocusEditor = useCallback((photo: HeaderPhoto) => {
    setEditingFocusPhoto(photo);
    setFocusDraft({
      desktopX: clampPercent(photo.focalX),
      desktopY: clampPercent(photo.focalY),
      mobileX: clampPercent(photo.focalMobileX),
      mobileY: clampPercent(photo.focalMobileY),
    });
  }, []);

  const closeFocusEditor = useCallback(() => {
    if (isSavingFocus) return;
    setEditingFocusPhoto(null);
  }, [isSavingFocus]);

  const setDraftFromPoint = useCallback(
    (event: MouseEvent<HTMLDivElement>, target: "desktop" | "mobile") => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      const nextX = clampPercent(x);
      const nextY = clampPercent(y);
      setFocusDraft((prev) =>
        target === "desktop"
          ? { ...prev, desktopX: nextX, desktopY: nextY }
          : { ...prev, mobileX: nextX, mobileY: nextY },
      );
    },
    [],
  );

  const saveFocusEditor = useCallback(async () => {
    if (!editingFocusPhoto) return;
    const token = getHeaderMediaBearerToken();
    if (!token) return;
    setIsSavingFocus(true);
    try {
      const body = {
        focalX: clampPercent(focusDraft.desktopX),
        focalY: clampPercent(focusDraft.desktopY),
        focalMobileX: clampPercent(focusDraft.mobileX),
        focalMobileY: clampPercent(focusDraft.mobileY),
      };
      await patchAdminHeaderPhotoFocal(token, editingFocusPhoto.id, body);
      setPhotos((prev) =>
        prev.map((item) =>
          item.id === editingFocusPhoto.id
            ? {
                ...item,
                focalX: body.focalX,
                focalY: body.focalY,
                focalMobileX: body.focalMobileX,
                focalMobileY: body.focalMobileY,
              }
            : item,
        ),
      );
      toast({
        title: "Focus updated",
        description: "Focal point saved for desktop and mobile.",
      });
      setEditingFocusPhoto(null);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Could not save the focal point.",
      });
    } finally {
      setIsSavingFocus(false);
    }
  }, [editingFocusPhoto, focusDraft, setPhotos]);

  const clearFocusIfDeleted = useCallback((deletedId: string) => {
    setEditingFocusPhoto((current) => (current?.id === deletedId ? null : current));
  }, []);

  return {
    editingFocusPhoto,
    focusDraft,
    setFocusDraft,
    isSavingFocus,
    focusEditorIsVideo,
    openFocusEditor,
    closeFocusEditor,
    setDraftFromPoint,
    saveFocusEditor,
    clearFocusIfDeleted,
  };
}
