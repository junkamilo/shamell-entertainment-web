"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PAGINATION_META } from "@/lib/pagination";
import { getServiceTypesBearerToken } from "../lib/serviceTypesAuth";
import { fetchAdminServiceTypes } from "../services/fetchAdminServiceTypes";
import type { FilterTab, ServiceTypeItem, ServiceTypesStats } from "../types/serviceTypes.types";

function isOfflineError(err: unknown) {
  const description = err instanceof Error ? err.message : "Could not reach the server.";
  return description === "Failed to fetch" || !(err instanceof Error);
}

export function useServiceTypesList() {
  const [types, setTypes] = useState<ServiceTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const loadTypes = useCallback(async () => {
    const token = getServiceTypesBearerToken();
    if (!token) {
      setTypes([]);
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const items = await fetchAdminServiceTypes(token);
      setTypes(items);
    } catch (err) {
      const offline = isOfflineError(err);
      toast({
        variant: "destructive",
        title: offline ? "Offline" : "Error",
        description: offline
          ? "Could not reach the server."
          : err instanceof Error
            ? err.message
            : "Could not load service types.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  const filteredTypes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = types.filter((item) => item.name.toLowerCase().includes(q));
    if (filterTab === "active") list = list.filter((t) => t.isActive);
    if (filterTab === "inactive") list = list.filter((t) => !t.isActive);
    return list;
  }, [types, searchQuery, filterTab]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTab]);

  const paginationMeta = useMemo(() => {
    const totalItems = filteredTypes.length;
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
  }, [page, perPage, filteredTypes.length]);

  const pagedTypes = useMemo(() => {
    const start = (paginationMeta.page - 1) * paginationMeta.perPage;
    return filteredTypes.slice(start, start + paginationMeta.perPage);
  }, [filteredTypes, paginationMeta.page, paginationMeta.perPage]);

  const stats: ServiceTypesStats = useMemo(() => {
    const total = types.length;
    const active = types.filter((t) => t.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [types]);

  const onPerPageChange = useCallback((next: number) => {
    setPerPage(next);
    setPage(DEFAULT_PAGINATION_META.page);
  }, []);

  return {
    types,
    isLoading,
    loadTypes,
    searchQuery,
    setSearchQuery,
    filterTab,
    setFilterTab,
    page,
    setPage,
    perPage,
    onPerPageChange,
    filteredTypes,
    pagedTypes,
    paginationMeta,
    stats,
  };
}
