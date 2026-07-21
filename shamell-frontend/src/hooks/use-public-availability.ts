"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicAvailabilityRules } from "@/lib/bookingAvailability";

function apiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

type UsePublicAvailabilityOptions = {
  polling?: boolean;
};

export function usePublicAvailability(enabled = true, options?: UsePublicAvailabilityOptions) {
  const polling = options?.polling ?? true;
  const [rules, setRules] = useState<PublicAvailabilityRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    setIsLoading(true);
    setError(null);
    fetch(`${apiBase()}/api/v1/availability/public`, { cache: "no-store" })
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
      .then((data: unknown) => {
        if (!data || typeof data !== "object") {
          setRules(null);
          return;
        }
        const o = data as PublicAvailabilityRules;
        if (typeof o.timeZone !== "string" || !Array.isArray(o.weekly) || !Array.isArray(o.closures)) {
          setRules(null);
          return;
        }
        setRules(o);
      })
      .catch((e: unknown) => {
        setRules(null);
        setError(e instanceof Error ? e.message : "No se pudo cargar disponibilidad.");
      })
      .finally(() => setIsLoading(false));
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!enabled || !polling || typeof window === "undefined") return;

    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    const onFocus = () => reload();
    const interval = window.setInterval(reload, 60000);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, polling, reload]);

  return { rules, isLoading, error, reload };
}
