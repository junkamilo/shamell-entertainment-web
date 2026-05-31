"use client";

import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import {
  emptyScheduleForm,
  scheduleFormFromTemplate,
  type ScheduleFormState,
} from "@/app/shamell-admin/on-coming-events/reservation-events/components/ReservationEventScheduleSections";
import type { ReservationEventTemplate } from "@/app/shamell-admin/on-coming-events/reservation-events/types/reservationEventTemplate.types";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  EVENT_NAME_MAX_LENGTH,
  EVENT_NAME_MIN_LENGTH,
  ITEM_MAX_LENGTH,
  MAX_CATALOG_IMAGES,
} from "../lib/eventsConstants";
import { isCatalogMediaFile } from "../lib/eventsMedia";
import { formatPriceInput, parseOptionalPrice } from "../lib/eventsPrice";
import type { AdminEvent, CatalogImage, EventFormSnapshot, EventsEventTypeOption } from "../types/events.types";
import type { CreateAdminEventBody, UpdateAdminEventBody } from "../types/events.types";
import type {
  EventPublicSection,
  UpcomingClassVariant,
  UpcomingExperienceMode,
  UpcomingExperienceType,
} from "../types/events.types";

type UseEventsFormArgs = {
  eventTypes: EventsEventTypeOption[];
  eventTypeId: string;
  setEventTypeId: Dispatch<SetStateAction<string>>;
  isSubmitting: boolean;
  defaultPublicSection: EventPublicSection;
  freeEventNameMode?: boolean;
};

function experienceFieldsForMode(
  mode: UpcomingExperienceMode,
  enableVenueSeating: boolean,
): {
  experienceType: UpcomingExperienceType | null;
  classVariant: UpcomingClassVariant | null;
} {
  if (mode === "FIXED_EVENT") {
    return enableVenueSeating
      ? { experienceType: "VENUE_SEATING", classVariant: null }
      : { experienceType: null, classVariant: null };
  }
  if (mode === "RECURRING_WEEKLY") return { experienceType: "CLASSES", classVariant: "GROUP" };
  return { experienceType: null, classVariant: null };
}

export function useEventsForm({
  eventTypes,
  eventTypeId,
  setEventTypeId,
  isSubmitting,
  defaultPublicSection,
  freeEventNameMode = false,
}: UseEventsFormArgs) {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [publicSection, setPublicSection] = useState<EventPublicSection>(
    defaultPublicSection,
  );
  const [experienceMode, setExperienceMode] = useState<UpcomingExperienceMode>("NORMAL");
  const [schedule, setSchedule] = useState<ScheduleFormState>(emptyScheduleForm);
  const [enableVenueSeating, setEnableVenueSeating] = useState(false);
  const [fixedTicketCapacityInput, setFixedTicketCapacityInput] = useState("");
  const [linkedTemplateId, setLinkedTemplateId] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<CatalogImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [originalSnapshot, setOriginalSnapshot] = useState<EventFormSnapshot | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const isUpcomingForm = defaultPublicSection === "UPCOMING_EVENTS";
  const scheduleKey = experienceMode === "NORMAL" ? "" : JSON.stringify(schedule);

  const pendingPreviewUrls = useMemo(() => pendingFiles.map((f) => URL.createObjectURL(f)), [pendingFiles]);
  useEffect(() => {
    return () => pendingPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [pendingPreviewUrls]);

  const resetForm = useCallback(() => {
    if (!freeEventNameMode) {
      setEventTypeId((current) => current || eventTypes.find((item) => item.isActive)?.id || "");
    }
    setEventName("");
    setDescription("");
    setItemsText("");
    setPriceInput("");
    setPublicSection(defaultPublicSection);
    setExperienceMode("NORMAL");
    setSchedule(emptyScheduleForm());
    setEnableVenueSeating(false);
    setFixedTicketCapacityInput("");
    setLinkedTemplateId(null);
    setExistingImages([]);
    setPendingFiles([]);
    setEditingId(null);
    setOriginalSnapshot(null);
    setIsTypeDropdownOpen(false);
  }, [defaultPublicSection, eventTypes, freeEventNameMode, setEventTypeId]);

  const trimmedEventName = eventName.trim();
  const normalizedItems = itemsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const trimmedDescription = description.trim();
  const hasValidEventName =
    trimmedEventName.length >= EVENT_NAME_MIN_LENGTH &&
    trimmedEventName.length <= EVENT_NAME_MAX_LENGTH;
  const hasValidDescriptionLength =
    trimmedDescription.length >= DESCRIPTION_MIN_LENGTH &&
    trimmedDescription.length <= DESCRIPTION_MAX_LENGTH;
  const hasValidItems =
    normalizedItems.length > 0 && normalizedItems.every((item) => item.length <= ITEM_MAX_LENGTH);
  const hasValidType = freeEventNameMode ? hasValidEventName : Boolean(eventTypeId);
  const priceMode = editingId ? ("edit" as const) : ("create" as const);
  const priceResult = parseOptionalPrice(priceInput, priceMode);

  const hasChanges = editingId
    ? Boolean(
        originalSnapshot &&
          ((freeEventNameMode
            ? trimmedEventName !== originalSnapshot.eventName
            : eventTypeId !== originalSnapshot.eventTypeId) ||
            trimmedDescription !== originalSnapshot.description ||
            normalizedItems.join("\n") !== originalSnapshot.itemsText ||
            publicSection !== originalSnapshot.publicSection ||
            (isUpcomingForm &&
              (experienceMode !== (originalSnapshot.experienceMode ?? "NORMAL") ||
                scheduleKey !== (originalSnapshot.scheduleKey ?? "") ||
                enableVenueSeating !== (originalSnapshot.enableVenueSeating ?? false) ||
                fixedTicketCapacityInput !== (originalSnapshot.fixedTicketCapacityInput ?? ""))) ||
            pendingFiles.length > 0 ||
            (priceResult.ok &&
              (originalSnapshot.price ?? null) !== (priceResult.value ?? null))),
      )
    : Boolean(
        (freeEventNameMode ? trimmedEventName : eventTypeId) ||
          trimmedDescription ||
          normalizedItems.length ||
          Boolean(priceInput.trim()) ||
          publicSection !== defaultPublicSection ||
          (isUpcomingForm &&
            (experienceMode !== "NORMAL" ||
              enableVenueSeating ||
              fixedTicketCapacityInput.trim())) ||
          pendingFiles.length > 0,
      );

  const priceOk = priceResult.ok;
  const canSubmit =
    !isSubmitting && hasValidType && hasValidDescriptionLength && hasValidItems && priceOk && hasChanges;

  const upcomingExperienceFields = (): {
    experienceType: UpcomingExperienceType | null;
    classVariant: UpcomingClassVariant | null;
  } => experienceFieldsForMode(experienceMode, enableVenueSeating);

  const scheduleError = (): string | null => {
    if (experienceMode === "FIXED_EVENT") {
      if (
        !schedule.salesStartDate ||
        !schedule.salesEndDate ||
        !schedule.eventDate ||
        !schedule.eventStartTime ||
        !schedule.eventEndTime
      ) {
        return "Complete the sales window: sales start/end, event date and times.";
      }
      if (!enableVenueSeating) {
        if (!priceResult.ok || priceResult.value == null) {
          return "Set a ticket price for this fixed event (required when table & seat sales are off).";
        }
        if (priceResult.value < 0.5) {
          return "Ticket price must be at least $0.50.";
        }
        const capRaw = fixedTicketCapacityInput.trim();
        const cap = Number.parseInt(capRaw, 10);
        if (!capRaw || !Number.isFinite(cap) || cap < 1) {
          return "Enter the number of tickets for sale (integer ≥ 1).";
        }
      }
    }
    if (experienceMode === "RECURRING_WEEKLY") {
      if (!schedule.weekdays.some((w) => w.isActive)) {
        return "Select at least one weekday for the class schedule.";
      }
      if (!schedule.recurringStartTime || !schedule.recurringEndTime) {
        return "Set the class start and end time.";
      }
    }
    return null;
  };

  const getValidationError = () => {
    if (!hasValidType) {
      return freeEventNameMode
        ? `Enter an event name (${EVENT_NAME_MIN_LENGTH}–${EVENT_NAME_MAX_LENGTH} characters).`
        : "You must select an event type.";
    }
    if (!priceOk && !priceResult.ok) return priceResult.message;
    if (!hasValidDescriptionLength) {
      return `The description must be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters.`;
    }
    if (!hasValidItems) return "Add at least one line item. Each line may be up to 180 characters.";
    if (isUpcomingForm) {
      const schedErr = scheduleError();
      if (schedErr) return schedErr;
    }
    if (!hasChanges) return "No changes to save.";
    return null;
  };

  const buildCreateBody = (): CreateAdminEventBody => {
    const base: CreateAdminEventBody = {
      ...(freeEventNameMode
        ? { eventTypeName: trimmedEventName }
        : { eventTypeId }),
      description: trimmedDescription,
      items: normalizedItems,
      showOnHome: true,
      publicSection,
      ...(publicSection === "UPCOMING_EVENTS" ? upcomingExperienceFields() : {}),
    };
    if (priceResult.ok && typeof priceResult.value === "number") {
      return { ...base, price: priceResult.value };
    }
    return base;
  };

  const buildUpdateBody = (): UpdateAdminEventBody => {
    const base: UpdateAdminEventBody = {
      ...(freeEventNameMode
        ? { eventTypeName: trimmedEventName }
        : { eventTypeId }),
      description: trimmedDescription,
      items: normalizedItems,
      showOnHome: true,
      publicSection,
      ...(publicSection === "UPCOMING_EVENTS" ? upcomingExperienceFields() : {}),
    };
    if (priceResult.ok) {
      return { ...base, price: priceResult.value ?? null };
    }
    return base;
  };

  const startEdit = (
    item: AdminEvent,
    linkedTemplate: ReservationEventTemplate | null = null,
    venueClientEnabled = false,
    venueFixedTicketCapacity: number | null = null,
  ) => {
    setEditingId(item.id);
    if (!freeEventNameMode) {
      setEventTypeId(item.eventTypeId);
    }
    setEventName(item.eventTypeName);
    setDescription(item.description);
    const itemsJoined = item.items.join("\n");
    setItemsText(itemsJoined);
    setPriceInput(item.price != null ? formatPriceInput(item.price) : "");
    setPublicSection(item.publicSection ?? "GENERAL");

    const mode: UpcomingExperienceMode = linkedTemplate
      ? linkedTemplate.scheduleMode
      : "NORMAL";
    const nextSchedule = linkedTemplate
      ? scheduleFormFromTemplate(linkedTemplate)
      : emptyScheduleForm();
    setExperienceMode(mode);
    setSchedule(nextSchedule);
    setLinkedTemplateId(linkedTemplate?.id ?? null);
    setEnableVenueSeating(
      mode === "FIXED_EVENT" &&
        venueClientEnabled &&
        item.experienceType === "VENUE_SEATING",
    );
    setFixedTicketCapacityInput(
      mode === "FIXED_EVENT" && venueFixedTicketCapacity != null
        ? String(venueFixedTicketCapacity)
        : "",
    );

    setExistingImages(item.catalogImages);
    setPendingFiles([]);
    setOriginalSnapshot({
      eventTypeId: item.eventTypeId,
      eventName: item.eventTypeName.trim(),
      description: item.description.trim(),
      itemsText: itemsJoined,
      price: item.price ?? null,
      publicSection: item.publicSection ?? "GENERAL",
      experienceMode: mode,
      scheduleKey: mode === "NORMAL" ? "" : JSON.stringify(nextSchedule),
      enableVenueSeating:
        mode === "FIXED_EVENT" &&
        venueClientEnabled &&
        item.experienceType === "VENUE_SEATING",
      fixedTicketCapacityInput:
        mode === "FIXED_EVENT" && venueFixedTicketCapacity != null
          ? String(venueFixedTicketCapacity)
          : "",
    });
    setIsTypeDropdownOpen(false);
  };

  const onPickCatalogImages = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next: File[] = [];
    const capacity = MAX_CATALOG_IMAGES - existingImages.length - pendingFiles.length;
    if (capacity <= 0) return;
    for (let i = 0; i < fileList.length && next.length < capacity; i++) {
      const f = fileList.item(i);
      if (!f || !isCatalogMediaFile(f)) continue;
      next.push(f);
    }
    if (next.length) setPendingFiles((prev) => [...prev, ...next]);
  };

  const removePendingAt = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const activeEventTypes = eventTypes.filter((item) => item.isActive);
  const selectedTypeName = activeEventTypes.find((item) => item.id === eventTypeId)?.name;

  return {
    description,
    setDescription,
    itemsText,
    setItemsText,
    priceInput,
    setPriceInput,
    publicSection,
    setPublicSection,
    experienceMode,
    setExperienceMode,
    enableVenueSeating,
    setEnableVenueSeating: (enabled: boolean) => {
      setEnableVenueSeating(enabled);
      if (enabled) setFixedTicketCapacityInput("");
    },
    fixedTicketCapacityInput,
    setFixedTicketCapacityInput,
    parseFixedTicketCapacity: (): number | null => {
      const raw = fixedTicketCapacityInput.trim();
      if (!raw) return null;
      const n = Number.parseInt(raw, 10);
      return Number.isFinite(n) && n >= 1 ? n : null;
    },
    schedule,
    setSchedule,
    linkedTemplateId,
    eventName,
    setEventName,
    freeEventNameMode,
    existingImages,
    setExistingImages,
    pendingFiles,
    pendingPreviewUrls,
    editingId,
    isTypeDropdownOpen,
    setIsTypeDropdownOpen,
    activeEventTypes,
    selectedTypeName,
    canSubmit,
    resetForm,
    startEdit,
    getValidationError,
    buildCreateBody,
    buildUpdateBody,
    onPickCatalogImages,
    removePendingAt,
    closeTypeDropdown: () => setIsTypeDropdownOpen(false),
  };
}
