"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import {
  fetchBookClassEventContext,
  fetchBookClassEventsCatalog,
} from "../services/fetchBookClassCatalog";
import type {
  BookClassEventContext,
  BookClassEventOption,
} from "../types/bookClass.types";

export function useBookClassCatalog(eventId: string) {
  const [eventsLoading, setEventsLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [events, setEvents] = useState<BookClassEventOption[]>([]);
  const [context, setContext] = useState<BookClassEventContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = getAdminBearerToken();
    if (!token) {
      setEventsLoading(false);
      setError("Not signed in.");
      return;
    }
    setEventsLoading(true);
    void fetchBookClassEventsCatalog(token)
      .then((rows) => {
        if (!cancelled) {
          setEvents(rows);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load events.");
        }
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadContext = useCallback(async (id: string) => {
    if (!id.trim()) {
      setContext(null);
      return;
    }
    const token = getAdminBearerToken();
    if (!token) {
      setError("Not signed in.");
      return;
    }
    setContextLoading(true);
    setError(null);
    try {
      const row = await fetchBookClassEventContext(token, id);
      setContext(row);
    } catch (err: unknown) {
      setContext(null);
      setError(err instanceof Error ? err.message : "Could not load class event.");
    } finally {
      setContextLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!eventId.trim()) {
      setContext(null);
      return;
    }
    void loadContext(eventId);
  }, [eventId, loadContext]);

  return {
    events,
    eventsLoading,
    hasBookableEvents: !eventsLoading && events.length > 0,
    context,
    contextLoading,
    error,
    reloadContext: () => void loadContext(eventId),
  };
}
