"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPublicApiBaseUrl } from "@/app/contacto/lib/apiBaseUrl";
import { ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT } from "@/lib/onComingEventsSettingsEvents";
import {
  defaultOnComingSettings,
  normalizeOnComingSettings,
  type OnComingEventsPromo,
} from "@/lib/onComingSettings";

export type { OnComingEventsPromo };

/** @deprecated Use OnComingEventsPromo */
export type VenueLayoutPromo = OnComingEventsPromo;

export function useOnComingEventsSettings(
  initialSettings?: OnComingEventsPromo | null,
) {
  const [promo, setPromo] = useState<OnComingEventsPromo>(
    initialSettings ?? defaultOnComingSettings,
  );
  const [isLoading, setIsLoading] = useState(!initialSettings);
  const skipInitialLoad = useRef(Boolean(initialSettings));

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiBaseUrl = getPublicApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/on-coming-events/settings`, {
        next: { revalidate: 120 },
      });
      if (!response.ok) throw new Error("settings unavailable");
      setPromo(normalizeOnComingSettings(await response.json()));
    } catch {
      setPromo(defaultOnComingSettings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // SSR already seeded the settings; skip the first client fetch.
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
    } else {
      void load();
    }

    const onChanged = () => void load();
    window.addEventListener(ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT, onChanged);
    window.addEventListener("focus", onChanged);

    return () => {
      window.removeEventListener(ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT, onChanged);
      window.removeEventListener("focus", onChanged);
    };
  }, [load]);

  return { promo, clientEnabled: promo.clientEnabled, isLoading, reload: load };
}

/** @deprecated Use useOnComingEventsSettings */
export const useVenueLayoutSettings = useOnComingEventsSettings;
