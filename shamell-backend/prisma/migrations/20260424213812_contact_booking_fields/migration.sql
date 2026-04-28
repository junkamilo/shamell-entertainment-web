-- AlterTable
ALTER TABLE "contact_requests" ADD COLUMN     "eventDate" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "preferences" TEXT,
ADD COLUMN     "serviceType" TEXT;
