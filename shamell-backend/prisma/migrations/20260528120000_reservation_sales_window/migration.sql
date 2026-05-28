-- Sales window: when table/chair reservations open and close.
ALTER TABLE "venue_layout_client_settings"
ADD COLUMN "reservationOpensAt" TIMESTAMP(3),
ADD COLUMN "reservationClosesAt" TIMESTAMP(3);

-- Legacy single event datetime becomes the sales open time.
UPDATE "venue_layout_client_settings"
SET "reservationOpensAt" = "reservationEventDate"
WHERE "reservationEventDate" IS NOT NULL
  AND "reservationOpensAt" IS NULL;
