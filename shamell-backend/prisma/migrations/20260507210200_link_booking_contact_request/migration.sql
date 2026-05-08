-- AlterTable
ALTER TABLE "bookings"
ADD COLUMN "contactRequestId" TEXT;

-- CreateIndex
CREATE INDEX "bookings_contactRequestId_idx" ON "bookings"("contactRequestId");

-- AddForeignKey
ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_contactRequestId_fkey"
FOREIGN KEY ("contactRequestId") REFERENCES "contact_requests"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
