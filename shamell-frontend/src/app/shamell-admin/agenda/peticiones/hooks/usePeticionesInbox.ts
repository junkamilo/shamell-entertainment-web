"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { DEFAULT_PAGINATION_META, type PaginationMeta } from "@/lib/pagination";
import { fetchAdminPeticiones } from "../services/fetchAdminPeticiones";
import type { AdminPeticionesQuery, UnifiedPeticionRow } from "../types/peticiones.types";

export function usePeticionesInbox(enabled = true, query?: AdminPeticionesQuery) {
  const [rows, setRows] = useState<UnifiedPeticionRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION_META);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryPage = query?.page;
  const queryPerPage = query?.perPage;
  const queryLane = query?.lane;

  const reload = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setRows([]);
      setMeta(DEFAULT_PAGINATION_META);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    fetchAdminPeticiones(token, {
      page: queryPage,
      perPage: queryPerPage,
      lane: queryLane,
    })
      .then(({ items, meta: nextMeta }) => {
        setRows(items);
        setMeta(nextMeta);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Could not load inbox items.";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [enabled, queryPage, queryPerPage, queryLane]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rows, meta, isLoading, error, reload };
}
