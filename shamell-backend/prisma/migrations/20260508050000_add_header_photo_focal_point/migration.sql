-- Add focal point coordinates for responsive hero framing.
ALTER TABLE "gallery_photos"
ADD COLUMN "focalX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "focalY" INTEGER NOT NULL DEFAULT 35;
