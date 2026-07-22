-- Class sections must always carry a label and their own price.
-- Backfill legacy rows before enforcing NOT NULL.

-- 1) Backfill missing labels with a stable "Section N" name.
UPDATE "reservation_event_class_sections"
SET "label" = 'Section ' || ("sortOrder" + 1)
WHERE "label" IS NULL OR btrim("label") = '';

-- 2) Backfill missing prices from the linked event base price (fallback 0).
UPDATE "reservation_event_class_sections" s
SET "defaultPrice" = COALESCE(
  (
    SELECT e."price"
    FROM "upcoming_venue_configs" c
    JOIN "events" e ON e."id" = c."eventId"
    WHERE c."reservationEventTemplateId" = s."templateId"
      AND e."price" IS NOT NULL
    ORDER BY c."updatedAt" DESC
    LIMIT 1
  ),
  0
)
WHERE s."defaultPrice" IS NULL;

-- 3) Enforce NOT NULL.
ALTER TABLE "reservation_event_class_sections"
  ALTER COLUMN "label" SET NOT NULL,
  ALTER COLUMN "defaultPrice" SET NOT NULL;
