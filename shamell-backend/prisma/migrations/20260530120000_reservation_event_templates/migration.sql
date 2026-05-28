-- CreateTable
CREATE TABLE "reservation_event_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_event_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_event_weekdays" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "reservation_event_weekdays_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "upcoming_venue_configs" ADD COLUMN "reservationEventTemplateId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "reservation_event_templates_name_key" ON "reservation_event_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_event_weekdays_templateId_weekday_key" ON "reservation_event_weekdays"("templateId", "weekday");

-- CreateIndex
CREATE INDEX "upcoming_venue_configs_reservationEventTemplateId_idx" ON "upcoming_venue_configs"("reservationEventTemplateId");

-- AddForeignKey
ALTER TABLE "reservation_event_weekdays" ADD CONSTRAINT "reservation_event_weekdays_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "reservation_event_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upcoming_venue_configs" ADD CONSTRAINT "upcoming_venue_configs_reservationEventTemplateId_fkey" FOREIGN KEY ("reservationEventTemplateId") REFERENCES "reservation_event_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
