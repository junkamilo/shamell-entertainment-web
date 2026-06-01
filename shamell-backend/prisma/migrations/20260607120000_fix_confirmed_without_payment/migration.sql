-- Admin bookings were created as CONFIRMED before Stripe payment; revert to PENDING.
UPDATE "bookings"
SET "status" = 'PENDING'
WHERE "status" = 'CONFIRMED'
  AND "depositPaidAt" IS NULL
  AND "balancePaidAt" IS NULL;
