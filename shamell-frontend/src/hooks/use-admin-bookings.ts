"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { DEFAULT_PAGINATION_META, type PaginatedResponse, type PaginationMeta } from "@/lib/pagination";

function apiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

export type AdminBookingRow = {
  id: string;
  createdAt?: string;
  contactRequestId?: string | null;
  eventDate: string;
  location: string;
  status: string;
  source: string;
  notes?: string | null;
  bookingDetails?: Record<string, unknown> | null;
  guestFullName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  user?: { fullName: string; email: string } | null;
  service?: { id: string; serviceType?: { name: string } };
  eventType?: { id?: string; name: string } | null;
  occasionType?: { id?: string; name: string } | null;
  event?: { id?: string; name: string } | null;
};

export type CreateAdminBookingPayload = {
  serviceId: string;
  eventTypeId?: string;
  occasionTypeId?: string;
  eventId?: string;
  contactRequestId?: string;
  eventDate: string;
  location: string;
  guestCount?: number;
  notes?: string;
  status?: string;
  /** Origen en BD: teléfono manual vs petición de contacto. */
  source?: "ADMIN_PHONE" | "ADMIN_FROM_CONTACT";
  bookingDetails?: Record<string, unknown>;
  userId?: string;
  guestFullName?: string;
  guestEmail?: string;
  guestPhone?: string;
};

type AdminBookingQuery = {
  page?: number;
  perPage?: number;
  status?: string;
  source?: string;
  from?: string;
  to?: string;
};

export function useAdminBookings(enabled = true, query?: AdminBookingQuery) {
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION_META);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = query?.page;
  const perPage = query?.perPage;
  const status = query?.status;
  const source = query?.source;
  const from = query?.from;
  const to = query?.to;

  const authHeaders = useCallback((): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) : null;
    const h: HeadersInit = { "Content-Type": "application/json" };
    if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`;
    return h;
  }, []);

  const reload = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setBookings([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const sp = new URLSearchParams();
    if (page) sp.set("page", String(page));
    if (perPage) sp.set("perPage", String(perPage));
    if (status) sp.set("status", status);
    if (source) sp.set("source", source);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    const qs = sp.size > 0 ? `?${sp.toString()}` : "";
    fetch(`${apiBase()}/api/v1/bookings/admin${qs}`, { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(nestApiErrorMessage(data, "No se pudieron cargar reservas."));
        }
        return res.json();
      })
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setBookings(data as AdminBookingRow[]);
          setMeta((m) => ({ ...m, totalItems: data.length, totalPages: 1, page: 1, hasPrev: false, hasNext: false }));
          return;
        }
        const payload = data as Partial<PaginatedResponse<AdminBookingRow>>;
        const items = Array.isArray(payload.items) ? payload.items : [];
        const nextMeta = payload.meta ?? DEFAULT_PAGINATION_META;
        setBookings(items);
        setMeta({
          page: Number(nextMeta.page ?? 1),
          perPage: Number(nextMeta.perPage ?? perPage ?? 10),
          totalItems: Number(nextMeta.totalItems ?? items.length),
          totalPages: Number(nextMeta.totalPages ?? 1),
          hasPrev: Boolean(nextMeta.hasPrev),
          hasNext: Boolean(nextMeta.hasNext),
        });
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error."))
      .finally(() => setIsLoading(false));
  }, [authHeaders, enabled, from, page, perPage, source, status, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      reload();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const createBooking = useCallback(
    async (payload: CreateAdminBookingPayload) => {
      const res = await fetch(`${apiBase()}/api/v1/bookings/admin`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(nestApiErrorMessage(data, "No se pudo crear la reserva."));
      }
      reload();
      return data;
    },
    [authHeaders, reload],
  );

  const patchBooking = useCallback(
    async (id: string, payload: Partial<CreateAdminBookingPayload> & { status?: string }) => {
      const res = await fetch(`${apiBase()}/api/v1/bookings/admin/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(nestApiErrorMessage(data, "No se pudo actualizar."));
      }
      reload();
      return data;
    },
    [authHeaders, reload],
  );

  const removeBooking = useCallback(
    async (id: string) => {
      const res = await fetch(`${apiBase()}/api/v1/bookings/admin/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(nestApiErrorMessage(data, "No se pudo eliminar."));
      }
      reload();
    },
    [authHeaders, reload],
  );

  return { bookings, meta, isLoading, error, reload, createBooking, patchBooking, removeBooking };
}
