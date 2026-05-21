"use client";

import { useState } from "react";
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_REGEX,
} from "../lib/occasionTypesConstants";
import type { OccasionTypeItem } from "../types/occasionTypes.types";

type UseOccasionTypesFormArgs = {
  rows: OccasionTypeItem[];
  isSubmitting: boolean;
};

export function useOccasionTypesForm({ rows, isSubmitting }: UseOccasionTypesFormArgs) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

  const trimmedName = name.trim();
  const isNameValid =
    trimmedName.length >= NAME_MIN_LENGTH &&
    trimmedName.length <= NAME_MAX_LENGTH &&
    NAME_REGEX.test(trimmedName);

  const editingRow = editingId ? rows.find((r) => r.id === editingId) : undefined;
  const nameChanged = !editingId || trimmedName !== (editingRow?.name.trim() ?? "");
  const hasChanges = editingId ? nameChanged : trimmedName.length > 0;
  const canSubmit = !isSubmitting && isNameValid && hasChanges;

  const getValidationError = () => {
    if (!trimmedName || !isNameValid || !hasChanges) return "Invalid name or no changes.";
    return null;
  };

  const startEdit = (item: OccasionTypeItem) => {
    setEditingId(item.id);
    setName(item.name);
  };

  return {
    name,
    setName,
    editingId,
    editingRow,
    canSubmit,
    resetForm,
    startEdit,
    getValidationError,
    trimmedName,
  };
}
