export type AdminStripeWebhookEventRow = {
  id: string;
  eventId: string;
  eventType: string;
  livemode: boolean;
  status: string;
  metadataFlow: string | null;
  checkoutSessionId: string | null;
  handler: string | null;
  payloadSummary: Record<string, unknown> | null;
  processedAt: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminStripeWebhookRelatedPayment = {
  kind:
    | 'booking_payment'
    | 'class_enrollment'
    | 'class_package_enrollment'
    | 'fixed_event_enrollment'
    | 'venue_seat_reservation';
  id: string;
  status: string;
  customerEmail: string | null;
  amount: string | null;
  currency: string | null;
  paidAt: string | null;
};

export type AdminStripeWebhookEventDetail = AdminStripeWebhookEventRow & {
  relatedPayments: AdminStripeWebhookRelatedPayment[];
};
