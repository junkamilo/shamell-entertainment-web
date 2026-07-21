import type {
  BookClassBookingKind,
  BookClassPaymentMethod,
} from "../types/bookClass.types";

export type BookClassFormSnapshot = {
  eventId: string;
  bookingKind: BookClassBookingKind;
  weekday: number | null;
  selectedDateIso: string | null;
  selectedSessionIds: Set<string>;
  monthIso: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: BookClassPaymentMethod;
  cashConfirmed: boolean;
};

export function validateBookClassForm(
  form: BookClassFormSnapshot,
  hasMonthPackage: boolean,
): string | null {
  if (!form.eventId.trim()) return "Select a class event.";
  if (!form.customerName.trim() || !form.customerEmail.trim()) {
    return "Name and email are required.";
  }
  if (form.paymentMethod === "cash" && !form.cashConfirmed) {
    return "Confirm that cash payment was received.";
  }

  if (form.bookingKind === "month") {
    if (!hasMonthPackage || !form.monthIso) {
      return "Month package is not available for this event.";
    }
    return null;
  }

  if (form.weekday == null || !form.selectedDateIso) {
    return "Select a class day.";
  }
  if (form.selectedSessionIds.size === 0) {
    return "Select at least one class section.";
  }
  return null;
}

export function resolvePurchaseKind(
  form: BookClassFormSnapshot,
): "session" | "day_bundle" | "month_package" {
  if (form.bookingKind === "month") return "month_package";
  if (form.selectedSessionIds.size === 1) return "session";
  return "day_bundle";
}
