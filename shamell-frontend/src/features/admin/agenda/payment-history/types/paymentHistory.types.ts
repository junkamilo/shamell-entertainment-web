export type AdminPaymentFlow =
  | "BOOKING_QUOTE"
  | "VENUE_SEAT"
  | "CLASS_SESSION"
  | "FIXED_TICKET";

export type AdminPaymentStatus =
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "CANCELLED";

export type AdminStripePaymentRow = {
  id: string;
  flow: AdminPaymentFlow;
  status: AdminPaymentStatus;
  stage: "FULL" | "DEPOSIT" | "BALANCE" | null;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  contextLabel: string;
  bookingId: string | null;
  eventSlug: string | null;
  eventId: string | null;
  reservationId: string | null;
  stripeCheckoutSessionId: string;
  paymentMethodLabel: string | null;
  createdAt: string;
  paidAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
};

export type AdminPaymentsQuery = {
  page?: number;
  limit?: number;
  flow?: AdminPaymentFlow | "";
  status?: AdminPaymentStatus | "";
  q?: string;
  from?: string;
  to?: string;
};

export type AdminPaymentsListResponse = {
  items: AdminStripePaymentRow[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
};

export type BookingPurchaseDetails = {
  flow: "BOOKING_QUOTE";
  eventType: string | null;
  occasion: string | null;
  services: string | null;
  eventDate: string | null;
  location: string | null;
  guestCount: number | null;
  quoteTotalAmount: number | null;
  quoteDepositAmount: number | null;
  quoteModel: string | null;
};

export type VenuePurchaseDetails = {
  flow: "VENUE_SEAT";
  eventName: string | null;
  eventDate: string | null;
  seatKind: "TABLE" | "CHAIR";
  tableName: string | null;
  layoutItemId: string;
};

export type ClassPurchaseDetails = {
  flow: "CLASS_SESSION";
  eventName: string;
  sessionStartsAt: string;
  sessionEndsAt: string;
  sessionTimezone: string;
};

export type FixedPurchaseDetails = {
  flow: "FIXED_TICKET";
  eventName: string;
  eventDate: string | null;
  ticketNumber: number | null;
};

export type AdminPaymentPurchaseDetails =
  | BookingPurchaseDetails
  | VenuePurchaseDetails
  | ClassPurchaseDetails
  | FixedPurchaseDetails;

export type AdminStripePaymentDetail = AdminStripePaymentRow & {
  customerPhone: string | null;
  purchaseDetails: AdminPaymentPurchaseDetails;
};
