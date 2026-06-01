import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";
import type { ClassSessionPublic } from "./fetchUpcomingClassSessions";

export type OnComingEventSchedule =
  | {
      mode: "FIXED_EVENT";
      timezone: string;
      summary: string;
      salesWindow: { start: string; end: string } | null;
      eventDate: string | null;
      startTime: string | null;
      endTime: string | null;
    }
  | {
      mode: "RECURRING_WEEKLY";
      timezone: string;
      summary: string;
      effectiveFrom: string | null;
      weekdayLabels: string[];
      startTime: string | null;
      endTime: string | null;
    };

export type UpcomingPurchaseMode = "none" | "classes" | "venue_seating" | "fixed_ticket";

export type OnComingEventDetail = {
  id: string;
  slug: string | null;
  eventTypeName: string;
  description: string;
  items: string[];
  price: number | null;
  experienceType: "CLASSES" | "VENUE_SEATING" | null;
  classVariant: string | null;
  heroImageUrl: string | null;
  heroMediaType: "IMAGE" | "VIDEO" | null;
  schedule: OnComingEventSchedule | null;
  hasActiveSessions: boolean;
  salesOpen: boolean;
  purchasable: boolean;
  purchaseMode: UpcomingPurchaseMode;
  sessions: ClassSessionPublic[];
  ticketsRemaining?: number;
  fixedTicketCapacity?: number;
  ticketsSold?: number;
  eventStartsAt?: string;
  tableCapacity?: number;
  tablesRemaining?: number;
  tablesSold?: number;
};

export async function fetchOnComingEventDetail(slug: string): Promise<OnComingEventDetail> {
  const base = getPublicApiBaseUrl();
  const response = await fetch(`${base}/api/v1/upcoming-events/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Event not found.");
  }
  const data: unknown = await response.json();
  if (!data || typeof data !== "object") {
    throw new Error("Invalid event response.");
  }
  const row = data as OnComingEventDetail & { purchaseMode?: UpcomingPurchaseMode };
  if (!row.purchaseMode) {
    row.purchaseMode =
      row.experienceType === "VENUE_SEATING"
        ? "venue_seating"
        : row.experienceType === "CLASSES"
          ? "classes"
          : "none";
  }
  return row;
}
