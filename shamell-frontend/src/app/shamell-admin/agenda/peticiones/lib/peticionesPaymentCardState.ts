import type { AdminBookingRow } from "@/hooks/use-admin-bookings";

export type PaymentCardVisual =
  | "paid_full"
  | "deposit_partial"
  | "cancelled"
  | "payment_in_progress"
  | "awaiting_payment";

export function resolveBookingPaymentCardState(
  booking: Pick<
    AdminBookingRow,
    | "status"
    | "depositPaidAt"
    | "balancePaidAt"
    | "quoteSentAt"
    | "quoteModel"
  >,
): PaymentCardVisual {
  if (booking.status === "CANCELLED") return "cancelled";

  if (booking.depositPaidAt && !booking.balancePaidAt) {
    return "deposit_partial";
  }

  const fullyPaid =
    Boolean(booking.balancePaidAt) ||
    (booking.status === "CONFIRMED" && booking.quoteModel === "FULL");
  if (fullyPaid) return "paid_full";

  if (
    booking.quoteSentAt &&
    booking.status === "PENDING" &&
    !booking.depositPaidAt
  ) {
    return "payment_in_progress";
  }

  return "awaiting_payment";
}

export function paymentCardBorderClass(visual: PaymentCardVisual): string {
  switch (visual) {
    case "paid_full":
      return "border-emerald-400/30 ring-1 ring-emerald-400/15";
    case "deposit_partial":
      return "border-orange-400/35 ring-1 ring-orange-400/15";
    case "cancelled":
      return "border-red-400/25 ring-1 ring-red-400/10 opacity-85";
    case "payment_in_progress":
      return "border-cyan-400/35 ring-1 ring-cyan-400/15";
    case "awaiting_payment":
      return "border-gold/40 ring-1 ring-gold/15";
  }
}

export function canSendInitialPaymentLink(
  booking: Pick<
    AdminBookingRow,
    | "status"
    | "depositPaidAt"
    | "balancePaidAt"
    | "quoteSentAt"
    | "quoteModel"
  >,
): boolean {
  const visual = resolveBookingPaymentCardState(booking);
  return visual !== "paid_full" && visual !== "cancelled";
}

export function paymentCardBadge(visual: PaymentCardVisual): {
  label: string;
  className: string;
} {
  switch (visual) {
    case "paid_full":
      return {
        label: "PAID",
        className:
          "rounded border border-emerald-400/45 px-2 py-0.5 font-brand text-[10px] tracking-widest text-emerald-200 sm:text-xs",
      };
    case "deposit_partial":
      return {
        label: "DEPOSIT PAID",
        className:
          "rounded border border-orange-400/45 px-2 py-0.5 font-brand text-[10px] tracking-widest text-orange-200 sm:text-xs",
      };
    case "cancelled":
      return {
        label: "CANCELED",
        className:
          "rounded border border-red-400/45 px-2 py-0.5 font-brand text-[10px] tracking-widest text-red-200 sm:text-xs",
      };
    case "payment_in_progress":
      return {
        label: "PAYMENT IN PROGRESS",
        className:
          "rounded border border-cyan-400/45 px-2 py-0.5 font-brand text-[10px] tracking-widest text-cyan-200 sm:text-xs",
      };
    case "awaiting_payment":
      return {
        label: "AWAITING PAYMENT",
        className:
          "rounded border border-gold/40 px-2 py-0.5 font-brand text-[10px] tracking-widest text-gold sm:text-xs",
      };
  }
}
