-- FK was pointing at legacy table upcoming_class_sections instead of
-- reservation_event_class_sections, causing P2003 when inserting session rows.

ALTER TABLE "upcoming_class_sessions"
  DROP CONSTRAINT IF EXISTS "upcoming_class_sessions_sectionId_fkey";

ALTER TABLE "upcoming_class_sessions"
  ADD CONSTRAINT "upcoming_class_sessions_sectionId_fkey"
  FOREIGN KEY ("sectionId") REFERENCES "reservation_event_class_sections"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
