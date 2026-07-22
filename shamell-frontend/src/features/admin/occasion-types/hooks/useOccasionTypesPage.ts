"use client";

import { type FormEvent, useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getOccasionTypesBearerToken } from "../lib/occasionTypesAuth";
import {
  canDeleteOccasionType,
  cannotDeactivateWhileActive,
  getDeactivateBlockedDescription,
  getDeleteBlockedDescription,
} from "../lib/occasionTypesUsage";
import { deleteAdminOccasionType } from "../services/deleteAdminOccasionType";
import {
  patchAdminOccasionType,
  patchAdminOccasionTypeActive,
} from "../services/patchAdminOccasionType";
import { postAdminOccasionType } from "../services/postAdminOccasionType";
import type { OccasionTypeItem } from "../types/occasionTypes.types";
import { useOccasionTypesForm } from "./useOccasionTypesForm";
import { useOccasionTypesList } from "./useOccasionTypesList";

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

export function useOccasionTypesPage() {
  const list = useOccasionTypesList();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OccasionTypeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useOccasionTypesForm({
    rows: list.rows,
    isSubmitting,
  });

  const openCreateModal = useCallback(() => {
    form.resetForm();
    setIsModalOpen(true);
  }, [form]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    form.resetForm();
  }, [form]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const token = getOccasionTypesBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an admin.",
        });
        return;
      }

      if (!form.canSubmit) {
        const validationError = form.getValidationError();
        toast({
          variant: "destructive",
          title: "Check the form",
          description: validationError ?? "Invalid name or no changes.",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const body = { name: form.trimmedName };
        if (form.editingId) {
          await patchAdminOccasionType(token, form.editingId, body);
        } else {
          await postAdminOccasionType(token, body);
        }

        toast({
          title: form.editingId ? "Updated" : "Created",
          description: form.editingId ? "Occasion type updated." : "Occasion type created.",
        });
        setIsModalOpen(false);
        form.resetForm();
        await list.loadRows();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, list],
  );

  const startEdit = useCallback(
    (item: OccasionTypeItem) => {
      form.startEdit(item);
      setIsModalOpen(true);
    },
    [form],
  );

  const onToggleActive = useCallback(
    async (item: OccasionTypeItem) => {
      if (cannotDeactivateWhileActive(item)) return;

      const token = getOccasionTypesBearerToken();
      if (!token) return;

      setTogglingId(item.id);
      try {
        await patchAdminOccasionTypeActive(token, item.id, !item.isActive);
        toast({ title: item.isActive ? "Hidden" : "Visible" });
        await list.loadRows();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setTogglingId(null);
      }
    },
    [list],
  );

  const openDeleteConfirm = useCallback((item: OccasionTypeItem) => {
    if (!canDeleteOccasionType(item)) return;
    setPendingDelete(item);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const token = getOccasionTypesBearerToken();
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
      await deleteAdminOccasionType(token, pendingDelete.id);

      if (form.editingId === pendingDelete.id) {
        form.resetForm();
        setIsModalOpen(false);
      }

      toast({
        title: "Type deleted",
        description: "The occasion type was removed from the catalog.",
      });
      setPendingDelete(null);
      await list.loadRows();
    } catch (err) {
      toastApiError(err, "Error");
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, form, list]);

  const closeDeleteModal = useCallback(() => {
    if (!isDeleting) setPendingDelete(null);
  }, [isDeleting]);

  return {
    list,
    form,
    isModalOpen,
    isSubmitting,
    togglingId,
    pendingDelete,
    isDeleting,
    openCreateModal,
    closeModal,
    onSubmit,
    startEdit,
    onToggleActive,
    openDeleteConfirm,
    onConfirmDelete,
    closeDeleteModal,
    canDeleteOccasionType,
    cannotDeactivateWhileActive,
    getDeactivateBlockedDescription,
    getDeleteBlockedDescription,
  };
}
