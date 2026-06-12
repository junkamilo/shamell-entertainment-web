-- Align stored seat reservation event nights with upcoming venue config when admin has set reservationEventDate.
UPDATE "venue_seat_reservations" AS vsr
SET "eventDate" = uvc."reservationEventDate"
FROM "upcoming_venue_configs" AS uvc
WHERE vsr."upcomingEventId" = uvc."eventId"
  AND uvc."reservationEventDate" IS NOT NULL
  AND vsr."eventDate" IS DISTINCT FROM uvc."reservationEventDate"
  AND vsr."status" IN ('PAID', 'PENDING_PAYMENT');
