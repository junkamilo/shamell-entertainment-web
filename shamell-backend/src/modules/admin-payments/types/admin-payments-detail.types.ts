import type { AdminStripePaymentRow } from './admin-payments.types';

export type BookingPurchaseDetails = {
  flow: 'BOOKING_QUOTE';
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
  flow: 'VENUE_SEAT';
  eventName: string | null;
  eventDate: string | null;
  seatKind: 'TABLE' | 'CHAIR';
  tableName: string | null;
  layoutItemId: string;
};

export type ClassPurchaseDetails = {
  flow: 'CLASS_SESSION';
  eventName: string;
  sessionStartsAt: string;
  sessionEndsAt: string;
  sessionTimezone: string;
};

export type FixedPurchaseDetails = {
  flow: 'FIXED_TICKET';
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

export const ADMIN_PAYMENT_DETAIL_FLOWS = [
  'BOOKING_QUOTE',
  'VENUE_SEAT',
  'CLASS_SESSION',
  'FIXED_TICKET',
] as const;

export type AdminPaymentDetailFlow =
  (typeof ADMIN_PAYMENT_DETAIL_FLOWS)[number];
