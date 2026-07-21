"use client";

import { useAgendaCatalogMaps } from "../../shared/hooks/useAgendaCatalogMaps";

export function usePeticionesCatalogMaps() {
  return useAgendaCatalogMaps({ includeContactLines: true });
}
