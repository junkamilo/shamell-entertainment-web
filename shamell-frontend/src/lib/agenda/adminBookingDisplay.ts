import type { AdminBookingRow } from "@/hooks/use-admin-bookings";

/** Human-readable service line(s) from enriched booking details or FK fallback. */
export function bookingServiceDisplayLine(
  row: Pick<AdminBookingRow, "bookingDetails" | "service"> | null | undefined,
): string {
  if (!row) return "";
  const raw = row.bookingDetails;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const labels = (raw as { serviceLabels?: unknown }).serviceLabels;
    if (Array.isArray(labels)) {
      const parts = labels.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
      if (parts.length > 0) return parts.join(" · ");
    }
  }
  return row.service?.serviceType?.name?.trim() ?? "";
}

/** Short chip for calendar cells when multiple services are booked. */
export function bookingServiceChip(row: Pick<AdminBookingRow, "bookingDetails" | "service">): string {
  const raw = row.bookingDetails;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const labels = (raw as { serviceLabels?: unknown }).serviceLabels;
    if (Array.isArray(labels)) {
      const parts = labels.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
      if (parts.length > 1) {
        const first = parts[0].slice(0, 14).toUpperCase();
        return `${first} +${parts.length - 1}`;
      }
      if (parts.length === 1) return parts[0].toUpperCase().slice(0, 22);
    }
  }
  return row.service?.serviceType?.name?.toUpperCase().slice(0, 22) ?? "BOOKING";
}
