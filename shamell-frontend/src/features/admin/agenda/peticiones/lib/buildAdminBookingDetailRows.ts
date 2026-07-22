import { type InquiryDetailRow } from "@/features/admin/inquiries";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { bookingServiceDisplayLine } from "@/lib/adminBookingDisplay";

function stringArrayField(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim());
}

function detailsRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

/** Unified Book / admin booking rows for inbox (EVENT TYPE, OCCASION, SERVICES, guests, time). */
export function buildAdminBookingDetailRows(
  booking: AdminBookingRow,
  structuredDetails: unknown,
  bookingTz: string,
): InquiryDetailRow[] {
  const d = detailsRecord(structuredDetails);
  const rows: InquiryDetailRow[] = [];

  const push = (label: string, value: string | null | undefined) => {
    const v = value?.trim();
    if (v) rows.push({ label, value: v });
  };

  const eventType =
    (typeof d?.eventTypeLabel === "string" ? d.eventTypeLabel : "") ||
    booking.eventType?.name ||
    "";
  const occasion =
    (typeof d?.occasionSingleLabel === "string" ? d.occasionSingleLabel : "") ||
    booking.occasionType?.name ||
    "";

  const serviceLabels = stringArrayField(d?.serviceLabels);
  const services =
    serviceLabels.length > 0
      ? serviceLabels.join(" · ")
      : bookingServiceDisplayLine(booking);

  push("EVENT TYPE", eventType);
  push("OCCASION", occasion);
  push("SERVICES", services);

  let guestCount: number | null = null;
  if (typeof d?.guestCount === "number" && Number.isFinite(d.guestCount) && d.guestCount > 0) {
    guestCount = Math.round(d.guestCount);
  } else if (booking.guestCount != null && booking.guestCount > 0) {
    guestCount = Math.round(booking.guestCount);
  }
  if (guestCount != null) {
    push("NUMBER OF GUESTS", String(guestCount));
  }

  const start =
    typeof d?.eventTimeStart === "string" && /^\d{2}:\d{2}$/.test(d.eventTimeStart.trim())
      ? d.eventTimeStart.trim()
      : "";
  const end =
    typeof d?.eventTimeEnd === "string" && /^\d{2}:\d{2}$/.test(d.eventTimeEnd.trim())
      ? d.eventTimeEnd.trim()
      : "";
  if (start || end) {
    push("REQUESTED TIME", `${start || "—"} – ${end || "—"}`);
  } else if (booking.eventDate) {
    const wall = new Intl.DateTimeFormat("en-US", {
      timeZone: bookingTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(booking.eventDate));
    const hour = wall.find((p) => p.type === "hour")?.value ?? "00";
    const minute = wall.find((p) => p.type === "minute")?.value ?? "00";
    push("REQUESTED TIME", `${hour}:${minute}`);
  }

  return rows;
}
