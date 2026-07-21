import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

export async function fetchAgendarBookingForEdit(
  token: string,
  bookingId: string,
): Promise<AdminBookingRow> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/bookings/admin/${encodeURIComponent(bookingId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not load booking."));
  }
  return data as AdminBookingRow;
}
