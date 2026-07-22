import type {
  BoxOfficeDetailsPayload,
  BoxOfficePaymentMethod,
  BoxOfficePurchaseKind,
  BoxOfficeSeatOption,
} from "../types/boxOfficeFixed.types";

export function buildBoxOfficeDetails(args: {
  purchaseKind: BoxOfficePurchaseKind;
  upcomingEventId: string;
  paymentMethod: BoxOfficePaymentMethod;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  seat: BoxOfficeSeatOption | null;
  ticketAmount: number | null;
  ticketCurrency: string;
}): BoxOfficeDetailsPayload {
  const customer = {
    fullName: args.customerName.trim(),
    email: args.customerEmail.trim().toLowerCase(),
    phone: args.customerPhone.trim() || null,
  };

  let selection: Record<string, unknown>;
  if (args.purchaseKind === "venue_seating" && args.seat) {
    selection = {
      kind: args.seat.kind,
      layoutItemId: args.seat.layoutItemId,
      venueTableConfigId: args.seat.venueTableConfigId ?? null,
      tableSize: args.seat.tableSize ?? null,
      /** e.g. "Large 1" — matches floor-plan bubbles */
      seatLabel: args.seat.seatLabel,
      /** e.g. "Large table 1" — receipt / JSON full name */
      fullLabel: args.seat.fullLabel,
      detail: args.seat.detail,
      amount: args.seat.amount,
      currency: "usd",
    };
  } else {
    selection = {
      quantity: 1,
      amount: args.ticketAmount,
      currency: args.ticketCurrency,
    };
  }

  return {
    source: "box_office",
    mode: "fixed",
    purchaseKind: args.purchaseKind,
    upcomingEventId: args.upcomingEventId,
    paymentMethod: args.paymentMethod,
    customer,
    selection,
    submittedAt: new Date().toISOString(),
  };
}
