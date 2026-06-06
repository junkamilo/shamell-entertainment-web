-- Allow re-booking seats after EXPIRED/CANCELLED: unique only for active holds.
DROP INDEX IF EXISTS "venue_seat_reservations_layoutItemId_upcomingEventId_key";

CREATE UNIQUE INDEX "venue_seat_reservations_layoutItemId_upcomingEventId_active_key"
ON "venue_seat_reservations"("layoutItemId", "upcomingEventId")
WHERE "status" IN ('PAID', 'PENDING_PAYMENT');
