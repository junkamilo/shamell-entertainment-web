"use client";

import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  ITEM_MAX_LENGTH,
  MAX_CATALOG_IMAGES,
} from "../lib/eventsConstants";
import { isCatalogMediaFile } from "../lib/eventsMedia";
import { formatPriceInput, parseOptionalPrice } from "../lib/eventsPrice";
import type { AdminEvent, CatalogImage, EventFormSnapshot, EventsEventTypeOption } from "../types/events.types";
import type { CreateAdminEventBody, UpdateAdminEventBody } from "../types/events.types";

type UseEventsFormArgs = {
  eventTypes: EventsEventTypeOption[];
  eventTypeId: string;
  setEventTypeId: Dispatch<SetStateAction<string>>;
  isSubmitting: boolean;
};

export function useEventsForm({
  eventTypes,
  eventTypeId,
  setEventTypeId,
  isSubmitting,
}: UseEventsFormArgs) {
  const [description, setDescription] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [existingImages, setExistingImages] = useState<CatalogImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [originalSnapshot, setOriginalSnapshot] = useState<EventFormSnapshot | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const pendingPreviewUrls = useMemo(() => pendingFiles.map((f) => URL.createObjectURL(f)), [pendingFiles]);
  useEffect(() => {
    return () => pendingPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [pendingPreviewUrls]);

  const resetForm = useCallback(() => {
    setEventTypeId((current) => current || eventTypes.find((item) => item.isActive)?.id || "");
    setDescription("");
    setItemsText("");
    setPriceInput("");
    setExistingImages([]);
    setPendingFiles([]);
    setEditingId(null);
    setOriginalSnapshot(null);
    setIsTypeDropdownOpen(false);
  }, [eventTypes, setEventTypeId]);

  const normalizedItems = itemsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const trimmedDescription = description.trim();
  const hasValidDescriptionLength =
    trimmedDescription.length >= DESCRIPTION_MIN_LENGTH &&
    trimmedDescription.length <= DESCRIPTION_MAX_LENGTH;
  const hasValidItems =
    normalizedItems.length > 0 && normalizedItems.every((item) => item.length <= ITEM_MAX_LENGTH);
  const hasValidType = Boolean(eventTypeId);
  const priceMode = editingId ? ("edit" as const) : ("create" as const);
  const priceResult = parseOptionalPrice(priceInput, priceMode);

  const hasChanges = editingId
    ? Boolean(
        originalSnapshot &&
          (eventTypeId !== originalSnapshot.eventTypeId ||
            trimmedDescription !== originalSnapshot.description ||
            normalizedItems.join("\n") !== originalSnapshot.itemsText ||
            pendingFiles.length > 0 ||
            (priceResult.ok && (originalSnapshot.price ?? null) !== (priceResult.value ?? null))),
      )
    : Boolean(
        eventTypeId ||
          trimmedDescription ||
          normalizedItems.length ||
          Boolean(priceInput.trim()) ||
          pendingFiles.length > 0,
      );

  const priceOk = priceResult.ok;
  const canSubmit =
    !isSubmitting && hasValidType && hasValidDescriptionLength && hasValidItems && priceOk && hasChanges;

  const getValidationError = () => {
    if (!hasValidType) return "You must select an event type.";
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
      eventTypeId,
      description: trimmedDescription,
      items: normalizedItems,
      showOnHome: true,
    };
    if (priceResult.ok && typeof priceResult.value === "number") {
      return { ...base, price: priceResult.value };
    }
    return base;
  };

  const buildUpdateBody = (): UpdateAdminEventBody => {
    const base: UpdateAdminEventBody = {
      eventTypeId,
      description: trimmedDescription,
      items: normalizedItems,
      showOnHome: true,
    };
    if (priceResult.ok) {
      return { ...base, price: priceResult.value ?? null };
    }
    return base;
  };

  const startEdit = (item: AdminEvent) => {
    setEditingId(item.id);
    setEventTypeId(item.eventTypeId);
    setDescription(item.description);
    const itemsJoined = item.items.join("\n");
    setItemsText(itemsJoined);
    setPriceInput(item.price != null ? formatPriceInput(item.price) : "");
    setExistingImages(item.catalogImages);
    setPendingFiles([]);
    setOriginalSnapshot({
      eventTypeId: item.eventTypeId,
      description: item.description.trim(),
      itemsText: itemsJoined,
      price: item.price ?? null,
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
