-- CreateEnum
CREATE TYPE "VenueTableSize" AS ENUM ('LARGE', 'MEDIUM', 'SMALL');

-- CreateTable
CREATE TABLE "venue_table_configs" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "size" "VenueTableSize" NOT NULL,
    "includedChairs" INTEGER NOT NULL,
    "bundlePrice" DECIMAL(12,2) NOT NULL,
    "extraChairPrice" DECIMAL(12,2) NOT NULL,
    "visualX" DOUBLE PRECISION,
    "visualY" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_table_configs_pkey" PRIMARY KEY ("id")
);
