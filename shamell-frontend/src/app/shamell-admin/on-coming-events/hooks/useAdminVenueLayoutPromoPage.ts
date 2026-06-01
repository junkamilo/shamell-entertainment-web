"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { toast } from "@/hooks/use-toast";
import { notifyOnComingEventsSettingsChanged } from "@/lib/onComingEventsSettingsEvents";
import { fetchAdminVenueLayoutSettings } from "../services/fetchAdminVenueLayoutSettings";
import { patchAdminVenueLayoutEnabled } from "../services/patchAdminVenueLayoutEnabled";
import { patchAdminVenueLayoutSettings } from "../services/patchAdminVenueLayoutSettings";
import type { VenueLayoutClientSettings } from "../types/venueLayoutPromo.types";

export function useAdminVenueLayoutPromoPage() {
  const [settings, setSettingsState] = useState<VenueLayoutClientSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");

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
  }, []);

  const openModal = useCallback(() => {
    syncFormFromSettings(settings);
    setIsModalOpen(true);
  }, [settings, syncFormFromSettings]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

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

      const title = promoTitle.trim();
      const description = promoDescription.trim();
      if (!title || !description) {
        toast({
          variant: "destructive",
          title: "Check the form",
          description: "Title and description are required.",
        });
        return;
      }

      setIsSubmitting(true);
      const patchResult = await patchAdminVenueLayoutSettings(token, {
        promoTitle: title,
        promoDescription: description,
      });
      setIsSubmitting(false);

      if (!patchResult.ok) {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: patchResult.message ?? "Try again.",
        });
        return;
      }

      if (patchResult.settings) setSettings(patchResult.settings);
      closeModal();
      toast({ title: "Home section saved", description: "Title and description updated on the site." });
    },
    [promoTitle, promoDescription, closeModal, setSettings],
  );

  return {
    settings,
    setSettings,
    isLoading,
    isModalOpen,
    openModal,
    closeModal,
    isSubmitting,
    isTogglingPublish,
    toggleClientEnabled,
    onSubmit,
    promoTitle,
    setPromoTitle,
    promoDescription,
    setPromoDescription,
  };
}
