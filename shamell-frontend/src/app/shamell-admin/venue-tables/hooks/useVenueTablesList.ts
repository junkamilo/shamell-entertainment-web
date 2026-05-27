"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { fetchAdminVenueTables } from "../services/fetchAdminVenueTables";
import type { VenueTableConfig } from "../types/venueTables.types";

export function useVenueTablesList() {
  const [items, setItems] = useState<VenueTableConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setError("Not signed in.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminVenueTables(token);
      if (!result.ok) {
        setError(
          nestApiErrorMessage(
            null,
            result.status === 401 ? "Invalid or expired token." : "Could not load tables.",
          ),
        );
        return;
      }
      setItems(result.items);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
