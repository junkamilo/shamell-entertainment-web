"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { fetchAdminStandaloneChairs } from "../services/fetchAdminStandaloneChairs";
import type { StandaloneChairInventoryItem } from "../types/standaloneChairs.types";

export function useStandaloneChairsConfig() {
  const [loading, setLoading] = useState(true);
  const [chairs, setChairs] = useState<StandaloneChairInventoryItem[]>([]);
  const [unitPrice, setUnitPrice] = useState(0);
  const [reservedCount, setReservedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const load = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchAdminStandaloneChairs(token);
      if (result.ok && result.config) {
        setChairs(result.config.chairs ?? []);
        setUnitPrice(result.config.unitPrice);
        setReservedCount(result.config.reservedCount ?? 0);
        setTotalCount(result.config.totalCount ?? result.config.chairs?.length ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    loading,
    chairs,
    unitPrice,
    reservedCount,
    totalCount,
    reload: load,
  };
}
