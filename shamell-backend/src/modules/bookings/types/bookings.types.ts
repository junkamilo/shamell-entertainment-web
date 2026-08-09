import type { Prisma } from '@prisma/client';
import { PRIVATE_CLASS_DETAILS_KIND } from '../constants/bookings.constants';
import type {
  BookingCalendarRow,
  BookingWithRelations,
} from '../constants/booking-includes';

export type { BookingWithRelations, BookingCalendarRow };

export type CreateFromPublicBookingInquiryOptions = {
  tx?: Prisma.TransactionClient;
  /** When true, caller sends confirmation after the surrounding transaction commits. */
  skipConfirmationEmail?: boolean;
};

/** Pre-validated payload for a single `booking.create` inside a short transaction. */
export type PublicBookingInquiryPrepared = {
  serviceId: string;
  eventTypeId: string | null;
  occasionTypeId: string | null;
  eventId: string | null;
  eventDate: Date;
  location: string;
  guestCount: number | null;
  notes: string | null;
  bookingDetails: Prisma.InputJsonValue;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
};

export type StripeCheckoutSessionLite = {
  id?: string;
  metadata?: Record<string, string | undefined>;
  payment_status?: string | null;
  amount_total?: number | null;
  amount_subtotal?: number | null;
  currency?: string | null;
  payment_intent?: string | { id?: string } | null;
};

export type PrivateClassBookingDetails = {
  kind: typeof PRIVATE_CLASS_DETAILS_KIND;
  classType: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  location: string;
  paymentMethod: 'stripe' | 'cash';
  amountUsd: number;
  currency: 'usd';
  submittedAt: string;
  source: 'admin_book_class_private';
};
