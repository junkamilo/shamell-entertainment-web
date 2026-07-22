"use client";

import { useMemo, useState } from "react";
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_REGEX,
} from "../lib/eventTypesConstants";
import {
  flattenLinkedOccasionIdsFromAssignments,
  linkedOccasionIdsSignature,
  packLinkedOccasionsForApi,
} from "../lib/eventTypesOccasionUtils";
import type { EventTypeItem, OccasionCatalogItem } from "../types/eventTypes.types";

type UseEventTypesFormArgs = {
  types: EventTypeItem[];
  occasionCatalog: OccasionCatalogItem[];
  isSubmitting: boolean;
};

export function useEventTypesForm({ types, occasionCatalog, isSubmitting }: UseEventTypesFormArgs) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkedOccasionIds, setLinkedOccasionIds] = useState<string[]>([]);

  const resetForm = () => {
    setName("");
    setLinkedOccasionIds([]);
    setEditingId(null);
  };

  const trimmedName = name.trim();
  const hasValidChars = NAME_REGEX.test(trimmedName);
  const hasValidLength =
    trimmedName.length >= NAME_MIN_LENGTH && trimmedName.length <= NAME_MAX_LENGTH;
  const isNameValid = hasValidChars && hasValidLength;

  const editingRow = editingId ? types.find((item) => item.id === editingId) : undefined;
  const originalName = editingRow?.name.trim() ?? "";
  const nameChanged = !editingId || trimmedName !== originalName;

  const activeOccasionsCatalog = useMemo(
    () => occasionCatalog.filter((c) => c.isActive),
    [occasionCatalog],
  );

  const activeOccasionIdSet = useMemo(
    () => new Set(activeOccasionsCatalog.map((c) => c.id)),
    [activeOccasionsCatalog],
  );

  const originalIdsFlat = flattenLinkedOccasionIdsFromAssignments(editingRow?.occasionAssignments);
  const idsForSave = linkedOccasionIds.filter((id) => activeOccasionIdSet.has(id));
  const baselineIdsForSave = originalIdsFlat.filter((id) => activeOccasionIdSet.has(id));
  const willSendOccasions = packLinkedOccasionsForApi(idsForSave, occasionCatalog);
  const baselineOccasions = packLinkedOccasionsForApi(baselineIdsForSave, occasionCatalog);
  const hadNonSingleUsage = (editingRow?.occasionAssignments ?? []).some(
    (a) => a.usage !== "OCCASION_SINGLE",
  );
  const hadInactiveLinksOnly =
    originalIdsFlat.length > 0 && baselineIdsForSave.length === 0 && idsForSave.length === 0;
  const assignmentsChanged =
    hadNonSingleUsage ||
    hadInactiveLinksOnly ||
    JSON.stringify(willSendOccasions) !== JSON.stringify(baselineOccasions) ||
    linkedOccasionIdsSignature(linkedOccasionIds) !== linkedOccasionIdsSignature(originalIdsFlat);
  const hasChanges = editingId ? nameChanged || assignmentsChanged : trimmedName.length > 0;
  const canSubmit = !isSubmitting && isNameValid && hasChanges;

  const linkedOrphanIds = useMemo(
    () => linkedOccasionIds.filter((id) => !activeOccasionIdSet.has(id)),
    [linkedOccasionIds, activeOccasionIdSet],
  );

  const toggleLinkedOccasion = (id: string) => {
    setLinkedOccasionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const getNameValidationError = () => {
    if (!trimmedName) return "Enter a name for the event type.";
    if (!hasValidLength) {
      return `Name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`;
    }
    if (!hasValidChars) {
      return "Only letters, spaces, hyphens, and '&' are allowed. Numbers are not allowed.";
    }
    if (!hasChanges) {
      return "Nothing to save.";
    }
    return null;
  };

  const startEdit = (item: EventTypeItem) => {
    setEditingId(item.id);
    setName(item.name);
    setLinkedOccasionIds(flattenLinkedOccasionIdsFromAssignments(item.occasionAssignments));
  };

  const buildUpsertBody = () => {
    const idsForApi = linkedOccasionIds.filter((id) => activeOccasionIdSet.has(id));
    const occasions = packLinkedOccasionsForApi(idsForApi, occasionCatalog);
    return { name: trimmedName, occasions };
  };

  return {
    name,
    setName,
    editingId,
    editingRow,
    linkedOccasionIds,
    activeOccasionsCatalog,
    linkedOrphanIds,
    canSubmit,
    resetForm,
    startEdit,
    toggleLinkedOccasion,
    getNameValidationError,
    buildUpsertBody,
  };
}
