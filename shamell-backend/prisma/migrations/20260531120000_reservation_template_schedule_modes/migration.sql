-- CreateEnum
CREATE TYPE "ReservationEventScheduleMode" AS ENUM ('FIXED_EVENT', 'RECURRING_WEEKLY');

-- AlterTable
ALTER TABLE "reservation_event_templates" ADD COLUMN "scheduleMode" "ReservationEventScheduleMode" NOT NULL DEFAULT 'FIXED_EVENT';
ALTER TABLE "reservation_event_templates" ADD COLUMN "salesStartDate" DATE;
ALTER TABLE "reservation_event_templates" ADD COLUMN "salesEndDate" DATE;
ALTER TABLE "reservation_event_templates" ADD COLUMN "eventDate" DATE;
ALTER TABLE "reservation_event_templates" ADD COLUMN "eventStartTime" TEXT;
ALTER TABLE "reservation_event_templates" ADD COLUMN "eventEndTime" TEXT;
ALTER TABLE "reservation_event_templates" ADD COLUMN "recurringEffectiveFrom" DATE;
ALTER TABLE "reservation_event_templates" ADD COLUMN "recurringStartTime" TEXT;
ALTER TABLE "reservation_event_templates" ADD COLUMN "recurringEndTime" TEXT;

-- Backfill FIXED_EVENT from legacy columns
UPDATE "reservation_event_templates"
SET
  "salesStartDate" = "startDate",
  "salesEndDate" = "endDate",
  "eventDate" = "endDate",
  "eventStartTime" = "startTime",
  "eventEndTime" = "endTime",
  "scheduleMode" = 'FIXED_EVENT'
WHERE "startDate" IS NOT NULL;

-- Templates with partial weekday selection -> RECURRING_WEEKLY
UPDATE "reservation_event_templates" t
SET
  "scheduleMode" = 'RECURRING_WEEKLY',
  "recurringEffectiveFrom" = CURRENT_DATE,
  "recurringStartTime" = t."startTime",
  "recurringEndTime" = t."endTime",
  "salesStartDate" = NULL,
  "salesEndDate" = NULL,
  "eventDate" = NULL,
  "eventStartTime" = NULL,
  "eventEndTime" = NULL
WHERE EXISTS (
  SELECT 1 FROM "reservation_event_weekdays" w
  WHERE w."templateId" = t.id AND w."isActive" = true
)
AND (
  SELECT COUNT(*) FROM "reservation_event_weekdays" w
  WHERE w."templateId" = t.id AND w."isActive" = true
) < 7;

-- Make legacy columns nullable
ALTER TABLE "reservation_event_templates" ALTER COLUMN "startDate" DROP NOT NULL;
ALTER TABLE "reservation_event_templates" ALTER COLUMN "endDate" DROP NOT NULL;
ALTER TABLE "reservation_event_templates" ALTER COLUMN "startTime" DROP NOT NULL;
ALTER TABLE "reservation_event_templates" ALTER COLUMN "endTime" DROP NOT NULL;
