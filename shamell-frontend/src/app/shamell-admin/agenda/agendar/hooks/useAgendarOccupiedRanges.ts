"use client";

import { useEffect, useState } from "react";
import { fetchOccupiedRangesForDate } from "../services/fetchOccupiedRangesForDate";
import type { OccupiedRange } from "../types/agendar.types";

export function useAgendarOccupiedRanges(eventDateIso: string) {
  const [occupiedRanges, setOccupiedRanges] = useState<OccupiedRange[]>([]);

  useEffect(() => {
    if (!eventDateIso) {
      setOccupiedRanges([]);
      return;
    }

    let cancelled = false;
    const loadOccupied = () => {
      fetchOccupiedRangesForDate(eventDateIso)
        .then((parsed) => {
          if (!cancelled) setOccupiedRanges(parsed);
        })
        .catch(() => {
          if (!cancelled) setOccupiedRanges([]);
        });
    };

    loadOccupied();
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
  }, [eventDateIso]);

  return { occupiedRanges };
}
