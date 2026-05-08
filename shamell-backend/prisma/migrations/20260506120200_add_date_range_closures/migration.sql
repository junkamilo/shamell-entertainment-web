-- AlterEnum
ALTER TYPE "AvailabilityClosureKind" ADD VALUE 'DATE_RANGE';

-- AlterTable
ALTER TABLE "availability_closures"
ADD COLUMN "startDate" DATE,
ADD COLUMN "endDate" DATE;
