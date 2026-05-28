"use client";

import { useEffect, useMemo, useState } from "react";
import { PAGE_SIZE } from "../lib/eventsConstants";
import { formatShortDateUs } from "../lib/eventsDisplay";
import { formatPriceEn } from "../lib/eventsPrice";
import type { AdminEvent, EventsStats } from "../types/events.types";

export function useEventsList(
  events: AdminEvent[],
  defaultSectionFilter: "ALL" | "GENERAL" | "UPCOMING_EVENTS" = "ALL",
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<
    "ALL" | "GENERAL" | "UPCOMING_EVENTS"
  >(defaultSectionFilter);
  const [page, setPage] = useState(1);

  const filteredBySection = useMemo(() => {
    if (sectionFilter === "ALL") return events;
    return events.filter((item) => item.publicSection === sectionFilter);
  }, [events, sectionFilter]);

  const searchedEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredBySection;
    return filteredBySection.filter((item) => {
      const searchable = [
        item.eventTypeName,
        item.description,
        ...item.items,
        item.publicSection === "UPCOMING_EVENTS" ? "upcoming events" : "general events",
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
  }, [filteredBySection, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sectionFilter]);

  useEffect(() => {
    setSectionFilter(defaultSectionFilter);
  }, [defaultSectionFilter]);

  const totalPages = Math.max(1, Math.ceil(searchedEvents.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageOffset = (safePage - 1) * PAGE_SIZE;
  const paginatedEvents = searchedEvents.slice(pageOffset, pageOffset + PAGE_SIZE);

  const stats: EventsStats = useMemo(() => {
    const scoped = filteredBySection;
    const total = scoped.length;
    const activeCount = scoped.filter((e) => e.isActive).length;
    const itemsTotal = scoped.reduce((acc, e) => acc + e.items.length, 0);
    const activeWithDates = scoped.filter((e) => e.isActive);
    let nearestLabel = "—";
    if (activeWithDates.length > 0) {
      const sorted = [...activeWithDates].sort((a, b) => {
        const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      nearestLabel = formatShortDateUs(sorted[0]?.updatedAt ?? sorted[0]?.createdAt);
    }
    return {
      total,
      activeCount,
      inactiveCount: total - activeCount,
      itemsTotal,
      nearestLabel,
    };
  }, [filteredBySection]);

  return {
    searchQuery,
    setSearchQuery,
    sectionFilter,
    setSectionFilter,
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
