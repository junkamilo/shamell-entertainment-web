"use client";

import { useEffect, useState } from "react";
import { fetchOccupiedRanges } from "@/features/contacto/services/fetchOccupiedRanges";
import type { OccupiedRange } from "../types/agendar.types";

type UseAgendarOccupiedRangesOptions = {
  polling?: boolean;
  refreshKey?: number | string | boolean;
};

export function useAgendarOccupiedRanges(
  eventDateIso: string,
  options?: UseAgendarOccupiedRangesOptions,
) {
  const polling = options?.polling ?? true;
  const refreshKey = options?.refreshKey ?? 0;
  const [occupiedRanges, setOccupiedRanges] = useState<OccupiedRange[]>([]);

  useEffect(() => {
    if (!eventDateIso) {
      setOccupiedRanges([]);
      return;
    }

    let cancelled = false;
    const loadOccupied = () => {
      fetchOccupiedRanges(eventDateIso)
        .then((parsed) => {
          if (!cancelled) setOccupiedRanges(parsed);
        })
        .catch(() => {
          if (!cancelled) setOccupiedRanges([]);
        });
    };

    loadOccupied();

    if (!polling) {
      return () => {
        cancelled = true;
      };
    }

    const interval = window.setInterval(loadOccupied, 45000);
    const onFocus = () => loadOccupied();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadOccupied();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [eventDateIso, polling, refreshKey]);

  return { occupiedRanges };
}
