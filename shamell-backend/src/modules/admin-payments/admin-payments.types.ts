import type {
  AdminPaymentFlow,
  AdminPaymentStatus,
} from './dto/admin-payments-query.dto';

export type AdminStripePaymentRow = {
  id: string;
  flow: AdminPaymentFlow;
  status: AdminPaymentStatus;
  stage: 'FULL' | 'DEPOSIT' | 'BALANCE' | null;
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
  createdAt: string;
  paidAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
};
