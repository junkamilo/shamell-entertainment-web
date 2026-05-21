"use client";

import { type FormEvent, useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getEventTypesBearerToken } from "../lib/eventTypesAuth";
import { canDeleteEventType, cannotDeactivateWhileActive, hasBlockingUsage } from "../lib/eventTypesUsage";
import { deleteAdminEventType } from "../services/deleteAdminEventType";
import { patchAdminEventType, patchAdminEventTypeActive } from "../services/patchAdminEventType";
import { postAdminEventType } from "../services/postAdminEventType";
import type { EventTypeItem } from "../types/eventTypes.types";
import { useEventTypesForm } from "./useEventTypesForm";
import { useEventTypesList } from "./useEventTypesList";
import { useEventTypesOccasionCatalog } from "./useEventTypesOccasionCatalog";

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

export function useEventTypesPage() {
  const list = useEventTypesList();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EventTypeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { occasionCatalog } = useEventTypesOccasionCatalog(isModalOpen);
  const form = useEventTypesForm({
    types: list.types,
    occasionCatalog,
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

      const token = getEventTypesBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an admin.",
        });
        return;
      }

      const validationError = form.getNameValidationError();
      if (validationError) {
        toast({
          variant: "destructive",
          title: "Check the form",
          description: validationError,
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const body = form.buildUpsertBody();
        if (form.editingId) {
          await patchAdminEventType(token, form.editingId, body);
        } else {
          await postAdminEventType(token, body);
        }

        toast({
          title: form.editingId ? "Type updated" : "Type created",
          description: form.editingId
            ? "Event type changes were saved."
            : "The new event type was created successfully.",
        });
        form.resetForm();
        setIsModalOpen(false);
        await list.loadTypes();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, list],
  );

  const startEdit = useCallback(
    (item: EventTypeItem) => {
      form.startEdit(item);
      setIsModalOpen(true);
    },
    [form],
  );

  const onToggleActive = useCallback(
    async (item: EventTypeItem) => {
      if (item.isActive && hasBlockingUsage(item)) {
        toast({
          variant: "destructive",
          title: "Cannot turn off",
          description:
            "This type has catalog events, bookings, or gallery photos linked. Remove or reassign that data first.",
        });
        return;
      }

      const token = getEventTypesBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an admin.",
        });
        return;
      }

      setTogglingId(item.id);
      try {
        await patchAdminEventTypeActive(token, item.id, !item.isActive);

        if (form.editingId === item.id && !item.isActive) {
          form.resetForm();
        }

        toast({
          title: item.isActive ? "Type hidden" : "Type visible",
          description: item.isActive
            ? "The event type was turned off."
            : "The event type was turned on.",
        });
        await list.loadTypes();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setTogglingId(null);
      }
    },
    [form, list],
  );

  const openDeleteConfirm = useCallback((item: EventTypeItem) => {
    if (!canDeleteEventType(item)) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description:
          "There are catalog events, bookings, or gallery photos linked to this type. Remove or reassign them first.",
      });
      return;
    }
    setPendingDelete(item);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const token = getEventTypesBearerToken();
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
      await deleteAdminEventType(token, pendingDelete.id);

      if (form.editingId === pendingDelete.id) {
        form.resetForm();
        setIsModalOpen(false);
      }

      toast({
        title: "Type deleted",
        description: "The event type was removed from the catalog.",
      });
      setPendingDelete(null);
      await list.loadTypes();
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
    occasionCatalog,
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
    cannotDeactivateWhileActive,
    canDeleteEventType,
  };
}
