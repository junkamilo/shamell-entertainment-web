-- Allow overnight arrival windows (e.g. 10:00 PM – 12:00 AM).
-- Ordering is validated in application code when both times are set.
ALTER TABLE "upcoming_fixed_event_packages"
  DROP CONSTRAINT IF EXISTS "chk_arrival_window";
