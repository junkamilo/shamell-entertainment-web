"use client";

import { useCallback, useEffect, useState } from "react";
import type { OnComingEventHubCardItem } from "@/features/on-coming-events/components/OnComingEventHubCard";
import { fetchPublicUpcomingHubEvents } from "@/features/on-coming-events/services/fetchPublicUpcomingHubEvents";
import { subscribeOnComingEventsPublicDataChanged } from "@/lib/on-coming-events/onComingEventsSettingsEvents";

type UsePublicUpcomingHubEventsOptions = {
  initialEvents?: OnComingEventHubCardItem[];
  enabled: boolean;
};

export function usePublicUpcomingHubEvents({
  initialEvents,
  enabled,
}: UsePublicUpcomingHubEventsOptions) {
  const seededEvents = initialEvents ?? [];
  const [events, setEvents] = useState<OnComingEventHubCardItem[]>(seededEvents);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const reload = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!enabled) {
      setEvents([]);
      setIsRefreshing(false);
      return;
    }

    if (!opts?.quiet) setIsRefreshing(true);
    try {
      const next = await fetchPublicUpcomingHubEvents();
      setEvents(next);
    } catch {
      /* keep current events on failure */
    } finally {
      setIsRefreshing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      setIsRefreshing(false);
      return;
    }

    void reload({ quiet: seededEvents.length > 0 });

    return subscribeOnComingEventsPublicDataChanged(() => {
      void reload({ quiet: true });
    });
  }, [enabled, reload, seededEvents.length]);

  return { events, isRefreshing, reload };
}
