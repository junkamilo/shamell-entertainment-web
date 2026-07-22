-- Box Office RECURRING WEEKDAYS (CLASSES): store form JSON + admin cash channel.
-- ADD / ALTER only — no DELETE of sessions, enrollments, or events.

ALTER TABLE "upcoming_class_enrollments"
  ADD COLUMN IF NOT EXISTS "boxOfficeDetails" JSONB;

ALTER TABLE "upcoming_class_enrollments"
  ADD COLUMN IF NOT EXISTS "paymentChannel" "VenueReservationPaymentChannel" NOT NULL DEFAULT 'STRIPE';

ALTER TABLE "upcoming_class_enrollments"
  ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT;

ALTER TABLE "upcoming_class_package_enrollments"
  ADD COLUMN IF NOT EXISTS "boxOfficeDetails" JSONB;

ALTER TABLE "upcoming_class_package_enrollments"
  ADD COLUMN IF NOT EXISTS "paymentChannel" "VenueReservationPaymentChannel" NOT NULL DEFAULT 'STRIPE';

ALTER TABLE "upcoming_class_package_enrollments"
  ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT;
