-- CreateTable
CREATE TABLE "venue_layout_client_settings" (
    "id" TEXT NOT NULL,
    "clientEnabled" BOOLEAN NOT NULL DEFAULT false,
    "promoTitle" TEXT,
    "promoDescription" TEXT,
    "promoImageUrl" TEXT,
    "promoImagePublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_layout_client_settings_pkey" PRIMARY KEY ("id")
);
