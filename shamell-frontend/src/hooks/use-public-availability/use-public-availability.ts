"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicAvailabilityRules } from "@/lib/contacto/bookingAvailability";

function apiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

/** Shared short-lived cache so remounting contacto does not spam `/availability/public`. */
const CACHE_TTL_MS = 60_000;
let cachedRules: PublicAvailabilityRules | null = null;
let cachedAt = 0;

export function clearPublicAvailabilityCache(): void {
  cachedRules = null;
  cachedAt = 0;
}

function readFreshCache(): PublicAvailabilityRules | null {
  if (!cachedRules) return null;
  if (Date.now() - cachedAt > CACHE_TTL_MS) return null;
  return cachedRules;
}

function writeCache(rules: PublicAvailabilityRules): void {
  cachedRules = rules;
  cachedAt = Date.now();
}

function parsePublicAvailability(data: unknown): PublicAvailabilityRules | null {
  if (!data || typeof data !== "object") return null;
  const o = data as PublicAvailabilityRules;
  if (typeof o.timeZone !== "string" || !Array.isArray(o.weekly) || !Array.isArray(o.closures)) {
    return null;
  }
  return o;
}

type UsePublicAvailabilityOptions = {
  /** Focus / visibility / interval refresh. Default true (admin agenda). */
  polling?: boolean;
};

type ReloadOptions = {
  /** Bypass the in-memory TTL cache. */
  force?: boolean;
  /** Avoid flipping `isLoading` (background refresh). */
  quiet?: boolean;
};

export function usePublicAvailability(enabled = true, options?: UsePublicAvailabilityOptions) {
  const polling = options?.polling ?? true;
  const initialCache = typeof window !== "undefined" ? readFreshCache() : null;
  const [rules, setRules] = useState<PublicAvailabilityRules | null>(initialCache);
  const [isLoading, setIsLoading] = useState(!initialCache && enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback((opts?: ReloadOptions) => {
    if (!enabled || typeof window === "undefined") return;

    if (!opts?.force) {
      const hit = readFreshCache();
      if (hit) {
        setRules(hit);
        setError(null);
        setIsLoading(false);
        return;
      }
    }

    if (!opts?.quiet) setIsLoading(true);
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
        const parsed = parsePublicAvailability(data);
        if (!parsed) {
          setRules(null);
          return;
        }
        writeCache(parsed);
        setRules(parsed);
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

    const refresh = () => reload({ force: true, quiet: true });
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(refresh, 60000);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [enabled, polling, reload]);

  return { rules, isLoading, error, reload };
}
