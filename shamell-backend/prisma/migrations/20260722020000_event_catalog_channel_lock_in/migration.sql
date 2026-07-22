-- Typed catalog lock-in: align Event.publicSection ↔ EventType.catalogChannel
-- and enforce with a BEFORE INSERT/UPDATE trigger.
-- ADD / UPDATE only — no DELETE of events, types, bookings, seats, or enrollments.

-- ---------------------------------------------------------------------------
-- 1) Fail loudly if alignment would violate unique (name, catalogChannel)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "event_types" et
    INNER JOIN "events" e ON e."eventTypeId" = et."id"
    WHERE e."publicSection" = 'UPCOMING_EVENTS'
      AND et."catalogChannel" = 'BOOKING'
      AND EXISTS (
        SELECT 1
        FROM "event_types" other
        WHERE other."name" = et."name"
          AND other."catalogChannel" = 'UPCOMING_HUB'
          AND other."id" <> et."id"
      )
  ) THEN
    RAISE EXCEPTION
      'catalog channel align conflict: cannot set UPCOMING_HUB (name already taken in that channel). Manual review required — no rows deleted.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "event_types" et
    INNER JOIN "events" e ON e."eventTypeId" = et."id"
    WHERE e."publicSection" = 'GENERAL'
      AND et."catalogChannel" = 'UPCOMING_HUB'
      AND EXISTS (
        SELECT 1
        FROM "event_types" other
        WHERE other."name" = et."name"
          AND other."catalogChannel" = 'BOOKING'
          AND other."id" <> et."id"
      )
  ) THEN
    RAISE EXCEPTION
      'catalog channel align conflict: cannot set BOOKING (name already taken in that channel). Manual review required — no rows deleted.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Align type channel to the linked event's publicSection (UPDATE only)
-- ---------------------------------------------------------------------------
UPDATE "event_types" AS et
SET "catalogChannel" = 'UPCOMING_HUB'
FROM "events" e
WHERE e."eventTypeId" = et."id"
  AND e."publicSection" = 'UPCOMING_EVENTS'
  AND et."catalogChannel" <> 'UPCOMING_HUB';

UPDATE "event_types" AS et
SET "catalogChannel" = 'BOOKING'
FROM "events" e
WHERE e."eventTypeId" = et."id"
  AND e."publicSection" = 'GENERAL'
  AND et."catalogChannel" <> 'BOOKING';

-- ---------------------------------------------------------------------------
-- 3) Trigger: keep Event.publicSection ↔ EventType.catalogChannel in sync
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_event_catalog_channel_match()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  type_channel "EventTypeCatalogChannel";
BEGIN
  SELECT et."catalogChannel" INTO type_channel
  FROM "event_types" et
  WHERE et."id" = NEW."eventTypeId";

  IF type_channel IS NULL THEN
    RAISE EXCEPTION 'Event type % not found for catalog channel check', NEW."eventTypeId";
  END IF;

  IF NEW."publicSection" = 'GENERAL' AND type_channel <> 'BOOKING' THEN
    RAISE EXCEPTION
      'catalog channel mismatch: GENERAL events require EventType.catalogChannel BOOKING (got %)',
      type_channel;
  END IF;

  IF NEW."publicSection" = 'UPCOMING_EVENTS' AND type_channel <> 'UPCOMING_HUB' THEN
    RAISE EXCEPTION
      'catalog channel mismatch: UPCOMING_EVENTS events require EventType.catalogChannel UPCOMING_HUB (got %)',
      type_channel;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_events_catalog_channel_match ON "events";

CREATE TRIGGER trg_events_catalog_channel_match
  BEFORE INSERT OR UPDATE OF "eventTypeId", "publicSection"
  ON "events"
  FOR EACH ROW
  EXECUTE PROCEDURE enforce_event_catalog_channel_match();
