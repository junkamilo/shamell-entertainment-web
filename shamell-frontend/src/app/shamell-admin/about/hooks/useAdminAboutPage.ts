"use client";

import { useCallback, useState } from "react";
import { useAdminAboutForm } from "./useAdminAboutForm";
import { useAdminAboutRecord } from "./useAdminAboutRecord";
import { useAboutHeroLightbox } from "./useAboutHeroLightbox";

export function useAdminAboutPage() {
  const { record, isLoading, reload, stats, coreValuesList } = useAdminAboutRecord();
  const lightbox = useAboutHeroLightbox();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteHeroConfirmOpen, setIsDeleteHeroConfirmOpen] = useState(false);

  const form = useAdminAboutForm({
    record,
    onSaved: reload,
    closeHeroLightbox: lightbox.closeHeroLightbox,
  });

  const openAboutModal = useCallback(() => {
    form.syncFormFromRecord(record);
    lightbox.closeHeroLightbox(true);
    setIsModalOpen(true);
  }, [form, lightbox, record]);

  const closeAboutModal = useCallback(() => {
    setIsModalOpen(false);
    setIsDeleteHeroConfirmOpen(false);
    lightbox.closeHeroLightbox(true);
    form.resetFormOnClose();
  }, [form, lightbox]);

  const closeDeleteHeroModal = useCallback(() => {
    if (!form.isDeletingHero) setIsDeleteHeroConfirmOpen(false);
  }, [form.isDeletingHero]);

  const openDeleteHeroConfirm = useCallback(() => {
    setIsDeleteHeroConfirmOpen(true);
  }, []);

  const confirmDeleteHero = useCallback(async () => {
    const ok = await form.deleteSavedHeroMedia();
    if (ok) setIsDeleteHeroConfirmOpen(false);
  }, [form]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      const ok = await form.onSubmit(event);
      if (ok) closeAboutModal();
    },
    [form, closeAboutModal],
  );

  return {
    record,
    isLoading,
    stats,
    coreValuesList,
    isModalOpen,
    isDeleteHeroConfirmOpen,
    openAboutModal,
    closeAboutModal,
    openDeleteHeroConfirm,
    closeDeleteHeroModal,
    confirmDeleteHero,
    handleSubmit,
    ...lightbox,
    ...form,
  };
}
