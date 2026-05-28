"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { toast } from "@/hooks/use-toast";
import { notifyOnComingEventsSettingsChanged } from "@/lib/onComingEventsSettingsEvents";
import { deleteAdminVenueLayoutPromoMedia } from "../services/deleteAdminVenueLayoutPromoMedia";
import { fetchAdminVenueLayoutSettings } from "../services/fetchAdminVenueLayoutSettings";
import { patchAdminVenueLayoutEnabled } from "../services/patchAdminVenueLayoutEnabled";
import { patchAdminVenueLayoutSettings } from "../services/patchAdminVenueLayoutSettings";
import { upsertAdminVenueLayoutPromoMedia } from "../services/upsertAdminVenueLayoutPromoMedia";
import type { VenueLayoutClientSettings } from "../types/venueLayoutPromo.types";

export function useAdminVenueLayoutPromoPage() {
  const [settings, setSettingsState] = useState<VenueLayoutClientSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  const reload = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await fetchAdminVenueLayoutSettings(token);
    setIsLoading(false);
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: "Could not load settings",
        description: "Try again or sign in again.",
      });
      return;
    }
    setSettingsState(result.settings);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const syncFormFromSettings = useCallback((row: VenueLayoutClientSettings | null) => {
    setPromoTitle(row?.promoTitle ?? "");
    setPromoDescription(row?.promoDescription ?? "");
    setImageFile(null);
    setImagePreviewUrl(null);
  }, []);

  const openModal = useCallback(() => {
    syncFormFromSettings(settings);
    setIsModalOpen(true);
  }, [settings, syncFormFromSettings]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setImageFile(null);
    setImagePreviewUrl(null);
  }, []);

  const onImageFileChange = useCallback((file: File | null) => {
    setImageFile(file);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
  }, [imagePreviewUrl]);

  const toggleClientEnabled = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) return;
    const next = !(settings?.clientEnabled ?? false);
    setIsTogglingPublish(true);
    const result = await patchAdminVenueLayoutEnabled(token, next);
    setIsTogglingPublish(false);
    if (!result.ok || !result.settings) {
      toast({
        variant: "destructive",
        title: "Publish failed",
        description: result.message ?? "Try again.",
      });
      return;
    }
    setSettingsState(result.settings);
    notifyOnComingEventsSettingsChanged();
    toast({
      title: next ? "On Coming Events is live" : "On Coming Events hidden",
      description: result.message,
    });
  }, [settings?.clientEnabled]);

  const setSettings = useCallback((next: VenueLayoutClientSettings) => {
    setSettingsState(next);
    notifyOnComingEventsSettingsChanged();
  }, []);

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const token = getAdminBearerToken();
      if (!token) return;

      setIsSubmitting(true);
      const patchResult = await patchAdminVenueLayoutSettings(token, {
        promoTitle: promoTitle.trim() || undefined,
        promoDescription: promoDescription.trim() || undefined,
      });
      if (!patchResult.ok) {
        setIsSubmitting(false);
        toast({
          variant: "destructive",
          title: "Save failed",
          description: patchResult.message ?? "Try again.",
        });
        return;
      }

      let latest = patchResult.settings;
      if (imageFile) {
        const mediaResult = await upsertAdminVenueLayoutPromoMedia(token, imageFile);
        if (!mediaResult.ok) {
          setIsSubmitting(false);
          toast({
            variant: "destructive",
            title: "Image upload failed",
            description: mediaResult.message ?? "Try again.",
          });
          return;
        }
        latest = mediaResult.settings;
      }

      setIsSubmitting(false);
      if (latest) setSettings(latest);
      closeModal();
      toast({ title: "Promo content saved" });
    },
    [promoTitle, promoDescription, imageFile, closeModal, setSettings],
  );

  const deletePromoImage = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) return;
    setIsDeletingImage(true);
    const result = await deleteAdminVenueLayoutPromoMedia(token);
    setIsDeletingImage(false);
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: result.message ?? "Try again.",
      });
      return;
    }
    setSettingsState(result.settings);
    setImageFile(null);
    setImagePreviewUrl(null);
    toast({ title: "Promo image removed" });
  }, []);

  return {
    settings,
    setSettings,
    isLoading,
    isModalOpen,
    openModal,
    closeModal,
    isSubmitting,
    isTogglingPublish,
    isDeletingImage,
    toggleClientEnabled,
    onSubmit,
    deletePromoImage,
    promoTitle,
    setPromoTitle,
    promoDescription,
    setPromoDescription,
    imageFile,
    onImageFileChange,
    imagePreviewUrl,
    imageFileInputRef,
    existingImageUrl: settings?.promoImageUrl ?? null,
  };
}
