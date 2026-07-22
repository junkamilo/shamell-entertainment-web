-- Harden Bookings vs ON COMING: typed EventType.catalogChannel.
-- ADD / UPDATE only — no DELETE of events, types, bookings, or seat reservations.

-- 1) Enum + column (default BOOKING for existing rows)
CREATE TYPE "EventTypeCatalogChannel" AS ENUM ('BOOKING', 'UPCOMING_HUB');

ALTER TABLE "event_types"
  ADD COLUMN "catalogChannel" "EventTypeCatalogChannel" NOT NULL DEFAULT 'BOOKING';

-- 2) Backfill hub types (linked to ON COMING / hub-marker events)
UPDATE "event_types" AS et
SET "catalogChannel" = 'UPCOMING_HUB'
WHERE EXISTS (
  SELECT 1
  FROM "events" e
  LEFT JOIN "upcoming_venue_configs" uvc ON uvc."eventId" = e."id"
  WHERE e."eventTypeId" = et."id"
    AND (
      e."publicSection" = 'UPCOMING_EVENTS'
      OR e."slug" IS NOT NULL
      OR e."experienceType" IS NOT NULL
      OR uvc."eventId" IS NOT NULL
      OR EXISTS (
        SELECT 1
        FROM "upcoming_class_sessions" ucs
        WHERE ucs."eventId" = e."id"
      )
    )
);

-- 3) Replace global name unique with (name, catalogChannel)
DROP INDEX IF EXISTS "event_types_name_key";

CREATE UNIQUE INDEX "event_types_name_catalogChannel_key"
  ON "event_types"("name", "catalogChannel");
