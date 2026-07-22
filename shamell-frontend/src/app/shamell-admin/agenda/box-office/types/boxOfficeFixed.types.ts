export type BoxOfficePaymentMethod = "cash" | "stripe";

export type BoxOfficePurchaseKind = "venue_seating" | "fixed_ticket";

export type BoxOfficeFixedEvent = {
  id: string;
  name: string;
  slug: string | null;
  purchaseKind: BoxOfficePurchaseKind;
  price: number | null;
  currency: string;
  ticketsRemaining: number | null;
  fixedTicketCapacity: number | null;
  floorLayoutId: string | null;
  eventDateIso: string | null;
  eventLabel: string | null;
};

export type BoxOfficeSeatKind = "catalog_table" | "standalone_chair";

export type BoxOfficeTableSize = "LARGE" | "MEDIUM" | "SMALL";

export type BoxOfficeSeatOption = {
  layoutItemId: string;
  kind: BoxOfficeSeatKind;
  /** Present when kind is catalog_table */
  tableSize?: BoxOfficeTableSize;
  venueTableConfigId?: string;
  /**
   * Short seat id matching the 3D floor plan (e.g. "Large 1", "Chair 12").
   * Shown in the picker and sent to the guest.
   */
  seatLabel: string;
  /** Full English label for JSON / receipts (e.g. "Large table 1"). */
  fullLabel: string;
  detail: string;
  amount: number | null;
  reserved: boolean;
  pending: boolean;
};

export type BoxOfficeDetailsPayload = {
  source: "box_office";
  mode: "fixed";
  purchaseKind: BoxOfficePurchaseKind;
  upcomingEventId: string;
  paymentMethod: BoxOfficePaymentMethod;
  customer: {
    fullName: string;
    email: string;
    phone: string | null;
  };
  selection: Record<string, unknown>;
  submittedAt: string;
};
