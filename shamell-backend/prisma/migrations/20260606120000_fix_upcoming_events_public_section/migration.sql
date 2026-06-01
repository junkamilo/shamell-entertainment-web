-- Events created for ON COMING may have been stored as GENERAL; mark them for the hub.
UPDATE "events"
SET "publicSection" = 'UPCOMING_EVENTS'
WHERE "publicSection" = 'GENERAL'
  AND (
    "slug" IS NOT NULL
    OR "experienceType" IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM "upcoming_venue_configs" u WHERE u."eventId" = "events"."id"
    )
    OR EXISTS (
      SELECT 1 FROM "upcoming_class_sessions" s WHERE s."eventId" = "events"."id"
    )
  );
