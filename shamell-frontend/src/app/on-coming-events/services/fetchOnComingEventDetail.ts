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
  sessions: ClassSessionPublic[];
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
  return data as OnComingEventDetail;
}
