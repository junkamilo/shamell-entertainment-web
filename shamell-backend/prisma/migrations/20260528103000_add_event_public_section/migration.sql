-- Create enum for public event section.
CREATE TYPE "EventPublicSection" AS ENUM ('GENERAL', 'UPCOMING_EVENTS');

-- Add section column to events so public surfaces can filter by section.
ALTER TABLE "events"
ADD COLUMN "publicSection" "EventPublicSection" NOT NULL DEFAULT 'GENERAL';
