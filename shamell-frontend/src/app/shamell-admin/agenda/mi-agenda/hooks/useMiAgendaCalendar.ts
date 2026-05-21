"use client";

import { useCallback, useMemo, useState } from "react";
import { MONTH_LABEL, RANGE_LABEL } from "../lib/miAgendaConstants";
import {
  addDaysIso,
  bookingTimeZone,
  isoFromTzDate,
  mondayStartIso,
  monthEndIso,
  monthStartIso,
  shiftAnchor,
} from "../lib/miAgendaDateUtils";
import type { CalendarRange, ViewMode } from "../types/miAgenda.types";

export function useMiAgendaCalendar() {
  const tz = useMemo(() => bookingTimeZone(), []);
  const todayIso = useMemo(() => isoFromTzDate(new Date(), tz), [tz]);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchorIso, setAnchorIso] = useState(todayIso);

  const range = useMemo<CalendarRange>(() => {
    if (viewMode === "day") return { fromIso: anchorIso, toIso: anchorIso };
    if (viewMode === "week") {
      const fromIso = mondayStartIso(anchorIso);
      return { fromIso, toIso: addDaysIso(fromIso, 6) };
    }
    const fromIso = monthStartIso(anchorIso);
    return { fromIso, toIso: monthEndIso(anchorIso) };
  }, [anchorIso, viewMode]);

  const weekDays = useMemo(() => {
    const monday = mondayStartIso(anchorIso);
    return Array.from({ length: 7 }, (_, i) => addDaysIso(monday, i));
  }, [anchorIso]);

  const monthGrid = useMemo(() => {
    const start = monthStartIso(anchorIso);
    const gridStart = mondayStartIso(start);
    return Array.from({ length: 42 }, (_, i) => addDaysIso(gridStart, i));
  }, [anchorIso]);

  const rangeText = useMemo(() => {
    if (viewMode === "day") return RANGE_LABEL.format(new Date(`${anchorIso}T12:00:00Z`));
    if (viewMode === "week") {
      return `${RANGE_LABEL.format(new Date(`${range.fromIso}T12:00:00Z`))} - ${RANGE_LABEL.format(new Date(`${range.toIso}T12:00:00Z`))}`;
    }
    return MONTH_LABEL.format(new Date(`${monthStartIso(anchorIso)}T12:00:00Z`));
  }, [anchorIso, range.fromIso, range.toIso, viewMode]);

  const goPrev = useCallback(() => {
    setAnchorIso((cur) => shiftAnchor(cur, viewMode, -1));
  }, [viewMode]);

  const goNext = useCallback(() => {
    setAnchorIso((cur) => shiftAnchor(cur, viewMode, 1));
  }, [viewMode]);

  const goToday = useCallback(() => {
    setAnchorIso(todayIso);
  }, [todayIso]);

  return {
    tz,
    todayIso,
    viewMode,
    setViewMode,
    anchorIso,
    range,
    weekDays,
    monthGrid,
    rangeText,
    goPrev,
    goNext,
    goToday,
  };
}
