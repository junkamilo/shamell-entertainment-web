-- Add dedicated mobile focal point coordinates for hero framing.
ALTER TABLE "gallery_photos"
ADD COLUMN "focalMobileX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "focalMobileY" INTEGER NOT NULL DEFAULT 35;
