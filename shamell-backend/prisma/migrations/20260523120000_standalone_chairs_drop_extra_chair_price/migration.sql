-- CreateTable
CREATE TABLE "venue_standalone_chair_configs" (
    "id" TEXT NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_standalone_chair_configs_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "venue_table_configs" DROP COLUMN "extraChairPrice";
