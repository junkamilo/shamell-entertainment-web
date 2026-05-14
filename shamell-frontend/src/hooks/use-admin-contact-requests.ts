"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { DEFAULT_PAGINATION_META, type PaginatedResponse, type PaginationMeta } from "@/lib/pagination";

export type ContactRequest = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  eventDate?: string | null;
  location?: string | null;
  serviceType?: string | null;
  preferences?: string | null;
  subject: string;
  message: string;
  inquiryDetails?: unknown | null;
  /** Server-built 9-field concierge form snapshot when `entrySource` is concierge_gate. */
  conciergeVisionSnapshot?: unknown | null;
  isRead: boolean;
  status?: "PENDING" | "RESERVED" | "CANCELLED";
  createdAt: string;
};

type AdminContactRequestsQuery = {
  page?: number;
  perPage?: number;
  status?: "PENDING" | "RESERVED" | "CANCELLED";
};

function apiBase() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";
}

export function useAdminContactRequests(enabled = true, query?: AdminContactRequestsQuery) {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION_META);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setRequests([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const sp = new URLSearchParams();
    if (query?.page) sp.set("page", String(query.page));
    if (query?.perPage) sp.set("perPage", String(query.perPage));
    if (query?.status) sp.set("status", query.status);
    const qs = sp.size ? `?${sp.toString()}` : "";

    fetch(`${apiBase()}/api/v1/contact${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            typeof (data as { message?: string }).message === "string"
              ? (data as { message: string }).message
              : "Could not load contact requests.",
          );
        }
        return response.json();
      })
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setRequests(data as ContactRequest[]);
          setMeta((m) => ({ ...m, totalItems: data.length, totalPages: 1, page: 1, hasPrev: false, hasNext: false }));
          return;
        }
        const payload = data as Partial<PaginatedResponse<ContactRequest>>;
        const items = Array.isArray(payload.items) ? payload.items : [];
        const nextMeta = payload.meta ?? DEFAULT_PAGINATION_META;
        setRequests(items);
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
        const message = err instanceof Error ? err.message : "Could not load contact requests.";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [enabled, query?.page, query?.perPage, query?.status]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setStatus = useCallback(async (id: string, status: "PENDING" | "RESERVED" | "CANCELLED") => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;
    const res = await fetch(`${apiBase()}/api/v1/contact/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg =
        typeof (data as { message?: string }).message === "string"
          ? (data as { message: string }).message
          : "Could not update status.";
      throw new Error(msg);
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, isRead: status === "PENDING" ? false : true } : r)),
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;
    const res = await fetch(`${apiBase()}/api/v1/contact/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg =
        typeof (data as { message?: string }).message === "string"
          ? (data as { message: string }).message
          : "Could not delete.";
      throw new Error(msg);
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { requests, meta, isLoading, error, reload, setStatus, remove };
}
