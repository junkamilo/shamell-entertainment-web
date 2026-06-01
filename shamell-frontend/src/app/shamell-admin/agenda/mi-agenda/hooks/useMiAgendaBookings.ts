"use client";

import { useMemo } from "react";
import { useAdminBookings } from "@/hooks/use-admin-bookings";
import { enrichBookings } from "../lib/miAgendaBookingUtils";
import type { CalendarRange, EnrichedBooking } from "../types/miAgenda.types";

export function useMiAgendaBookings(range: CalendarRange, tz: string) {
  const { bookings, isLoading, error, patchBooking } = useAdminBookings(true, {
    activeOnly: true,
    perPage: 50,
    from: `${range.fromIso}T00:00:00.000Z`,
    to: `${range.toIso}T23:59:59.999Z`,
  });

  const items = useMemo<EnrichedBooking[]>(() => enrichBookings(bookings, tz), [bookings, tz]);

  const byDate = useMemo(() => {
    const map = new Map<string, EnrichedBooking[]>();
    for (const item of items) {
      if (!map.has(item.dateIso)) map.set(item.dateIso, []);
      map.get(item.dateIso)?.push(item);
    }
    return map;
  }, [items]);

  return { items, byDate, isLoading, error, patchBooking };
}
