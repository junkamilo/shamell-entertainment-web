"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { DEFAULT_PAGINATION_META, type PaginatedResponse, type PaginationMeta } from "@/lib/pagination";

function apiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

export type UnifiedPeticionRow =
  | {
      origin: "CONTACT";
      id: string;
      createdAt: string;
      state: "PENDING" | "RESERVED" | "CANCELLED";
      contact: ContactRequest;
    }
  | {
      origin: "BOOKING_ADMIN";
      id: string;
      createdAt: string;
      status: string;
      booking: AdminBookingRow;
    };

type AdminPeticionesQuery = {
  page?: number;
  perPage?: number;
};

export function useAdminPeticiones(enabled = true, query?: AdminPeticionesQuery) {
  const [rows, setRows] = useState<UnifiedPeticionRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION_META);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const sp = new URLSearchParams();
    if (query?.page) sp.set("page", String(query.page));
    if (query?.perPage) sp.set("perPage", String(query.perPage));
    const qs = sp.size ? `?${sp.toString()}` : "";

    fetch(`${apiBase()}/api/v1/contact/peticiones${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            typeof (data as { message?: string }).message === "string"
              ? (data as { message: string }).message
              : "Could not load inbox items.",
          );
        }
        return response.json();
      })
      .then((data: unknown) => {
        const payload = data as Partial<PaginatedResponse<UnifiedPeticionRow>>;
        const items = Array.isArray(payload.items) ? payload.items : [];
        const nextMeta = payload.meta ?? DEFAULT_PAGINATION_META;
        setRows(items);
        setMeta({
          page: Number(nextMeta.page ?? 1),
          perPage: Number(nextMeta.perPage ?? query?.perPage ?? 10),
          totalItems: Number(nextMeta.totalItems ?? items.length),
          totalPages: Number(nextMeta.totalPages ?? 1),
          hasPrev: Boolean(nextMeta.hasPrev),
          hasNext: Boolean(nextMeta.hasNext),
        });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Could not load inbox items.";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [enabled, query?.page, query?.perPage]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rows, meta, isLoading, error, reload };
}
