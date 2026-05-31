-- Backfill: publish per-event seat sales for any upcoming event already linked
-- to a FIXED_EVENT (seat sales) reservation template. Linking such a template
-- now auto-enables seat sales, so existing links should match that behavior.
UPDATE "upcoming_venue_configs" c
SET "clientEnabled" = true
FROM "reservation_event_templates" t
WHERE c."reservationEventTemplateId" = t."id"
  AND t."scheduleMode" = 'FIXED_EVENT'
  AND c."clientEnabled" = false;
