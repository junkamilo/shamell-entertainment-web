-- CreateTable
CREATE TABLE "venue_floor_layouts" (
    "id" TEXT NOT NULL,
    "viewBoxWidth" INTEGER NOT NULL DEFAULT 1200,
    "viewBoxHeight" INTEGER NOT NULL DEFAULT 900,
    "backgroundVersion" TEXT NOT NULL DEFAULT 'v1',
    "items" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_floor_layouts_pkey" PRIMARY KEY ("id")
);
