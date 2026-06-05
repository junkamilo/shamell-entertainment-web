-- Persist eager Cloudinary derivatives for About hero video (faster first paint).
ALTER TABLE "about_content" ADD COLUMN IF NOT EXISTS "videoDeliveryUrl" TEXT;
ALTER TABLE "about_content" ADD COLUMN IF NOT EXISTS "videoPosterUrl" TEXT;
