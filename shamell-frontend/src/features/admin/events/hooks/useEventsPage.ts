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
} from "@/features/admin/on-coming-events/services/patchAdminVenueConfig";
import { postAdminRegenerateClassSessions } from "@/features/admin/on-coming-events/services/postAdminRegenerateClassSessions";
import { fetchAdminReservationEventTemplates } from "@/features/admin/on-coming-events/reservation-events/services/fetchAdminReservationEventTemplates";
import { createAdminReservationEventTemplate } from "@/features/admin/on-coming-events/reservation-events/services/createAdminReservationEventTemplate";
import { patchAdminReservationEventTemplate } from "@/features/admin/on-coming-events/reservation-events/services/patchAdminReservationEventTemplate";
import { scheduleFormToTemplateBody } from "@/features/admin/on-coming-events/reservation-events/lib/scheduleFormBody";
import { parseOptionalPrice } from "../lib/eventsPrice";
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
    pathname.startsWith("/admin/upcoming-events") ||
    pathname.startsWith("/admin/on-coming-events") ||
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
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

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

  const queueCatalogMediaUpload = useCallback(
    (token: string, eventId: string, files: File[]) => {
      if (files.length === 0) return;
      const count = files.length;
      toast({
        title: "Uploading media in background",
        description:
          count === 1
            ? "1 file is uploading. You can keep working."
            : `${count} files are uploading. You can keep working.`,
      });
      void (async () => {
        try {
          await postAdminEventCatalogImages(token, eventId, files);
          toast({
            title: "Media uploaded",
            description:
              count === 1
                ? "The catalog file was uploaded successfully."
                : "Catalog files were uploaded successfully.",
          });
        } catch (err) {
          toast({
            variant: "destructive",
            title: "Media not saved",
            description: err instanceof Error ? err.message : "Catalog media upload failed.",
          });
        } finally {
          await catalog.loadAllData();
        }
      })();
    },
    [catalog],
  );

  const syncUpcomingSchedule = useCallback(
    async (token: string, eventId: string) => {
      if (form.experienceMode === "NORMAL") {
        if (!form.linkedTemplateId) return;
        const unlink = await patchAdminVenueConfig(token, eventId, {
          reservationEventTemplateId: null,
        });
        if (!unlink.ok) {
          throw new Error(unlink.message ?? "Could not detach the previous schedule.");
        }
        return;
      }

      const templateBody = scheduleFormToTemplateBody(form.eventName, form.schedule);
      const templateResult = form.linkedTemplateId
        ? await patchAdminReservationEventTemplate(token, form.linkedTemplateId, templateBody)
        : await createAdminReservationEventTemplate(token, templateBody);

      if (!templateResult.ok || !templateResult.template) {
        throw new Error(templateResult.message ?? "Could not save the event schedule.");
      }

      const venueConfigBody: {
        reservationEventTemplateId: string;
        clientEnabled?: boolean;
        fixedTicketCapacity?: number | null;
        classPackageEnabled?: boolean;
        classPackagePrice?: number | null;
        classPackageLabel?: string | null;
      } = {
        reservationEventTemplateId: templateResult.template.id,
      };

      if (form.experienceMode === "RECURRING_WEEKLY") {
        const pkgPrice = parseOptionalPrice(form.monthPackagePrice, "create");
        venueConfigBody.classPackageEnabled = form.monthPackageEnabled;
        venueConfigBody.classPackagePrice =
          form.monthPackageEnabled && pkgPrice.ok && pkgPrice.value != null
            ? pkgPrice.value
            : null;
        venueConfigBody.classPackageLabel =
          form.monthPackageEnabled && form.monthPackageLabel.trim()
            ? form.monthPackageLabel.trim()
            : null;
      }

      if (form.experienceMode === "FIXED_EVENT") {
        venueConfigBody.clientEnabled = form.enableVenueSeating;
        venueConfigBody.fixedTicketCapacity = form.enableVenueSeating
          ? null
          : (() => {
              const capacity = Number.parseInt(form.fixedTicketCapacityInput.trim(), 10);
              return Number.isFinite(capacity) && capacity >= 1 ? capacity : null;
            })();
      }

      const linkResult = await patchAdminVenueConfig(token, eventId, venueConfigBody);
      if (!linkResult.ok) {
        throw new Error(linkResult.message ?? "Could not apply the event schedule.");
      }

      if (form.experienceMode === "RECURRING_WEEKLY") {
        const regen = await postAdminRegenerateClassSessions(token, eventId);
        if (!regen.ok) {
          throw new Error(
            regen.message ??
              "Schedule saved but class sessions could not be generated. Try saving again.",
          );
        }
      }

      if (
        form.experienceMode === "FIXED_EVENT" &&
        !form.enableVenueSeating &&
        venueConfigBody.fixedTicketCapacity != null &&
        linkResult.config?.fixedTicketCapacity !== venueConfigBody.fixedTicketCapacity
      ) {
        throw new Error(
          `Expected ${venueConfigBody.fixedTicketCapacity} tickets but saved ${linkResult.config?.fixedTicketCapacity ?? "none"}. Try saving again.`,
        );
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
        setValidationAlert(validationError);
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

        const pendingMediaFiles = savedId ? [...form.pendingFiles] : [];
        const hasSchedule = Boolean(savedId) && isUpcomingAdminRoute;

        if (savedId && hasSchedule) {
          setSubmittingMessage(
            form.experienceMode === "RECURRING_WEEKLY"
              ? "Saving schedule and class sessions…"
              : "Applying schedule…",
          );
          await syncUpcomingSchedule(token, savedId);
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
        if (savedId && pendingMediaFiles.length > 0) {
          queueCatalogMediaUpload(token, savedId, pendingMediaFiles);
        }
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
      queueCatalogMediaUpload,
      syncUpcomingSchedule,
      catalog,
    ],
  );

  const startEdit = useCallback(
    async (item: AdminEvent) => {
      let linkedTemplate = null;
      let venueClientEnabled = false;
      let venueFixedTicketCapacity: number | null = null;
      let venueMonthPackage: {
        enabled: boolean;
        price: number | null;
        label: string | null;
      } | null = null;
      if (isUpcomingAdminRoute) {
        const token = getEventsBearerToken();
        if (token) {
          const configResult = await fetchAdminVenueConfig(token, item.id);
          linkedTemplate = configResult.config?.reservationEventTemplate ?? null;
          venueClientEnabled = configResult.config?.clientEnabled ?? false;
          venueFixedTicketCapacity = configResult.config?.fixedTicketCapacity ?? null;
          venueMonthPackage = configResult.config
            ? {
                enabled: configResult.config.classPackageEnabled,
                price: configResult.config.classPackagePrice,
                label: configResult.config.classPackageLabel,
              }
            : null;

          if (!linkedTemplate) {
            const templatesResult = await fetchAdminReservationEventTemplates(token);
            if (templatesResult.ok) {
              const eventName = item.eventTypeName.trim().toLowerCase();
              linkedTemplate =
                templatesResult.templates.find((template) => {
                  if (template.name.trim().toLowerCase() !== eventName) return false;
                  const linkedIds = template.linkedEventIds ?? [];
                  return linkedIds.length === 0 || linkedIds.includes(item.id);
                }) ?? null;
            }
          }
        }
      }
      form.startEdit(
        item,
        linkedTemplate,
        venueClientEnabled,
        venueFixedTicketCapacity,
        venueMonthPackage,
      );
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
    validationAlert,
    closeValidationAlert: () => setValidationAlert(null),
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
