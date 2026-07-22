-- DropEventMarketingFields
ALTER TABLE "events" DROP COLUMN IF EXISTS "tagline";
ALTER TABLE "events" DROP COLUMN IF EXISTS "marketingFeatures";
