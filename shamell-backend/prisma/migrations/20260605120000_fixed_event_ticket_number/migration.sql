-- AlterTable
ALTER TABLE "upcoming_fixed_event_enrollments" ADD COLUMN "ticketNumber" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "upcoming_fixed_event_enrollments_eventId_ticketNumber_key" ON "upcoming_fixed_event_enrollments"("eventId", "ticketNumber");
