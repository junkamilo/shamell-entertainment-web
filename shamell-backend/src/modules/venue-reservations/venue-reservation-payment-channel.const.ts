export const VENUE_RESERVATION_PAYMENT_CHANNELS = ['STRIPE', 'CASH'] as const;

export type VenueReservationPaymentChannel =
  (typeof VENUE_RESERVATION_PAYMENT_CHANNELS)[number];
