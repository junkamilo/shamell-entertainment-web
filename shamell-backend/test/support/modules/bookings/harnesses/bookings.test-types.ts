/** Narrow response shapes for bookings e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type OccupiedBody = {
  date: string;
  occupied: Array<{ startMinutes: number; endMinutes: number }>;
};

export type AdminBookingBody = {
  id: string;
  status: string;
  serviceId: string;
  location: string;
  catalogMismatch?: boolean;
};

export type AdminBookingListBody = {
  items: AdminBookingBody[];
  meta: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
};

export type AdminCalendarBody = {
  items: Array<{ id: string; eventDate: string; status: string }>;
};

export type RemoveAdminBody = {
  ok: boolean;
};

export type QuoteCreatedBody = {
  message: string;
  quoteId: string;
  paymentId: string;
  checkoutSessionId: string;
  quoteExpiresAt: string;
};

export type BalanceLinkBody = {
  message: string;
  paymentId: string;
  payUrl: string;
};

export type QuoteCheckoutBody = {
  clientSecret: string;
};

export type QuoteSessionStatusBody = {
  stripeStatus: string;
  paymentStatus: string;
  stage: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
};

export type PrivateClassCashBody = {
  id: string;
  status?: string;
};

export type PrivateClassCheckoutBody = {
  bookingId: string;
  payUrl: string;
  message?: string;
};

export type DeprecatedWebhookBody = {
  deprecated: true;
  message: string;
};
