"use client";

import { useEffect, useMemo, useState } from "react";
import { PAGE_SIZE } from "../lib/eventsConstants";
import { formatShortDateUs } from "../lib/eventsDisplay";
import { formatPriceEn } from "../lib/eventsPrice";
import type { AdminEvent, EventsStats } from "../types/events.types";

export function useEventsList(events: AdminEvent[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const searchedEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter((item) => {
      const searchable = [
        item.eventTypeName,
        item.description,
        ...item.items,
        formatPriceEn(item.price),
        item.isActive ? "active" : "inactive",
        "upcoming",
        "proximo",
        "completed",
        String(item.bookingCount ?? 0),
        "booking",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [events, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(searchedEvents.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageOffset = (safePage - 1) * PAGE_SIZE;
  const paginatedEvents = searchedEvents.slice(pageOffset, pageOffset + PAGE_SIZE);

  const stats: EventsStats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter((e) => e.isActive).length;
    const itemsTotal = events.reduce((acc, e) => acc + e.items.length, 0);
    const activeWithDates = events.filter((e) => e.isActive);
    let nearestLabel = "—";
    if (activeWithDates.length > 0) {
      const sorted = [...activeWithDates].sort((a, b) => {
        const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      nearestLabel = formatShortDateUs(sorted[0]?.updatedAt ?? sorted[0]?.createdAt);
    }
    return { total, upcoming, completed: total - upcoming, itemsTotal, nearestLabel };
  }, [events]);

  return {
    searchQuery,
    setSearchQuery,
    searchedEvents,
    paginatedEvents,
    page,
    setPage,
    safePage,
    totalPages,
    pageOffset,
    stats,
  };
}
