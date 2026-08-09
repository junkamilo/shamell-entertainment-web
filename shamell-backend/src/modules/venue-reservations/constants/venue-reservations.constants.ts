export const VENUE_RESERVATION_PAYMENT_CHANNELS = ['STRIPE', 'CASH'] as const;

export type VenueReservationPaymentChannel =
  (typeof VENUE_RESERVATION_PAYMENT_CHANNELS)[number];

/** Stripe Checkout Session TTL for venue seat holds. */
export const CHECKOUT_TTL_MINUTES = 30;

/** Stripe Checkout `metadata.flow` for venue seat reservations. */
export const VENUE_SEAT_CHECKOUT_FLOW = 'venue_seat';

/** Nest Throttler / module label. */
export const VENUE_RESERVATIONS_THROTTLE_NAME = 'venue-reservations';
