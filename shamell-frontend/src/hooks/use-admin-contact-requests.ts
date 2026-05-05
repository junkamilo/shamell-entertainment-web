"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";

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
  isRead: boolean;
  createdAt: string;
};

function apiBase() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";
}

export function useAdminContactRequests(enabled = true) {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
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

    fetch(`${apiBase()}/api/v1/contact`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            typeof (data as { message?: string }).message === "string"
              ? (data as { message: string }).message
              : "No se pudieron cargar las solicitudes.",
          );
        }
        return response.json();
      })
      .then((data: ContactRequest[]) => {
        setRequests(Array.isArray(data) ? data : []);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "No se pudieron cargar las solicitudes.";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const markAsRead = useCallback(async (id: string) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;
    const res = await fetch(`${apiBase()}/api/v1/contact/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg =
        typeof (data as { message?: string }).message === "string"
          ? (data as { message: string }).message
          : "No se pudo marcar como leída.";
      throw new Error(msg);
    }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: true } : r)));
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
          : "No se pudo eliminar.";
      throw new Error(msg);
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { requests, isLoading, error, reload, markAsRead, remove };
}
