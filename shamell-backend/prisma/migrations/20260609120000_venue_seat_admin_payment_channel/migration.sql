-- Admin cash reservations and Stripe pay-by-email links
CREATE TYPE "VenueReservationPaymentChannel" AS ENUM ('STRIPE', 'CASH');

ALTER TABLE "venue_seat_reservations"
  ADD COLUMN "paymentChannel" "VenueReservationPaymentChannel" NOT NULL DEFAULT 'STRIPE',
  ADD COLUMN "payTokenHash" TEXT,
  ADD COLUMN "createdByAdminId" TEXT;

ALTER TABLE "venue_seat_reservations"
  ALTER COLUMN "stripeCheckoutSessionId" DROP NOT NULL;
