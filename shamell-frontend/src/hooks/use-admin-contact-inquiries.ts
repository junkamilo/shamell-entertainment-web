"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";

export type ContactRequest = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  serviceType?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export function useAdminContactInquiries(enabled = true) {
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

    const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";
    setIsLoading(true);
    setError(null);

    fetch(`${apiBaseUrl}/api/v1/contact`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message ?? "Cannot load inquiries.");
        }
        return response.json();
      })
      .then((data: ContactRequest[]) => {
        setRequests(Array.isArray(data) ? data : []);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Cannot load inquiries.";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { requests, isLoading, error, reload };
}
