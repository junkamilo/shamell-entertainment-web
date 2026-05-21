"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getAdminBearerToken } from "../lib/aboutAdminAuth";
import { parseCoreValuesFromText } from "../lib/aboutAdminUtils";
import { parseAboutAdminError } from "../lib/parseAboutAdminError";
import { deleteAdminAboutHero } from "../services/deleteAdminAboutHero";
import { upsertAdminAbout } from "../services/upsertAdminAbout";
import type { AdminAboutRow } from "../types/aboutAdmin.types";

type UseAdminAboutFormOptions = {
  record: AdminAboutRow | null;
  onSaved: () => Promise<void>;
  closeHeroLightbox: (instant?: boolean) => void;
};

export function useAdminAboutForm({ record, onSaved, closeHeroLightbox }: UseAdminAboutFormOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingHero, setIsDeletingHero] = useState(false);

  const [title, setTitle] = useState("ABOUT SHAMELL");
  const [paragraph1, setParagraph1] = useState("");
  const [coreValuesText, setCoreValuesText] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingHeroMediaType, setExistingHeroMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    if (!imagePreviewUrl) return;
    return () => URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

  const syncFormFromRecord = useCallback((row: AdminAboutRow | null) => {
    if (row) {
      setTitle(row.title ?? "ABOUT SHAMELL");
      setParagraph1(row.paragraph1 ?? "");
      setCoreValuesText(Array.isArray(row.coreValues) ? row.coreValues.join("\n") : "");
      setExistingImageUrl(row.imageUrl ?? null);
      setExistingHeroMediaType(row.heroMediaType === "VIDEO" ? "VIDEO" : "IMAGE");
    } else {
      setTitle("ABOUT SHAMELL");
      setParagraph1("");
      setCoreValuesText("");
      setExistingImageUrl(null);
      setExistingHeroMediaType("IMAGE");
    }
    setImageFile(null);
    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
  }, []);

  const resetFormOnClose = useCallback(() => {
    setImageFile(null);
    setIsDeletingHero(false);
    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
  }, []);

  const discardSelectedFile = useCallback(() => {
    setImageFile(null);
    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    closeHeroLightbox();
  }, [closeHeroLightbox]);

  const deleteSavedHeroMedia = useCallback(async () => {
    if (!existingImageUrl && !record?.imageUrl) return false;

    const token = getAdminBearerToken();
    if (!token) return false;

    setIsDeletingHero(true);
    try {
      const { response, data } = await deleteAdminAboutHero(token);
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Could not remove media",
          description: parseAboutAdminError(data, "Check Cloudinary configuration or try again."),
        });
        return false;
      }

      setExistingImageUrl(null);
      setExistingHeroMediaType("IMAGE");
      closeHeroLightbox(true);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";

      toast({
        title: "Hero media removed",
        description: "You can upload a new image or video when you are ready.",
      });
      await onSaved();
      return true;
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
      return false;
    } finally {
      setIsDeletingHero(false);
    }
  }, [closeHeroLightbox, existingImageUrl, onSaved, record?.imageUrl]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<boolean> => {
      event.preventDefault();
      const token = getAdminBearerToken();
      if (!token) return false;

      const values = parseCoreValuesFromText(coreValuesText);

      if (!title.trim() || !paragraph1.trim() || values.length === 0) {
        toast({
          variant: "destructive",
          title: "Check the form",
          description: "Fill in all required fields.",
        });
        return false;
      }

      setIsSubmitting(true);
      try {
        const { response, data } = await upsertAdminAbout(token, {
          title: title.trim(),
          paragraph1: paragraph1.replace(/^\s+|\s+$/g, ""),
          coreValues: values,
          mediaFile: imageFile,
        });

        if (!response.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: parseAboutAdminError(data, "Could not save About Shamell."),
          });
          return false;
        }

        toast({
          title: record ? "About updated" : "About created",
          description: "About Shamell content was saved successfully.",
        });
        await onSaved();
        return true;
      } catch {
        toast({
          variant: "destructive",
          title: "Offline",
          description: "Could not reach the server.",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [coreValuesText, imageFile, paragraph1, record, title, onSaved],
  );

  return {
    title,
    setTitle,
    paragraph1,
    setParagraph1,
    coreValuesText,
    setCoreValuesText,
    existingImageUrl,
    existingHeroMediaType,
    imageFile,
    setImageFile,
    imagePreviewUrl,
    imageFileInputRef,
    isSubmitting,
    isDeletingHero,
    syncFormFromRecord,
    resetFormOnClose,
    discardSelectedFile,
    deleteSavedHeroMedia,
    onSubmit,
  };
}
