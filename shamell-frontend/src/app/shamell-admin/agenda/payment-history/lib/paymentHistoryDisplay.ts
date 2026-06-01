import {
  AGENDAR_PATH,
  AGENDA_PAYMENT_HISTORY_PATH,
} from "../../agendar/lib/agendarRoutes";
import type {
  AdminPaymentFlow,
  AdminPaymentStatus,
  AdminStripePaymentRow,
} from "../types/paymentHistory.types";

export function flowLabel(flow: AdminPaymentFlow): string {
  switch (flow) {
    case "BOOKING_QUOTE":
      return "Book";
    case "VENUE_SEAT":
      return "Venue";
    case "CLASS_SESSION":
      return "Class";
    case "FIXED_TICKET":
      return "Ticket";
  }
}

export function stageLabel(stage: AdminStripePaymentRow["stage"]): string {
  if (!stage) return "—";
  if (stage === "FULL") return "Full";
  if (stage === "DEPOSIT") return "Deposit";
  return "Balance";
}

export function statusLabel(status: AdminPaymentStatus): string {
  switch (status) {
    case "PAID":
      return "Paid";
    case "PENDING":
      return "Pending";
    case "EXPIRED":
      return "Expired";
    case "CANCELLED":
      return "Cancelled";
  }
}

export function paymentRowActionHref(row: AdminStripePaymentRow): string | null {
  if (row.flow === "BOOKING_QUOTE" && row.bookingId) {
    const params = new URLSearchParams({
      bookingId: row.bookingId,
      origin: "booking",
      returnTo: AGENDA_PAYMENT_HISTORY_PATH,
    });
    return `${AGENDAR_PATH}?${params.toString()}`;
  }
  if (row.flow === "VENUE_SEAT") {
    return "/shamell-admin/venue-reservations";
  }
  if (
    (row.flow === "CLASS_SESSION" || row.flow === "FIXED_TICKET") &&
    row.eventId
  ) {
    return "/shamell-admin/events";
  }
  return null;
}

export function formatPaymentAmount(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  if (code === "USD") return `$${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${code}`;
}

export function formatPaymentDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}
