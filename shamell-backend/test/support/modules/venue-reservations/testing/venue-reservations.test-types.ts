/** Narrow response shapes for venue-reservations e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type AvailabilityBody = {
  upcomingEventId: string | null;
  upcomingEventSlug?: string | null;
  eventDate: string | null;
  reservationsOpen: boolean;
  salesClosedReason?: string | null;
  reservedLayoutItemIds: string[];
  reservedVenueTableConfigIds?: string[];
};

export type CheckoutSessionCreatedBody = {
  clientSecret: string;
  reservationId: string;
};

export type SessionStatusBody = {
  stripeStatus: string;
  reservation: {
    id: string;
    status: string;
  };
};

export type AdminListBody = {
  items: Array<{ id: string; status: string }>;
  meta?: {
    page: number;
    perPage: number;
    total: number;
  };
};

export type CancelReservationBody = {
  message: string;
  reservation: {
    id: string;
    status: string;
  };
};

export type AdminCheckoutPayLinkBody = {
  reservationId: string;
  message: string;
  payUrl: string;
};

export type AdminCashReservationBody = {
  message: string;
  reservation: {
    id: string;
    status: string;
  };
};

export type WebhookHandledBody = {
  received: true;
  handled?: boolean;
};

/** Response shape from StripeWebhookDispatchService.handle / processVerifiedEvent. */
export type WebhookDispatchBody = {
  received: true;
  handler?: string;
  deduplicated?: boolean;
};

export type PayCheckoutClientSecretBody = {
  clientSecret: string;
};

export type ResendConfirmationBody = {
  sent?: number;
  message?: string;
  ok?: boolean;
};
