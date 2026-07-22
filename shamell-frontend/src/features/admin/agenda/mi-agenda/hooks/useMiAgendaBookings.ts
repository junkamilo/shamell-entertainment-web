"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import type { CreateAdminBookingPayload } from "@/hooks/use-admin-bookings";
import { useAdminBookings } from "@/hooks/use-admin-bookings";
import { enrichBookings } from "../lib/miAgendaBookingUtils";
import { fetchMiAgendaBookings } from "../services/fetchMiAgendaBookings";
import type { CalendarRange, EnrichedBooking } from "../types/miAgenda.types";

export function useMiAgendaBookings(range: CalendarRange, tz: string) {
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { patchBooking } = useAdminBookings(false);

  const reload = useCallback(() => {
    const token = getAdminBearerToken();
    if (!token) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    void fetchMiAgendaBookings(token, {
      activeOnly: true,
      perPage: 50,
      from: `${range.fromIso}T00:00:00.000Z`,
      to: `${range.toIso}T23:59:59.999Z`,
    })
      .then((result) => {
        setBookings(enrichBookings(result.bookings, tz));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error.");
        setBookings([]);
      })
      .finally(() => setIsLoading(false));
  }, [range.fromIso, range.toIso, tz]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      reload();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const patchBookingAndReload = useCallback(
    async (
      id: string,
      payload: Partial<CreateAdminBookingPayload> & { status?: string },
    ) => {
      await patchBooking(id, payload);
      reload();
    },
    [patchBooking, reload],
  );

  const items = bookings;

  const byDate = useMemo(() => {
    const map = new Map<string, EnrichedBooking[]>();
    for (const item of items) {
      if (!map.has(item.dateIso)) map.set(item.dateIso, []);
      map.get(item.dateIso)?.push(item);
    }
    return map;
  }, [items]);

  return { items, byDate, isLoading, error, patchBooking: patchBookingAndReload };
}
