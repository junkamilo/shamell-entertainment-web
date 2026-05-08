"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import type { PublicWeeklySlot, PublicClosure } from "@/lib/bookingAvailability";

function apiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

export type AdminAvailabilitySnapshot = {
  timeZone: string;
  weekly: (PublicWeeklySlot & { id: string; updatedAt: string })[];
  closures: (PublicClosure & { id: string; note: string | null; createdAt: string })[];
};

export function useAdminAvailability(enabled = true) {
  const [snapshot, setSnapshot] = useState<AdminAvailabilitySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setSnapshot(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    fetch(`${apiBase()}/api/v1/availability/admin`, { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            typeof (data as { message?: string }).message === "string"
              ? (data as { message: string }).message
              : "No se pudo cargar disponibilidad.",
          );
        }
        return res.json();
      })
      .then((data: AdminAvailabilitySnapshot) => setSnapshot(data))
      .catch((e: unknown) => {
        setSnapshot(null);
        setError(e instanceof Error ? e.message : "Error.");
      })
      .finally(() => setIsLoading(false));
  }, [authHeaders, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const putWeekly = useCallback(
    async (slots: PublicWeeklySlot[]) => {
      const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
      if (!token) throw new Error("Sin sesión.");
      const res = await fetch(`${apiBase()}/api/v1/availability/admin/weekly`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ slots }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof (data as { message?: string }).message === "string"
            ? (data as { message: string }).message
            : "No se pudo guardar.",
        );
      }
      setSnapshot(data as AdminAvailabilitySnapshot);
      return data;
    },
    [authHeaders],
  );

  const createClosure = useCallback(
    async (body: {
      kind: "SPECIFIC_DATE" | "RECURRING_WEEKDAY" | "DATE_RANGE";
      date?: string;
      weekday?: number;
      startDate?: string;
      endDate?: string;
      note?: string;
    }) => {
      const res = await fetch(`${apiBase()}/api/v1/availability/admin/closures`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof (data as { message?: string }).message === "string"
            ? (data as { message: string }).message
            : "No se pudo crear el cierre.",
        );
      }
      reload();
      return data;
    },
    [authHeaders, reload],
  );

  const removeClosure = useCallback(
    async (id: string) => {
      const res = await fetch(`${apiBase()}/api/v1/availability/admin/closures/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof (data as { message?: string }).message === "string"
            ? (data as { message: string }).message
            : "No se pudo eliminar.",
        );
      }
      reload();
    },
    [authHeaders, reload],
  );

  return {
    snapshot,
    isLoading,
    error,
    reload,
    putWeekly,
    createClosure,
    removeClosure,
  };
}
