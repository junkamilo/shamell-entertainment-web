"use client";

import { useEffect, useMemo, useState } from "react";
import type { ServiceTypeItem } from "@/app/shamell-admin/service-types/types/serviceTypes.types";
import { PAGE_SIZE } from "../lib/servicesConstants";
import { formatPriceEn } from "../lib/servicesDisplay";
import type { AdminService, FilterTab, ServicesStats } from "../types/services.types";

type Args = {
  services: AdminService[];
  serviceTypes: ServiceTypeItem[];
};

export function useServicesList({ services, serviceTypes }: Args) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [typeFilterId, setTypeFilterId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const searchedServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter((service) => {
      const searchable = [
        service.serviceTypeName,
        service.description,
        formatPriceEn(service.price),
        ...service.items,
        service.isActive ? "activo" : "inactivo",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [services, searchQuery]);

  const tabCounts = useMemo(() => {
    const all = searchedServices.length;
    const active = searchedServices.filter((s) => s.isActive).length;
    return { all, active, inactive: all - active };
  }, [searchedServices]);

  const filteredServices = useMemo(() => {
    let list = searchedServices;
    if (filterTab === "active") list = list.filter((s) => s.isActive);
    if (filterTab === "inactive") list = list.filter((s) => !s.isActive);
    if (typeFilterId) list = list.filter((s) => s.serviceTypeId === typeFilterId);
    return list;
  }, [searchedServices, filterTab, typeFilterId]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTab, typeFilterId]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageOffset = (safePage - 1) * PAGE_SIZE;
  const paginatedServices = filteredServices.slice(pageOffset, pageOffset + PAGE_SIZE);

  const stats: ServicesStats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.isActive).length;
    const itemsTotal = services.reduce((acc, s) => acc + s.items.length, 0);
    return { total, active, inactive: total - active, itemsTotal };
  }, [services]);

  const typeMostUsedLabel = useMemo(() => {
    if (services.length === 0) return "—";
    const counts: Record<string, number> = {};
    for (const s of services) {
      const id = s.serviceTypeId;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    let bestId = "";
    let bestCount = 0;
    for (const [id, c] of Object.entries(counts)) {
      if (c > bestCount || (c === bestCount && (bestId === "" || id < bestId))) {
        bestCount = c;
        bestId = id;
      }
    }
    const name = serviceTypes.find((t) => t.id === bestId)?.name ?? bestId;
    const raw = name.trim() || "—";
    return raw.length > 22 ? `${raw.slice(0, 20)}…` : raw;
  }, [services, serviceTypes]);

  return {
    searchQuery,
    setSearchQuery,
    filterTab,
    setFilterTab,
    typeFilterId,
    setTypeFilterId,
    filtersOpen,
    setFiltersOpen,
    page,
    setPage,
    searchedServices,
    tabCounts,
    filteredServices,
    paginatedServices,
    pageOffset,
    safePage,
    totalPages,
    stats,
    typeMostUsedLabel,
  };
}
