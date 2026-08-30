"use client";

import { useCallback, useEffect, useState } from "react";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";
import { subscribeOnComingEventsPublicDataChanged } from "@/lib/on-coming-events/onComingEventsSettingsEvents";
import {
  defaultOnComingSettings,
  normalizeOnComingSettings,
  type OnComingEventsPromo,
} from "@/lib/on-coming-events/onComingSettings";

export type { OnComingEventsPromo };

/** @deprecated Use OnComingEventsPromo */
export type VenueLayoutPromo = OnComingEventsPromo;

const CACHE_TTL_MS = 60_000;
let cachedPromo: OnComingEventsPromo | null = null;
let cachedAt = 0;
let inFlight: Promise<OnComingEventsPromo> | null = null;

export function clearOnComingEventsSettingsCache(): void {
  cachedPromo = null;
  cachedAt = 0;
  inFlight = null;
}

function readFreshCache(): OnComingEventsPromo | null {
  if (typeof window === "undefined") return null;
  if (!cachedPromo) return null;
  if (Date.now() - cachedAt > CACHE_TTL_MS) return null;
  return cachedPromo;
}

function writeCache(promo: OnComingEventsPromo): void {
  if (typeof window === "undefined") return;
  cachedPromo = promo;
  cachedAt = Date.now();
}

function seedCache(settings: OnComingEventsPromo): OnComingEventsPromo {
  const normalized = normalizeOnComingSettings(settings);
  writeCache(normalized);
  return normalized;
}

async function fetchOnComingSettings(): Promise<OnComingEventsPromo> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const apiBaseUrl = getPublicApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/v1/on-coming-events/settings`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("settings unavailable");
    const promo = normalizeOnComingSettings(await response.json());
    writeCache(promo);
    return promo;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

type LoadOptions = {
  quiet?: boolean;
  /** Bypass TTL cache (admin settings-changed, explicit reload). */
  force?: boolean;
};

export function useOnComingEventsSettings(
  initialSettings?: OnComingEventsPromo | null,
) {
  const [promo, setPromo] = useState<OnComingEventsPromo>(() => {
    if (initialSettings) return seedCache(initialSettings);
    return readFreshCache() ?? defaultOnComingSettings;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (initialSettings) return false;
    return !readFreshCache();
  });

  const load = useCallback(async (opts?: LoadOptions) => {
    if (typeof window === "undefined") return;

    if (!opts?.force) {
      const hit = readFreshCache();
      if (hit) {
        setPromo(hit);
        setIsLoading(false);
        return;
      }
    }

    if (!opts?.quiet) setIsLoading(true);
    try {
      const next = await fetchOnComingSettings();
      setPromo(next);
    } catch {
      if (!opts?.quiet) {
        setPromo(defaultOnComingSettings);
        writeCache(defaultOnComingSettings);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSettings) {
      void load();
    }

    return subscribeOnComingEventsPublicDataChanged(() => {
      void load({ quiet: true, force: true });
    });
  }, [initialSettings, load]);

  return { promo, clientEnabled: promo.clientEnabled, isLoading, reload: load };
}

/** @deprecated Use useOnComingEventsSettings */
export const useVenueLayoutSettings = useOnComingEventsSettings;
