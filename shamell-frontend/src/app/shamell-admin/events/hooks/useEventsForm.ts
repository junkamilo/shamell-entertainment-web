"use client";

import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import {
  experienceFromTemplate,
  findTemplateById,
} from "@/app/shamell-admin/on-coming-events/reservation-events/lib/reservationEventExperience";
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
import type { EventPublicSection, UpcomingClassVariant, UpcomingExperienceType } from "../types/events.types";

type UseEventsFormArgs = {
  eventTypes: EventsEventTypeOption[];
  eventTypeId: string;
  setEventTypeId: Dispatch<SetStateAction<string>>;
  isSubmitting: boolean;
  defaultPublicSection: EventPublicSection;
  freeEventNameMode?: boolean;
  reservationTemplates?: ReservationEventTemplate[];
};

export function useEventsForm({
  eventTypes,
  eventTypeId,
  setEventTypeId,
  isSubmitting,
  defaultPublicSection,
  freeEventNameMode = false,
  reservationTemplates = [],
}: UseEventsFormArgs) {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [publicSection, setPublicSection] = useState<EventPublicSection>(
    defaultPublicSection,
  );
  const [experienceType, setExperienceType] = useState<UpcomingExperienceType>("CLASSES");
  const [classVariant, setClassVariant] = useState<UpcomingClassVariant>("GROUP");
  const [reservationEventTemplateId, setReservationEventTemplateId] = useState("");
  const [existingImages, setExistingImages] = useState<CatalogImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [originalSnapshot, setOriginalSnapshot] = useState<EventFormSnapshot | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const isUpcomingForm = defaultPublicSection === "UPCOMING_EVENTS";

  const pendingPreviewUrls = useMemo(() => pendingFiles.map((f) => URL.createObjectURL(f)), [pendingFiles]);
  useEffect(() => {
    return () => pendingPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [pendingPreviewUrls]);

  useEffect(() => {
    if (!isUpcomingForm || !reservationEventTemplateId) return;
    const template = findTemplateById(reservationTemplates, reservationEventTemplateId);
    const derived = experienceFromTemplate(template);
    if (!derived) return;
    setExperienceType(derived.experienceType);
    setClassVariant(derived.classVariant ?? "GROUP");
  }, [isUpcomingForm, reservationEventTemplateId, reservationTemplates]);

  const resetForm = useCallback(() => {
    if (!freeEventNameMode) {
      setEventTypeId((current) => current || eventTypes.find((item) => item.isActive)?.id || "");
    }
    setEventName("");
    setDescription("");
    setItemsText("");
    setPriceInput("");
    setPublicSection(defaultPublicSection);
    setExperienceType("CLASSES");
    setClassVariant("GROUP");
    setReservationEventTemplateId("");
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
              reservationEventTemplateId !==
                (originalSnapshot.reservationEventTemplateId ?? "")) ||
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
          (isUpcomingForm && reservationEventTemplateId) ||
          pendingFiles.length > 0,
      );

  const priceOk = priceResult.ok;
  const canSubmit =
    !isSubmitting && hasValidType && hasValidDescriptionLength && hasValidItems && priceOk && hasChanges;

  const upcomingExperienceFields = () => {
    const template = findTemplateById(reservationTemplates, reservationEventTemplateId);
    const derived = experienceFromTemplate(template);
    if (!derived) {
      return { experienceType, classVariant: experienceType === "CLASSES" ? classVariant : undefined };
    }
    return {
      experienceType: derived.experienceType,
      classVariant: derived.classVariant,
    };
  };

  const getValidationError = () => {
    if (isUpcomingForm && !reservationEventTemplateId) {
      return "Select a reservation event schedule.";
    }
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

  const startEdit = (item: AdminEvent, linkedTemplateId = "") => {
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
    setExperienceType(item.experienceType ?? "CLASSES");
    setClassVariant(item.classVariant ?? "GROUP");
    setReservationEventTemplateId(linkedTemplateId);
    setExistingImages(item.catalogImages);
    setPendingFiles([]);
    setOriginalSnapshot({
      eventTypeId: item.eventTypeId,
      eventName: item.eventTypeName.trim(),
      description: item.description.trim(),
      itemsText: itemsJoined,
      price: item.price ?? null,
      publicSection: item.publicSection ?? "GENERAL",
      reservationEventTemplateId: linkedTemplateId,
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
    experienceType,
    reservationEventTemplateId,
    setReservationEventTemplateId,
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
