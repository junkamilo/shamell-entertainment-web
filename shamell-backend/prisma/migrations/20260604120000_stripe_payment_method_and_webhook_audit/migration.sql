-- AlterTable stripe_webhook_events
ALTER TABLE "stripe_webhook_events" ADD COLUMN "metadataFlow" TEXT;
ALTER TABLE "stripe_webhook_events" ADD COLUMN "checkoutSessionId" TEXT;
ALTER TABLE "stripe_webhook_events" ADD COLUMN "handler" TEXT;
ALTER TABLE "stripe_webhook_events" ADD COLUMN "payloadSummary" JSONB;

CREATE INDEX "stripe_webhook_events_checkoutSessionId_idx" ON "stripe_webhook_events"("checkoutSessionId");

-- AlterTable upcoming_fixed_event_enrollments
ALTER TABLE "upcoming_fixed_event_enrollments" ADD COLUMN "paymentMethodType" TEXT;
ALTER TABLE "upcoming_fixed_event_enrollments" ADD COLUMN "paymentMethodBrand" TEXT;
ALTER TABLE "upcoming_fixed_event_enrollments" ADD COLUMN "paymentMethodLast4" TEXT;
ALTER TABLE "upcoming_fixed_event_enrollments" ADD COLUMN "customerEmailSentAt" TIMESTAMP(3);
ALTER TABLE "upcoming_fixed_event_enrollments" ADD COLUMN "adminNotifySentAt" TIMESTAMP(3);

-- AlterTable upcoming_class_enrollments
ALTER TABLE "upcoming_class_enrollments" ADD COLUMN "paymentMethodType" TEXT;
ALTER TABLE "upcoming_class_enrollments" ADD COLUMN "paymentMethodBrand" TEXT;
ALTER TABLE "upcoming_class_enrollments" ADD COLUMN "paymentMethodLast4" TEXT;

-- AlterTable venue_seat_reservations
ALTER TABLE "venue_seat_reservations" ADD COLUMN "paymentMethodType" TEXT;
ALTER TABLE "venue_seat_reservations" ADD COLUMN "paymentMethodBrand" TEXT;
ALTER TABLE "venue_seat_reservations" ADD COLUMN "paymentMethodLast4" TEXT;
