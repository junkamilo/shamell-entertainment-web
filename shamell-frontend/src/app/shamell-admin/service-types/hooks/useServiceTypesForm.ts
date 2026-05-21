"use client";

import { useState } from "react";
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_REGEX,
} from "../lib/serviceTypesConstants";
import type { ServiceTypeItem } from "../types/serviceTypes.types";

type UseServiceTypesFormArgs = {
  types: ServiceTypeItem[];
  isSubmitting: boolean;
};

export function useServiceTypesForm({ types, isSubmitting }: UseServiceTypesFormArgs) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
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
  const hasChanges = editingId ? nameChanged : trimmedName.length > 0;
  const canSubmit = !isSubmitting && isNameValid && hasChanges;

  const getNameValidationError = () => {
    if (!trimmedName) return "Enter a name for the service type.";
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

  const startEdit = (item: ServiceTypeItem) => {
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
    getNameValidationError,
    trimmedName,
  };
}
