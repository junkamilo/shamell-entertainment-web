"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getAgendarBearerToken } from "../lib/agendarAuth";
import { fetchAgendarCatalog } from "../services/fetchAgendarCatalog";
import type { AgendarCatalog } from "../types/agendar.types";

const EMPTY_CATALOG: AgendarCatalog = {
  services: [],
  eventTypes: [],
  occasions: [],
};

export function useAgendarCatalog() {
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalog, setCatalog] = useState<AgendarCatalog>(EMPTY_CATALOG);

  useEffect(() => {
    let cancelled = false;
    const token = getAgendarBearerToken();
    if (!token) {
      setCatalogLoading(false);
      return;
    }

    setCatalogLoading(true);
    fetchAgendarCatalog(token)
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Could not load catalog", variant: "destructive" });
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { catalogLoading, catalog };
}
