import { hhmmToMinutes } from "@/lib/contactLogisticsUtils";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { bookingServiceChip } from "@/lib/adminBookingDisplay";
import { isoFromTzDate, hhmmFromEventDate } from "./miAgendaDateUtils";
import type { EnrichedBooking } from "../types/miAgenda.types";

export function displayName(row: AdminBookingRow): string {
  return row.user?.fullName?.trim() || row.guestFullName?.trim() || "Unnamed guest";
}

export function readBookingTime(row: AdminBookingRow, timeZone: string): { start: string; end: string } {
  const details = row.bookingDetails && typeof row.bookingDetails === "object" ? row.bookingDetails : null;
  const startFromDetails =
    details && typeof details.eventTimeStart === "string" && /^\d{2}:\d{2}$/.test(details.eventTimeStart.trim())
      ? details.eventTimeStart.trim()
      : "";
  const endFromDetails =
    details && typeof details.eventTimeEnd === "string" && /^\d{2}:\d{2}$/.test(details.eventTimeEnd.trim())
      ? details.eventTimeEnd.trim()
      : "";
  const start = startFromDetails || hhmmFromEventDate(row.eventDate, timeZone);
  const end = endFromDetails || start;
  return { start, end };
}

export function eventTypeLabel(row: AdminBookingRow): string {
  return row.event?.name || row.eventType?.name || row.occasionType?.name || "—";
}

export function eventChipLabel(row: AdminBookingRow): string {
  return bookingServiceChip(row);
}

export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function enrichBookings(bookings: AdminBookingRow[], tz: string): EnrichedBooking[] {
  return bookings
    .map((row) => {
      const dateIso = isoFromTzDate(new Date(row.eventDate), tz);
      const { start, end } = readBookingTime(row, tz);
      const startM = hhmmToMinutes(start) ?? 0;
      const endM = hhmmToMinutes(end) ?? startM;
      const durationM = Math.max(endM - startM, 0);
      return { ...row, dateIso, start, end, startM, durationM };
    })
    .sort((a, b) =>
      a.dateIso === b.dateIso ? a.startM - b.startM : a.dateIso.localeCompare(b.dateIso),
    );
}
