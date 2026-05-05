-- CreateEnum
CREATE TYPE "EventTypeOccasionUsage" AS ENUM ('OCCASION_SINGLE', 'BESPOKE_PROJECT', 'BESPOKE_ROLE');

-- AlterTable
ALTER TABLE "events" ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "occasion_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occasion_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type_occasions" (
    "id" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "occasionTypeId" TEXT NOT NULL,
    "usage" "EventTypeOccasionUsage" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_type_occasions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "occasion_types_name_key" ON "occasion_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "event_type_occasions_eventTypeId_occasionTypeId_key" ON "event_type_occasions"("eventTypeId", "occasionTypeId");

-- CreateIndex
CREATE INDEX "event_type_occasions_eventTypeId_idx" ON "event_type_occasions"("eventTypeId");

-- AddForeignKey
ALTER TABLE "event_type_occasions" ADD CONSTRAINT "event_type_occasions_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_type_occasions" ADD CONSTRAINT "event_type_occasions_occasionTypeId_fkey" FOREIGN KEY ("occasionTypeId") REFERENCES "occasion_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
