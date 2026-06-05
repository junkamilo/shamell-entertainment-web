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
