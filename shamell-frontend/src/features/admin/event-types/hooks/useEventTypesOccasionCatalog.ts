"use client";

import { useEffect, useState } from "react";
import { getEventTypesBearerToken } from "../lib/eventTypesAuth";
import { fetchAdminOccasionsCatalog } from "../services/fetchAdminOccasionsCatalog";
import type { OccasionCatalogItem } from "../types/eventTypes.types";

export function useEventTypesOccasionCatalog(isModalOpen: boolean) {
  const [occasionCatalog, setOccasionCatalog] = useState<OccasionCatalogItem[]>([]);

  useEffect(() => {
    if (!isModalOpen) return;
    const token = getEventTypesBearerToken();
    if (!token) return;
    let cancelled = false;
    void fetchAdminOccasionsCatalog(token)
      .then((items) => {
        if (!cancelled) setOccasionCatalog(items);
      })
      .catch(() => {
        if (!cancelled) setOccasionCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isModalOpen]);

  return { occasionCatalog };
}
