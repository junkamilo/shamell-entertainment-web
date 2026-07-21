import type { AgendarBookMode } from "../types/agendarBookMode.types";

export function parseAgendarBookMode(
  modeParam: string | null,
  isEditMode: boolean,
): AgendarBookMode {
  if (isEditMode) return "event";
  return modeParam === "class" ? "class" : "event";
}
