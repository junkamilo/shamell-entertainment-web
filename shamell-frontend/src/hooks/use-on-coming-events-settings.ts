"use client";

import { useCallback, useEffect, useState } from "react";
import { getPublicApiBaseUrl } from "@/app/contacto/lib/apiBaseUrl";
import { ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT } from "@/lib/onComingEventsSettingsEvents";

export type OnComingEventsPromo = {
  clientEnabled: boolean;
  promoTitle: string | null;
  promoDescription: string | null;
  promoImageUrl: string | null;
  reservationEventDate: string | null;
  reservationOpensAt: string | null;
  reservationClosesAt: string | null;
  reservationEventLabel: string | null;
  reservationTimezone: string;
  updatedAt: string | null;
};

/** @deprecated Use OnComingEventsPromo */
export type VenueLayoutPromo = OnComingEventsPromo;

const defaultPromo: OnComingEventsPromo = {
  clientEnabled: false,
  promoTitle: null,
  promoDescription: null,
  promoImageUrl: null,
  reservationEventDate: null,
  reservationOpensAt: null,
  reservationClosesAt: null,
  reservationEventLabel: null,
  reservationTimezone: "America/New_York",
  updatedAt: null,
};

export function useOnComingEventsSettings() {
  const [promo, setPromo] = useState<OnComingEventsPromo>(defaultPromo);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiBaseUrl = getPublicApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/on-coming-events/settings`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("settings unavailable");
      const data = (await response.json()) as OnComingEventsPromo;
      setPromo({
        clientEnabled: Boolean(data.clientEnabled),
        promoTitle: data.promoTitle ?? null,
        promoDescription: data.promoDescription ?? null,
        promoImageUrl: data.promoImageUrl ?? null,
        reservationEventDate: data.reservationEventDate ?? null,
        reservationOpensAt: data.reservationOpensAt ?? null,
        reservationClosesAt: data.reservationClosesAt ?? null,
        reservationEventLabel: data.reservationEventLabel ?? null,
        reservationTimezone: data.reservationTimezone ?? "America/New_York",
        updatedAt: data.updatedAt ?? null,
      });
    } catch {
      setPromo(defaultPromo);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

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
