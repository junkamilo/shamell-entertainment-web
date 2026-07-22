-- Box Office FIXED EVENT: store form JSON + enable admin cash for fixed tickets.
-- ADD / ALTER only — no DELETE of seats, enrollments, or events.

-- Venue seats: optional Box Office form snapshot
ALTER TABLE "venue_seat_reservations"
  ADD COLUMN IF NOT EXISTS "boxOfficeDetails" JSONB;

-- Fixed tickets: admin cash + Box Office JSON (keep existing Stripe rows intact)
ALTER TABLE "upcoming_fixed_event_enrollments"
  ADD COLUMN IF NOT EXISTS "boxOfficeDetails" JSONB;

ALTER TABLE "upcoming_fixed_event_enrollments"
  ADD COLUMN IF NOT EXISTS "paymentChannel" "VenueReservationPaymentChannel" NOT NULL DEFAULT 'STRIPE';

ALTER TABLE "upcoming_fixed_event_enrollments"
  ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT;

-- Allow cash rows without a Stripe session (multiple NULLs OK under UNIQUE)
ALTER TABLE "upcoming_fixed_event_enrollments"
  ALTER COLUMN "stripeCheckoutSessionId" DROP NOT NULL;
