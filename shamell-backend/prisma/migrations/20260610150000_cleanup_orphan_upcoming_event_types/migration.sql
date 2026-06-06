-- Remove event types left behind after upcoming catalog events were deleted.
-- These were auto-created with only a name (no occasions / inquiry code).
DELETE FROM "event_types" AS et
WHERE NOT EXISTS (
  SELECT 1 FROM "events" AS e WHERE e."eventTypeId" = et."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "bookings" AS b WHERE b."eventTypeId" = et."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "gallery_photos" AS g WHERE g."eventTypeId" = et."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "event_type_occasions" AS o WHERE o."eventTypeId" = et."id"
)
AND et."contactInquiryCode" IS NULL;
