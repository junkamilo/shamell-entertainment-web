-- CreateTable
CREATE TABLE "venue_standalone_chairs" (
    "id" TEXT NOT NULL,
    "chairName" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_standalone_chairs_pkey" PRIMARY KEY ("id")
);
