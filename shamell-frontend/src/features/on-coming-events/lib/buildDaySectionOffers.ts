import type { ClassSessionPublic } from "../services/fetchUpcomingClassSessions";
import type { PublicClassSection } from "../services/fetchOnComingEventDetail";

export type DaySectionOffer = {
  sectionId: string;
  label: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  sessionId: string | null;
  price: number | null;
  capacity: number;
  seatsSold: number;
  seatsRemaining: number;
  available: boolean;
};

/** English copy for total capacity, sold, and remaining seats. */
export function formatSeatAvailability(
  capacity: number,
  seatsRemaining: number,
): string {
  const cap = Math.max(0, Math.round(capacity));
  const remaining = Math.max(0, Math.round(seatsRemaining));
  const sold = Math.max(0, cap - remaining);
  const spot = (n: number) => (n === 1 ? "spot" : "spots");

  if (cap <= 0) {
    return remaining > 0 ?
        `${remaining} ${spot(remaining)} available`
      : "Availability updating";
  }
  if (sold <= 0) {
    return `${cap} ${spot(cap)} total · none sold yet · ${remaining} available`;
  }
  if (remaining <= 0) {
    return `${cap} ${spot(cap)} total · ${sold} sold · sold out`;
  }
  return `${cap} ${spot(cap)} total · ${sold} sold · ${remaining} available`;
}

/** Calendar date (YYYY-MM-DD) for a session instant in its timezone. */
export function sessionDateIso(
  session: Pick<ClassSessionPublic, "startsAt" | "timezone">,
  fallbackTimezone: string,
): string {
  const tz = session.timezone?.trim() || fallbackTimezone;
  const d = new Date(session.startsAt);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function sessionsOnDate(
  sessions: ClassSessionPublic[],
  dateIso: string,
  weekday: number,
  timezone: string,
): ClassSessionPublic[] {
  return sessions.filter(
    (s) =>
      s.weekday === weekday && sessionDateIso(s, timezone) === dateIso,
  );
}

export function buildDaySectionOffers(params: {
  dateIso: string;
  weekday: number;
  sections: PublicClassSection[];
  sessions: ClassSessionPublic[];
  timezone: string;
}): DaySectionOffer[] {
  const { dateIso, weekday, sections, sessions, timezone } = params;
  const daySessions = sessionsOnDate(sessions, dateIso, weekday, timezone);

  if (sections.length > 0) {
    const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted.map((sec, index) => {
      const match = daySessions.find((s) => s.sectionId === sec.id);
      const capacity = match?.capacity ?? 0;
      const seatsRemaining = match?.seatsRemaining ?? 0;
      const seatsSold = Math.max(0, capacity - seatsRemaining);
      const available = Boolean(match && seatsRemaining > 0);
      return {
        sectionId: sec.id,
        label: sec.label?.trim() || `Section ${index + 1}`,
        startTime: sec.startTime,
        endTime: sec.endTime,
        sortOrder: sec.sortOrder,
        sessionId: match?.id ?? null,
        price: match != null ? match.price : null,
        capacity,
        seatsSold,
        seatsRemaining,
        available,
      };
    });
  }

  return daySessions
    .filter((s) => s.seatsRemaining > 0)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((s, index) => {
      const capacity = s.capacity;
      const seatsRemaining = s.seatsRemaining;
      return {
        sectionId: s.sectionId ?? s.id,
        label: s.sectionLabel?.trim() || `Class ${index + 1}`,
        startTime: s.sectionStartTime ?? "00:00",
        endTime: s.sectionEndTime ?? "00:00",
        sortOrder: index,
        sessionId: s.id,
        price: s.price,
        capacity,
        seatsSold: Math.max(0, capacity - seatsRemaining),
        seatsRemaining,
        available: true,
      };
    });
}

export function sumSelectedOfferPrices(
  offers: DaySectionOffer[],
  selectedSessionIds: Set<string>,
): number {
  let total = 0;
  for (const offer of offers) {
    if (
      offer.sessionId &&
      selectedSessionIds.has(offer.sessionId) &&
      offer.price != null
    ) {
      total += offer.price;
    }
  }
  return total;
}
