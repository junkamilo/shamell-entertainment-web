"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { markPaymentHistorySeenNow } from "@/lib/paymentHistoryNotifications";
import { fetchAdminPayments } from "../services/fetchAdminPayments";
import type {
  AdminPaymentFlow,
  AdminPaymentStatus,
  AdminStripePaymentRow,
} from "../types/paymentHistory.types";

const DEFAULT_LIMIT = 20;

export function usePaymentHistoryPage() {
  const [items, setItems] = useState<AdminStripePaymentRow[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_LIMIT);
  const [flowFilter, setFlowFilter] = useState<AdminPaymentFlow | "">("");
  const [statusFilter, setStatusFilter] = useState<AdminPaymentStatus | "">("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });

  const reload = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setError("Not signed in.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminPayments(token, {
        page,
        limit: perPage,
        flow: flowFilter || undefined,
        status: statusFilter || undefined,
        q: search.trim() || undefined,
      });
      setItems(data.items);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load payments.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, flowFilter, statusFilter, search]);

  useEffect(() => {
    markPaymentHistorySeenNow();
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    items,
    page,
    setPage,
    perPage,
    setPerPage: (next: number) => {
      setPerPageState(next);
      setPage(1);
    },
    flowFilter,
    setFlowFilter,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    isLoading,
    error,
    meta,
    reload,
  };
}
