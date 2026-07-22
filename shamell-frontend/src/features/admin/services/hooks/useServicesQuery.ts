"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminBearerToken } from "@/lib/admin/auth";
import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapServicesFromApi } from "../lib/mapServiceFromApi";
import { parseServicesError } from "../lib/servicesErrors";
import type { AdminService } from "../types/services.types";

/** In-flight dedupe so parallel callers share one GET /services/admin. */
const inflightRawByToken = new Map<string, Promise<unknown>>();

export function fetchAdminServicesRawShared(token: string): Promise<unknown> {
  const existing = inflightRawByToken.get(token);
  if (existing) return existing;
  const base = getAdminApiBaseUrl();
  const promise = fetch(`${base}/api/v1/services/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
    .then(async (response) => {
      const data: unknown = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(parseServicesError(data, "Could not load services."));
      }
      return data;
    })
    .finally(() => {
      queueMicrotask(() => {
        if (inflightRawByToken.get(token) === promise) {
          inflightRawByToken.delete(token);
        }
      });
    });
  inflightRawByToken.set(token, promise);
  return promise;
}

export async function fetchAdminServicesShared(token: string): Promise<AdminService[]> {
  const raw = await fetchAdminServicesRawShared(token);
  return mapServicesFromApi(raw);
}

export type UseServicesQueryResult = {
  services: AdminService[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Shared admin services list query (`GET /api/v1/services/admin`).
 */
export function useServicesQuery(enabled = true): UseServicesQueryResult {
  const [services, setServices] = useState<AdminService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setServices([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchAdminServicesShared(token);
      setServices(items);
    } catch (err) {
      setServices([]);
      setError(err instanceof Error ? err.message : "Could not load services.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refetch();
  }, [enabled, refetch]);

  return { services, isLoading, error, refetch };
}
