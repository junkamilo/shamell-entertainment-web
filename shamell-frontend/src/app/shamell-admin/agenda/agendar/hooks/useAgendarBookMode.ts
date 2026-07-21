"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AGENDAR_PATH } from "../../lib/agendaRoutes";
import { parseAgendarBookMode } from "../lib/agendarBookMode";
import type { AgendarBookMode } from "../types/agendarBookMode.types";

export function useAgendarBookMode(isEditMode: boolean) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookMode = parseAgendarBookMode(searchParams.get("mode"), isEditMode);

  const setBookMode = useCallback(
    (mode: AgendarBookMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (mode === "class") {
        params.set("mode", "class");
      } else {
        params.delete("mode");
      }
      const qs = params.toString();
      router.replace(`${AGENDAR_PATH}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return {
    bookMode,
    setBookMode,
    showClassTab: !isEditMode,
  };
}
