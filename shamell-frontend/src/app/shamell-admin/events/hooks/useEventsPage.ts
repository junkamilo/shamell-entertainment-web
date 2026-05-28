"use client";

import { type FormEvent, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { getEventsBearerToken } from "../lib/eventsAuth";
import {
  canDeleteEvent,
  cannotDeactivateWhileActive,
  deleteBlockedReason,
} from "../lib/eventsUsage";
import { deleteAdminEvent } from "../services/deleteAdminEvent";
import { deleteGalleryAdminPhoto } from "../services/deleteGalleryAdminPhoto";
import { patchAdminEvent, patchAdminEventActive } from "../services/patchAdminEvent";
import { postAdminEvent } from "../services/postAdminEvent";
import { postAdminEventCatalogImages } from "../services/postAdminEventCatalogImages";
import type { AdminEvent, EventsEventTypeOption } from "../types/events.types";
import {
  fetchAdminVenueConfig,
  patchAdminVenueConfig,
} from "@/app/shamell-admin/on-coming-events/services/patchAdminVenueConfig";
import { useReservationEventTemplateOptions } from "@/app/shamell-admin/on-coming-events/reservation-events/hooks/useReservationEventTemplateOptions";
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

type UseEventsPageOptions = {
  upcomingOnly?: boolean;
  embedded?: boolean;
};

export function useEventsPage(options?: UseEventsPageOptions) {
  const pathname = usePathname();
  const isUpcomingAdminRoute =
    options?.upcomingOnly === true ||
    pathname.startsWith("/shamell-admin/upcoming-events");
  const defaultPublicSection = isUpcomingAdminRoute ? "UPCOMING_EVENTS" : "GENERAL";
  const defaultListSectionFilter = isUpcomingAdminRoute ? "UPCOMING_EVENTS" : "GENERAL";
  const catalogPublicSection = isUpcomingAdminRoute ? "UPCOMING_EVENTS" : undefined;
  const embedded = options?.embedded === true;
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

  const catalog = useEventsCatalog(seedEventTypes, {
    publicSection: catalogPublicSection,
  });
  const list = useEventsList(catalog.events, defaultListSectionFilter);
  const reservationTemplates = useReservationEventTemplateOptions(isUpcomingAdminRoute);
  const form = useEventsForm({
    eventTypes: catalog.eventTypes,
    eventTypeId,
    setEventTypeId,
    isSubmitting,
    defaultPublicSection,
    freeEventNameMode: isUpcomingAdminRoute,
    reservationTemplates: reservationTemplates.templates,
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

        if (savedId && isUpcomingAdminRoute && form.reservationEventTemplateId) {
          const linkResult = await patchAdminVenueConfig(token, savedId, {
            reservationEventTemplateId: form.reservationEventTemplateId,
          });
          if (!linkResult.ok) {
            toast({
              variant: "destructive",
              title: "Schedule not linked",
              description: linkResult.message ?? "Could not apply the reservation event schedule.",
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
    [form, closeModal, catalog, isUpcomingAdminRoute],
  );

  const startEdit = useCallback(
    async (item: AdminEvent) => {
      let linkedTemplateId = "";
      if (isUpcomingAdminRoute) {
        const token = getEventsBearerToken();
        if (token) {
          const configResult = await fetchAdminVenueConfig(token, item.id);
          linkedTemplateId = configResult.config?.reservationEventTemplateId ?? "";
        }
      }
      form.startEdit(item, linkedTemplateId);
      setIsModalOpen(true);
    },
    [form, isUpcomingAdminRoute],
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
    const blocked = deleteBlockedReason(item);
    if (blocked) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description: blocked,
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
    embedded,
    upcomingOnly: isUpcomingAdminRoute,
    pageTitle: isUpcomingAdminRoute ? "Upcoming Events" : "Events",
    createLabel: isUpcomingAdminRoute ? "New upcoming event" : "New event",
    catalog,
    list,
    form,
    reservationTemplates,
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
