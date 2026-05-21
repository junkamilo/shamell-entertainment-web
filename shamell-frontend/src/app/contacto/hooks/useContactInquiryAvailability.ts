"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { hhmmToMinutes } from "@/lib/contactLogisticsUtils";
import {
  expandBlockedDateReasonsMap,
  expandBlockedDates,
  isoDateInTzNow,
  timeBoundsForDateISO,
} from "@/lib/bookingAvailability";
import { usePublicAvailability } from "@/hooks/use-public-availability";
import { fetchOccupiedRanges } from "../services/fetchOccupiedRanges";
import type { WizardData } from "../lib/inquiry/wizardTypes";

type UseContactInquiryAvailabilityArgs = {
  data: WizardData;
  setData: Dispatch<SetStateAction<WizardData>>;
  setStepError: Dispatch<SetStateAction<string | null>>;
};

export function useContactInquiryAvailability({
  data,
  setData,
  setStepError,
}: UseContactInquiryAvailabilityArgs) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerWhich, setTimePickerWhich] = useState<null | "start" | "end">(null);
  const [occupiedRanges, setOccupiedRanges] = useState<
    Array<{ startMinutes: number; endMinutes: number }>
  >([]);

  const bookingTz = useMemo(() => process.env.NEXT_PUBLIC_BOOKING_TZ ?? "America/New_York", []);
  const { rules: availabilityRules } = usePublicAvailability(true);
  const blockedIsoDates = useMemo(() => {
    if (!availabilityRules?.weekly) return new Set<string>();
    return expandBlockedDates(bookingTz, availabilityRules.weekly, availabilityRules.closures, 420);
  }, [availabilityRules, bookingTz]);

  const blockedReasonByIso = useMemo(() => {
    if (!availabilityRules?.weekly) return new Map<string, string>();
    return expandBlockedDateReasonsMap(
      bookingTz,
      availabilityRules.weekly,
      availabilityRules.closures,
      420,
    );
  }, [availabilityRules, bookingTz]);

  const startTimeClamp = useMemo(() => {
    if (!availabilityRules?.weekly || !data.eventDate) return undefined;
    return timeBoundsForDateISO(data.eventDate, bookingTz, availabilityRules.weekly);
  }, [availabilityRules, data.eventDate, bookingTz]);

  const minSelectableIso = availabilityRules ? isoDateInTzNow(bookingTz) : undefined;

  useEffect(() => {
    if (!data.eventDate) {
      setOccupiedRanges([]);
      return;
    }
    let cancelled = false;
    const loadOccupied = () => {
      fetchOccupiedRanges(data.eventDate)
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
  }, [data.eventDate]);

  useEffect(() => {
    if (!data.eventDate) return;

    if (blockedIsoDates.has(data.eventDate)) {
      setData((prev) =>
        prev.eventDate
          ? {
              ...prev,
              eventDate: "",
              eventTimeStart: "",
              eventTimeEnd: "",
            }
          : prev,
      );
      setStepError("That date just became unavailable. Please choose another date.");
      return;
    }

    if (!startTimeClamp) return;
    const min = startTimeClamp.minMinutes;
    const max = startTimeClamp.maxMinutes;
    const startMin = data.eventTimeStart ? hhmmToMinutes(data.eventTimeStart) : null;
    const endMin = data.eventTimeEnd ? hhmmToMinutes(data.eventTimeEnd) : null;

    if (
      (startMin !== null && (startMin < min || startMin > max)) ||
      (endMin !== null && (endMin < min || endMin > max))
    ) {
      setData((prev) => ({
        ...prev,
        eventTimeStart: "",
        eventTimeEnd: "",
      }));
      setStepError("The time window changed for that date. Please select times again.");
    }
  }, [blockedIsoDates, data.eventDate, data.eventTimeStart, data.eventTimeEnd, startTimeClamp, setData, setStepError]);

  useEffect(() => {
    const startMin = data.eventTimeStart ? hhmmToMinutes(data.eventTimeStart) : null;
    const endMin = data.eventTimeEnd ? hhmmToMinutes(data.eventTimeEnd) : null;
    const intersectsBlocked = (m: number | null) =>
      m !== null && occupiedRanges.some((r) => m >= r.startMinutes && m <= r.endMinutes);
    if (!intersectsBlocked(startMin) && !intersectsBlocked(endMin)) return;
    setData((prev) => ({
      ...prev,
      eventTimeStart: "",
      eventTimeEnd: "",
    }));
    setStepError("That schedule is no longer available. Please choose another time.");
  }, [data.eventTimeStart, data.eventTimeEnd, occupiedRanges, setData, setStepError]);

  return {
    datePickerOpen,
    setDatePickerOpen,
    timePickerWhich,
    setTimePickerWhich,
    occupiedRanges,
    bookingTz,
    availabilityRules,
    blockedIsoDates,
    blockedReasonByIso,
    startTimeClamp,
    minSelectableIso,
  };
}
