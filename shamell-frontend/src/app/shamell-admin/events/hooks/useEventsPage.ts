"use client";

import { type FormEvent, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { getEventsBearerToken } from "../lib/eventsAuth";
import {
  canDeleteEvent,
  cannotDeactivateWhileActive,
  getDeactivateBlockedDescription,
  getDeleteBlockedDescription,
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
import { createAdminReservationEventTemplate } from "@/app/shamell-admin/on-coming-events/reservation-events/services/createAdminReservationEventTemplate";
import { patchAdminReservationEventTemplate } from "@/app/shamell-admin/on-coming-events/reservation-events/services/patchAdminReservationEventTemplate";
import { scheduleFormToTemplateBody } from "@/app/shamell-admin/on-coming-events/reservation-events/lib/scheduleFormBody";
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
    pathname.startsWith("/shamell-admin/upcoming-events") ||
    pathname.startsWith("/shamell-admin/on-coming-events");
  const defaultPublicSection = isUpcomingAdminRoute ? "UPCOMING_EVENTS" : "GENERAL";
  const defaultListSectionFilter = isUpcomingAdminRoute ? "UPCOMING_EVENTS" : "GENERAL";
  const catalogPublicSection: "GENERAL" | "UPCOMING_EVENTS" = isUpcomingAdminRoute
    ? "UPCOMING_EVENTS"
    : "GENERAL";
  const embedded = options?.embedded === true;
  const [eventTypeId, setEventTypeId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingMessage, setSubmittingMessage] = useState<string | null>(null);
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
  const form = useEventsForm({
    eventTypes: catalog.eventTypes,
    eventTypeId,
    setEventTypeId,
    isSubmitting,
    defaultPublicSection,
    freeEventNameMode: isUpcomingAdminRoute,
  });

  const openCreateModal = useCallback(() => {
    form.resetForm();
    setIsModalOpen(true);
  }, [form]);

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    form.resetForm();
  }, [form, isSubmitting]);

  const uploadCatalogMedia = useCallback(
    async (token: string, eventId: string, files: File[]) => {
      if (files.length === 0) return;
      try {
        await postAdminEventCatalogImages(token, eventId, files);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Media not saved",
          description: err instanceof Error ? err.message : "Catalog media upload failed.",
        });
      }
    },
    [],
  );

  const syncUpcomingSchedule = useCallback(
    async (token: string, eventId: string) => {
      if (form.experienceMode === "NORMAL") {
        if (!form.linkedTemplateId) return;
        const unlink = await patchAdminVenueConfig(token, eventId, {
          reservationEventTemplateId: null,
        });
        if (!unlink.ok) {
          toast({
            variant: "destructive",
            title: "Schedule not cleared",
            description: unlink.message ?? "Could not detach the previous schedule.",
          });
        }
        return;
      }

      const templateBody = scheduleFormToTemplateBody(form.eventName, form.schedule);
      const templateResult = form.linkedTemplateId
        ? await patchAdminReservationEventTemplate(token, form.linkedTemplateId, templateBody)
        : await createAdminReservationEventTemplate(token, templateBody);

      if (!templateResult.ok || !templateResult.template) {
        toast({
          variant: "destructive",
          title: "Schedule not saved",
          description: templateResult.message ?? "Could not save the event schedule.",
        });
        return;
      }

      const linkResult = await patchAdminVenueConfig(token, eventId, {
        reservationEventTemplateId: templateResult.template.id,
        ...(form.experienceMode === "FIXED_EVENT"
          ? { clientEnabled: form.enableVenueSeating }
          : {}),
      });
      if (!linkResult.ok) {
        toast({
          variant: "destructive",
          title: "Schedule not linked",
          description: linkResult.message ?? "Could not apply the event schedule.",
        });
        return;
      }

      if (form.experienceMode === "FIXED_EVENT") {
        const capacity = Number.parseInt(form.fixedTicketCapacityInput.trim(), 10);
        const capacityResult = await patchAdminVenueConfig(token, eventId, {
          clientEnabled: form.enableVenueSeating,
          fixedTicketCapacity:
            form.enableVenueSeating
              ? null
              : Number.isFinite(capacity) && capacity >= 1
                ? capacity
                : null,
        });
        if (!capacityResult.ok) {
          toast({
            variant: "destructive",
            title: "Ticket capacity not saved",
            description: capacityResult.message ?? "Could not save ticket capacity.",
          });
          return;
        }
        if (
          !form.enableVenueSeating &&
          capacityResult.config?.fixedTicketCapacity !== capacity
        ) {
          toast({
            variant: "destructive",
            title: "Ticket capacity mismatch",
            description: `Expected ${capacity} tickets but saved ${capacityResult.config?.fixedTicketCapacity ?? "none"}. Try saving again.`,
          });
          return;
        }
      }
    },
    [form],
  );

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
      setSubmittingMessage("Saving event…");
      try {
        let savedId = form.editingId ?? undefined;
        if (form.editingId) {
          await patchAdminEvent(token, form.editingId, form.buildUpdateBody());
        } else {
          const result = await postAdminEvent(token, form.buildCreateBody());
          savedId = result.id;
        }

        if (savedId) {
          const followUp: Promise<void>[] = [];
          const hasMedia = form.pendingFiles.length > 0;
          const hasSchedule = isUpcomingAdminRoute;

          if (hasMedia) {
            followUp.push(uploadCatalogMedia(token, savedId, form.pendingFiles));
          }
          if (hasSchedule) {
            followUp.push(syncUpcomingSchedule(token, savedId));
          }

          if (followUp.length > 0) {
            setSubmittingMessage(
              hasMedia && hasSchedule
                ? "Uploading media and applying schedule…"
                : hasMedia
                  ? "Uploading catalog media…"
                  : "Applying schedule…",
            );
            await Promise.all(followUp);
          }
        }

        const wasEditing = Boolean(form.editingId);
        setIsModalOpen(false);
        form.resetForm();
        toast({
          title: wasEditing ? "Event updated" : "Event created",
          description: wasEditing
            ? "Event changes were saved successfully."
            : "The new event was created successfully.",
        });
        void catalog.loadAllData();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setIsSubmitting(false);
        setSubmittingMessage(null);
      }
    },
    [
      form,
      isUpcomingAdminRoute,
      uploadCatalogMedia,
      syncUpcomingSchedule,
      catalog,
    ],
  );

  const startEdit = useCallback(
    async (item: AdminEvent) => {
      let linkedTemplate = null;
      let venueClientEnabled = false;
      let venueFixedTicketCapacity: number | null = null;
      if (isUpcomingAdminRoute) {
        const token = getEventsBearerToken();
        if (token) {
          const configResult = await fetchAdminVenueConfig(token, item.id);
          linkedTemplate = configResult.config?.reservationEventTemplate ?? null;
          venueClientEnabled = configResult.config?.clientEnabled ?? false;
          venueFixedTicketCapacity = configResult.config?.fixedTicketCapacity ?? null;
        }
      }
      form.startEdit(item, linkedTemplate, venueClientEnabled, venueFixedTicketCapacity);
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
      if (item.isActive && (item.bookingCount ?? 0) > 0) return;

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
    if (!canDeleteEvent(item)) return;
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
    eventTypeId,
    setEventTypeId,
    isModalOpen,
    isSubmitting,
    submittingMessage,
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
    getDeactivateBlockedDescription,
    getDeleteBlockedDescription,
  };
}
