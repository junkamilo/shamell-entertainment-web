-- CreateEnum
CREATE TYPE "VenueSeatReservationStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VenueSeatKind" AS ENUM ('CATALOG_TABLE', 'STANDALONE_CHAIR');

-- AlterTable
ALTER TABLE "venue_layout_client_settings" ADD COLUMN "reservationEventDate" TIMESTAMP(3),
ADD COLUMN "reservationEventLabel" TEXT,
ADD COLUMN "reservationTimezone" TEXT NOT NULL DEFAULT 'America/New_York';

-- CreateTable
CREATE TABLE "venue_seat_reservations" (
    "id" TEXT NOT NULL,
    "kind" "VenueSeatKind" NOT NULL,
    "venueTableConfigId" TEXT,
    "layoutItemId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "VenueSeatReservationStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_seat_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venue_seat_reservations_stripeCheckoutSessionId_key" ON "venue_seat_reservations"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "venue_seat_reservations_layoutItemId_eventDate_status_idx" ON "venue_seat_reservations"("layoutItemId", "eventDate", "status");

-- CreateIndex
CREATE INDEX "venue_seat_reservations_status_idx" ON "venue_seat_reservations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "venue_seat_reservations_venueTableConfigId_eventDate_key" ON "venue_seat_reservations"("venueTableConfigId", "eventDate");

-- AddForeignKey
ALTER TABLE "venue_seat_reservations" ADD CONSTRAINT "venue_seat_reservations_venueTableConfigId_fkey" FOREIGN KEY ("venueTableConfigId") REFERENCES "venue_table_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
