"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PublicWeeklySlot } from "@/lib/bookingAvailability";
import { defaultWeekly } from "../lib/disponibilidadConstants";
import type { AdminAvailabilitySnapshot } from "../types/disponibilidad.types";

export function useWeeklyHoursDraft(snapshot: AdminAvailabilitySnapshot | null) {
  const [weeklyDraft, setWeeklyDraft] = useState<PublicWeeklySlot[]>(defaultWeekly);
  const [savingWeekly, setSavingWeekly] = useState(false);

  useEffect(() => {
    if (!snapshot?.weekly?.length) return;
    const byDay = [...snapshot.weekly].sort((a, b) => a.weekday - b.weekday);
    if (byDay.length === 7) {
      setWeeklyDraft(
        byDay.map((w) => ({
          weekday: w.weekday,
          isClosed: w.isClosed,
          startTime: w.startTime,
          endTime: w.endTime,
        })),
      );
    }
  }, [snapshot]);

  const sortedRows = useMemo(
    () => weeklyDraft.slice().sort((a, b) => a.weekday - b.weekday),
    [weeklyDraft],
  );

  const updateRowClosed = useCallback((weekday: number, isClosed: boolean) => {
    setWeeklyDraft((prev) =>
      prev.map((w) =>
        w.weekday === weekday
          ? {
              ...w,
              isClosed,
              startTime: isClosed ? null : w.startTime ?? "09:00",
              endTime: isClosed ? null : w.endTime ?? "21:00",
            }
          : w,
      ),
    );
  }, []);

  const setRowTime = useCallback((weekday: number, field: "start" | "end", hhmm: string) => {
    setWeeklyDraft((prev) =>
      prev.map((w) =>
        w.weekday === weekday ? { ...w, [field === "start" ? "startTime" : "endTime"]: hhmm } : w,
      ),
    );
  }, []);

  return {
    weeklyDraft,
    setWeeklyDraft,
    savingWeekly,
    setSavingWeekly,
    sortedRows,
    updateRowClosed,
    setRowTime,
  };
}
