"use client";

import { useMemo } from "react";
import {
  expandBlockedDateReasonsMap,
  expandBlockedDates,
  isoDateInTzNow,
  timeBoundsForDateISO,
} from "@/lib/bookingAvailability";
import { usePublicAvailability } from "@/hooks/use-public-availability";

export function useAgendarAvailability(eventDateIso: string) {
  const { rules: availabilityRules } = usePublicAvailability(true);

  const bookingTz = useMemo(
    () => availabilityRules?.timeZone ?? process.env.NEXT_PUBLIC_BOOKING_TZ ?? "America/New_York",
    [availabilityRules?.timeZone],
  );

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
    if (!availabilityRules?.weekly || !eventDateIso) return undefined;
    return timeBoundsForDateISO(eventDateIso, bookingTz, availabilityRules.weekly);
  }, [availabilityRules, eventDateIso, bookingTz]);

  const minSelectableIso = availabilityRules ? isoDateInTzNow(bookingTz) : undefined;

  return {
    bookingTz,
    blockedIsoDates,
    blockedReasonByIso,
    startTimeClamp,
    minSelectableIso,
  };
}
