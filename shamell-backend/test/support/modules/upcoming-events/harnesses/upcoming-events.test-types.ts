/** Narrow response shapes for upcoming-events e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type PublicEventBody = {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

export type CheckoutSessionCreatedBody = {
  clientSecret: string;
  checkoutSessionId?: string;
  enrollmentId?: string;
};

export type SessionStatusBody = {
  stripeStatus?: string;
  enrollment?: {
    id: string;
    status: string;
  };
  packageEnrollment?: {
    id: string;
    status: string;
  };
};

export type RegenerateSessionsBody = {
  upserted: number;
  deactivated: number;
};

export type BookableClassEventsBody = {
  events: Array<{ id: string; slug?: string; name?: string }>;
};

export type AdminCashEnrollmentBody = {
  enrollmentId: string;
  message: string;
};

export type AdminCheckoutPayLinkBody = {
  enrollmentId: string;
  message: string;
  payUrl: string;
};

export type ClassBookingContextBody = {
  event: {
    id: string;
    slug: string;
    name: string;
  };
  sessions: Array<{ id: string; seatsRemaining?: number }>;
  readiness?: {
    isBookable: boolean;
    reasons: string[];
  };
};

export type PayCheckoutClientSecretBody = {
  clientSecret: string;
};

export type ReconcileBody = {
  reconciled: boolean;
};

export type AdminFixedCashBody = {
  enrollmentId: string;
  ticketNumber: number | null;
  message: string;
};

export type AdminFixedCheckoutBody = {
  enrollmentId: string;
  message: string;
  payUrl: string;
};

export type BoxOfficeFixedEventsBody = {
  events: Array<{
    id: string;
    name: string;
    slug: string | null;
    purchaseKind: 'venue_seating' | 'fixed_ticket';
    price: number | null;
    currency: string;
    ticketsRemaining: number | null;
    fixedTicketCapacity: number | null;
    floorLayoutId: string | null;
    eventDateIso: string | null;
    eventLabel: string | null;
  }>;
};

export type PublicVenueBundleBody = {
  event: {
    slug: string;
    eventTypeName?: string;
  };
  config: {
    reservationEventLabel: string | null;
    reservationTimezone: string;
    floorLayoutId: string | null;
    reservationEventDate: string | null;
  };
};

export type PublicClassOptionsBody = {
  eventSlug: string;
  timezone: string;
  days: Array<{
    weekday: number;
    label: string;
    sessions: Array<{ id: string; weekday: number | null }>;
  }>;
};

/** Response shape from StripeWebhookDispatchService (upcoming deep e2e). */
export type WebhookDispatchBody = {
  received: true;
  handler?: string;
  deduplicated?: boolean;
};
