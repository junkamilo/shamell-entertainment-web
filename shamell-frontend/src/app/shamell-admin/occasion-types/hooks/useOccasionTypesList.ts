"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PAGINATION_META } from "@/lib/pagination";
import { getOccasionTypesBearerToken } from "../lib/occasionTypesAuth";
import { fetchAdminOccasionTypes } from "../services/fetchAdminOccasionTypes";
import type { FilterTab, OccasionTypeItem } from "../types/occasionTypes.types";

function isOfflineError(err: unknown) {
  const description = err instanceof Error ? err.message : "Could not reach the server.";
  return description === "Failed to fetch" || !(err instanceof Error);
}

export function useOccasionTypesList() {
  const [rows, setRows] = useState<OccasionTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const loadRows = useCallback(async () => {
    const token = getOccasionTypesBearerToken();
    if (!token) {
      setRows([]);
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const items = await fetchAdminOccasionTypes(token);
      setRows(items);
    } catch (err) {
      const offline = isOfflineError(err);
      toast({
        variant: "destructive",
        title: offline ? "Offline" : "Error",
        description: offline
          ? "Could not reach the server."
          : err instanceof Error
            ? err.message
            : "Could not load occasion types.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = rows.filter((item) => item.name.toLowerCase().includes(q));
    if (filterTab === "active") list = list.filter((t) => t.isActive);
    if (filterTab === "inactive") list = list.filter((t) => !t.isActive);
    list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    return list;
  }, [rows, searchQuery, filterTab]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTab]);

  const paginationMeta = useMemo(() => {
    const totalItems = filtered.length;
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    const safePage = Math.min(Math.max(1, page), totalPages);
    return {
      page: safePage,
      perPage,
      totalItems,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    };
  }, [page, perPage, filtered.length]);

  const pagedRows = useMemo(() => {
    const start = (paginationMeta.page - 1) * paginationMeta.perPage;
    return filtered.slice(start, start + paginationMeta.perPage);
  }, [filtered, paginationMeta.page, paginationMeta.perPage]);

  const onPerPageChange = useCallback((next: number) => {
    setPerPage(next);
    setPage(DEFAULT_PAGINATION_META.page);
  }, []);

  return {
    rows,
    isLoading,
    loadRows,
    searchQuery,
    setSearchQuery,
    filterTab,
    setFilterTab,
    page,
    setPage,
    perPage,
    onPerPageChange,
    filtered,
    pagedRows,
    paginationMeta,
  };
}
