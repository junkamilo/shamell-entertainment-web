"use client";

import { type FormEvent, useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getEventsBearerToken } from "../lib/eventsAuth";
import { canDeleteEvent, cannotDeactivateWhileActive } from "../lib/eventsUsage";
import { deleteAdminEvent } from "../services/deleteAdminEvent";
import { deleteGalleryAdminPhoto } from "../services/deleteGalleryAdminPhoto";
import { patchAdminEvent, patchAdminEventActive } from "../services/patchAdminEvent";
import { postAdminEvent } from "../services/postAdminEvent";
import { postAdminEventCatalogImages } from "../services/postAdminEventCatalogImages";
import type { AdminEvent, EventsEventTypeOption } from "../types/events.types";
import { useEventsCatalog } from "./useEventsCatalog";
import { useEventsForm } from "./useEventsForm";
import { useEventsList } from "./useEventsList";

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

export function useEventsPage() {
  const [eventTypeId, setEventTypeId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewEvent, setViewEvent] = useState<AdminEvent | null>(null);

  const seedEventTypes = useCallback((types: EventsEventTypeOption[]) => {
    setEventTypeId((current) => {
      if (current) return current;
      const firstActive = types.find((item) => item.isActive);
      return firstActive?.id ?? types[0]?.id ?? "";
    });
  }, []);

  const catalog = useEventsCatalog(seedEventTypes);
  const list = useEventsList(catalog.events);
  const form = useEventsForm({
    eventTypes: catalog.eventTypes,
    eventTypeId,
    setEventTypeId,
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
      const token = getEventsBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an admin to manage events.",
        });
        return;
      }

      const validationError = form.getValidationError();
      if (validationError) {
        toast({ variant: "destructive", title: "Check the form", description: validationError });
        return;
      }

      setIsSubmitting(true);
      try {
        let savedId = form.editingId ?? undefined;
        if (form.editingId) {
          await patchAdminEvent(token, form.editingId, form.buildUpdateBody());
        } else {
          const result = await postAdminEvent(token, form.buildCreateBody());
          savedId = result.id;
        }

        if (savedId && form.pendingFiles.length > 0) {
          try {
            await postAdminEventCatalogImages(token, savedId, form.pendingFiles);
          } catch (err) {
            toast({
              variant: "destructive",
              title: "Media not saved",
              description: err instanceof Error ? err.message : "Catalog media upload failed.",
            });
          }
        }

        const wasEditing = Boolean(form.editingId);
        closeModal();
        toast({
          title: wasEditing ? "Event updated" : "Event created",
          description: wasEditing
            ? "Event changes were saved successfully."
            : "The new event was created successfully.",
        });
        await catalog.loadAllData();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, closeModal, catalog],
  );

  const startEdit = useCallback(
    (item: AdminEvent) => {
      form.startEdit(item);
      setIsModalOpen(true);
    },
    [form],
  );

  const removeExistingCatalogImage = useCallback(
    async (photoId: string) => {
      const token = getEventsBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an admin.",
        });
        return;
      }
      try {
        await deleteGalleryAdminPhoto(token, photoId);
        form.setExistingImages((prev) => prev.filter((p) => p.id !== photoId));
        toast({ title: "Media removed" });
        await catalog.loadAllData();
      } catch (err) {
        toastApiError(err, "Error");
      }
    },
    [form, catalog],
  );

  const onToggleActive = useCallback(
    async (item: AdminEvent) => {
      if (item.isActive && (item.bookingCount ?? 0) > 0) {
        toast({
          variant: "destructive",
          title: "Cannot deactivate",
          description: "This event has linked bookings.",
        });
        return;
      }

      const token = getEventsBearerToken();
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
        await patchAdminEventActive(token, item.id, !item.isActive);
        if (form.editingId === item.id) form.resetForm();
        toast({
          title: item.isActive ? "Event hidden" : "Event visible",
          description: item.isActive
            ? "The event is hidden from the catalog."
            : "The event is visible again in the catalog.",
        });
        await catalog.loadAllData();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setTogglingId(null);
      }
    },
    [form, catalog],
  );

  const openDeleteConfirm = useCallback((item: AdminEvent) => {
    if (!canDeleteEvent(item)) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description:
          (item.bookingCount ?? 0) > 0
            ? "This event has linked bookings."
            : "Remove linked catalog images before deleting this event.",
      });
      return;
    }
    setPendingDelete(item);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const token = getEventsBearerToken();
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
      await deleteAdminEvent(token, pendingDelete.id);
      if (form.editingId === pendingDelete.id) {
        form.resetForm();
        setIsModalOpen(false);
      }
      if (viewEvent?.id === pendingDelete.id) setViewEvent(null);
      toast({
        title: "Event deleted",
        description: "The event was removed from the catalog.",
      });
      setPendingDelete(null);
      await catalog.loadAllData();
    } catch (err) {
      toastApiError(err, "Error");
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, form, viewEvent, catalog]);

  const closeDeleteModal = useCallback(() => {
    if (!isDeleting) setPendingDelete(null);
  }, [isDeleting]);

  return {
    catalog,
    list,
    form,
    eventTypeId,
    setEventTypeId,
    isModalOpen,
    isSubmitting,
    togglingId,
    pendingDelete,
    isDeleting,
    viewEvent,
    setViewEvent,
    openCreateModal,
    closeModal,
    onSubmit,
    startEdit,
    removeExistingCatalogImage,
    onToggleActive,
    openDeleteConfirm,
    onConfirmDelete,
    closeDeleteModal,
    canDeleteEvent,
    cannotDeactivateWhileActive,
  };
}
