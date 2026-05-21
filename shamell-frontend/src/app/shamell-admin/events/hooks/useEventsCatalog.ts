"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getEventsBearerToken } from "../lib/eventsAuth";
import { fetchAdminEvents } from "../services/fetchAdminEvents";
import { fetchAdminEventTypesForEvents } from "../services/fetchAdminEventTypesForEvents";
import type { AdminEvent, EventsEventTypeOption } from "../types/events.types";

function isOfflineError(err: unknown) {
  const description = err instanceof Error ? err.message : "Could not reach the server.";
  return description === "Failed to fetch" || !(err instanceof Error);
}

export function useEventsCatalog(onSeedEventTypes: (types: EventsEventTypeOption[]) => void) {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<EventsEventTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    const token = getEventsBearerToken();
    if (!token) {
      setEvents([]);
      setEventTypes([]);
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const [types, items] = await Promise.all([
        fetchAdminEventTypesForEvents(token),
        fetchAdminEvents(token),
      ]);
      setEventTypes(types);
      if (types.length > 0) onSeedEventTypes(types);
      setEvents(items);
    } catch (err) {
      const offline = isOfflineError(err);
      toast({
        variant: "destructive",
        title: offline ? "Offline" : "Error",
        description: offline
          ? "Could not reach the server."
          : err instanceof Error
            ? err.message
            : "Could not load events.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [onSeedEventTypes]);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  return { events, setEvents, eventTypes, isLoading, loadAllData };
}
