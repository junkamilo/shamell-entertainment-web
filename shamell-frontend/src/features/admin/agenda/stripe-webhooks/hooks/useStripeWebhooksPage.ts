"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { fetchAdminStripeWebhooks } from "../services/fetchAdminStripeWebhooks";
import type {
  AdminStripeWebhookEventRow,
  AdminWebhookStatus,
} from "../types/stripeWebhooks.types";

const DEFAULT_LIMIT = 20;

export function useStripeWebhooksPage() {
  const [items, setItems] = useState<AdminStripeWebhookEventRow[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_LIMIT);
  const [statusFilter, setStatusFilter] = useState<AdminWebhookStatus | "">("");
  const [flowFilter, setFlowFilter] = useState("");
  const [failedOnly, setFailedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    page: 1,
    perPage: DEFAULT_LIMIT,
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
      const data = await fetchAdminStripeWebhooks(token, {
        page,
        limit: perPage,
        status: failedOnly ? "FAILED" : statusFilter || undefined,
        metadataFlow: flowFilter.trim() || undefined,
      });
      setItems(data.items);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, statusFilter, flowFilter, failedOnly]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setPerPage = useCallback((value: number) => {
    setPerPageState(value);
    setPage(1);
  }, []);

  return {
    items,
    page,
    setPage,
    perPage,
    setPerPage,
    statusFilter,
    setStatusFilter,
    flowFilter,
    setFlowFilter,
    failedOnly,
    setFailedOnly,
    isLoading,
    error,
    meta,
    reload,
  };
}
