-- CreateEnum
CREATE TYPE "ContactRequestStatus" AS ENUM ('PENDING', 'RESERVED', 'CANCELLED');

-- AlterTable
ALTER TABLE "contact_requests"
ADD COLUMN "status" "ContactRequestStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "contact_requests_status_idx" ON "contact_requests"("status");
