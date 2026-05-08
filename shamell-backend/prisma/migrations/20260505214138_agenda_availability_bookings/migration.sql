-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('CLIENT_REGISTERED', 'ADMIN_PHONE', 'ADMIN_FROM_CONTACT');

-- CreateEnum
CREATE TYPE "AvailabilityClosureKind" AS ENUM ('SPECIFIC_DATE', 'RECURRING_WEEKDAY');

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_userId_fkey";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "bookingDetails" JSONB,
ADD COLUMN     "createdByAdminId" TEXT,
ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "eventTypeId" TEXT,
ADD COLUMN     "guestEmail" TEXT,
ADD COLUMN     "guestFullName" TEXT,
ADD COLUMN     "guestPhone" TEXT,
ADD COLUMN     "occasionTypeId" TEXT,
ADD COLUMN     "source" "BookingSource" NOT NULL DEFAULT 'CLIENT_REGISTERED',
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "weekly_availability_slots" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_closures" (
    "id" TEXT NOT NULL,
    "kind" "AvailabilityClosureKind" NOT NULL,
    "date" DATE,
    "weekday" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_closures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_availability_slots_weekday_key" ON "weekly_availability_slots"("weekday");

-- CreateIndex
CREATE INDEX "availability_closures_kind_idx" ON "availability_closures"("kind");

-- CreateIndex
CREATE INDEX "bookings_eventDate_idx" ON "bookings"("eventDate");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_createdByAdminId_idx" ON "bookings"("createdByAdminId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_occasionTypeId_fkey" FOREIGN KEY ("occasionTypeId") REFERENCES "occasion_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
