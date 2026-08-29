-- CreateEnum
CREATE TYPE "FixedTicketMode" AS ENUM ('SINGLE', 'PACKAGES');

-- AlterTable
ALTER TABLE "upcoming_venue_configs" ADD COLUMN "fixedTicketMode" "FixedTicketMode" NOT NULL DEFAULT 'SINGLE';

-- CreateTable
CREATE TABLE "upcoming_event_activities" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "shortLabel" VARCHAR(60),
    "description" TEXT,
    "accentColor" VARCHAR(9),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upcoming_event_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upcoming_fixed_event_packages" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "badge" VARCHAR(40),
    "priceCents" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "arrivalStartTime" TIME(0) NOT NULL,
    "arrivalEndTime" TIME(0),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upcoming_fixed_event_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upcoming_event_package_activities" (
    "packageId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "upcoming_event_package_activities_pkey" PRIMARY KEY ("packageId","activityId")
);

-- AlterTable
ALTER TABLE "upcoming_fixed_event_enrollments" ADD COLUMN "packageId" TEXT,
ADD COLUMN "packageTitle" VARCHAR(120),
ADD COLUMN "packagePriceCents" INTEGER,
ADD COLUMN "packageArrivalLabel" VARCHAR(40),
ADD COLUMN "packageInclusions" JSONB;

-- CreateIndex
CREATE INDEX "upcoming_event_activities_eventId_displayOrder_idx" ON "upcoming_event_activities"("eventId", "displayOrder");

-- CreateIndex
CREATE INDEX "upcoming_fixed_event_packages_eventId_displayOrder_idx" ON "upcoming_fixed_event_packages"("eventId", "displayOrder");

-- CreateIndex
CREATE INDEX "upcoming_fixed_event_enrollments_packageId_status_expiresAt_idx" ON "upcoming_fixed_event_enrollments"("packageId", "status", "expiresAt");

-- AddForeignKey
ALTER TABLE "upcoming_event_activities" ADD CONSTRAINT "upcoming_event_activities_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upcoming_fixed_event_packages" ADD CONSTRAINT "upcoming_fixed_event_packages_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upcoming_event_package_activities" ADD CONSTRAINT "upcoming_event_package_activities_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "upcoming_fixed_event_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upcoming_event_package_activities" ADD CONSTRAINT "upcoming_event_package_activities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "upcoming_event_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upcoming_fixed_event_enrollments" ADD CONSTRAINT "upcoming_fixed_event_enrollments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "upcoming_fixed_event_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Check constraints
ALTER TABLE "upcoming_venue_configs"
  ADD CONSTRAINT "chk_packages_xor_seating"
  CHECK (NOT ("clientEnabled" AND "fixedTicketMode" = 'PACKAGES'));

ALTER TABLE "upcoming_venue_configs"
  ADD CONSTRAINT "chk_capacity_by_mode"
  CHECK (
    "clientEnabled"
    OR ("fixedTicketMode" = 'SINGLE' AND "fixedTicketCapacity" IS NOT NULL)
    OR ("fixedTicketMode" = 'PACKAGES' AND "fixedTicketCapacity" IS NULL)
  );

ALTER TABLE "upcoming_fixed_event_packages"
  ADD CONSTRAINT "chk_package_price_cents" CHECK ("priceCents" >= 50);

ALTER TABLE "upcoming_fixed_event_packages"
  ADD CONSTRAINT "chk_package_capacity" CHECK ("capacity" >= 1);

ALTER TABLE "upcoming_fixed_event_packages"
  ADD CONSTRAINT "chk_arrival_window" CHECK ("arrivalEndTime" IS NULL OR "arrivalEndTime" >= "arrivalStartTime");

ALTER TABLE "upcoming_fixed_event_enrollments"
  ADD CONSTRAINT "chk_package_snapshot"
  CHECK ("packageId" IS NULL OR ("packageTitle" IS NOT NULL AND "packagePriceCents" IS NOT NULL));
