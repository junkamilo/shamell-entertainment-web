ALTER TABLE "venue_seat_reservations" ADD COLUMN "customerEmailSentAt" TIMESTAMP(3);

ALTER TABLE "upcoming_class_enrollments" ADD COLUMN "customerEmailSentAt" TIMESTAMP(3);

ALTER TABLE "upcoming_class_package_enrollments" ADD COLUMN "customerEmailSentAt" TIMESTAMP(3);
